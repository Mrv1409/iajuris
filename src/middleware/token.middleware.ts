// src/middleware/token.middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { TokenService } from '@/services/token.service';
import { SubscriptionService } from '@/services/subscription.service';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firestore';

// 🚀 ESTIMATIVAS AJUSTADAS PARA DOCUMENTOS EXTENSOS (compatível com API)
// Baseado na configuração real da API com chunking e rate limiting
export const TOKEN_ESTIMATES = {
  CHAT_PUBLIC: 500,        // Chat público - mensagem média (mantido)
  PDF_ANALYSIS: 200000,    // 🚀 AUMENTADO: Análise PDF profissional (até 100+ páginas com chunking)
  DOC_GENERATION: 1500,    // Geração documento (máx 3000 chars) (mantido)
} as const;

export type TokenType = keyof typeof TOKEN_ESTIMATES;

// Lista de emails com acesso irrestrito para testes
const UNRESTRICTED_EMAILS = [
  'marvincosta321@gmail.com',    // Admin principal
  'iajuris1@outlook.com',        // Trial 1
  'iajuris2@outlook.com',        // Trial 2
  'iajuris3@outlook.com',        // Trial 3
  'iajuris4@outlook.com',        // Trial 4
  'iajuris5@outlook.com',        // Trial 5
  'iajuris6@outlook.com',        // Trial 6
  'iajuris7@outlook.com',        // Trial 7
  'iajuris8@outlook.com',        // Trial 8
  'iajuris9@outlook.com',        // Trial 9
  'iajuris10@outlook.com'        // Trial 10
];

// Interface para resposta de erro
interface TokenLimitError {
  error: string;
  code: 'DAILY_LIMIT' | 'MINUTE_LIMIT' | 'SUBSCRIPTION_INACTIVE' | 'INTERNAL_ERROR';
  limits?: {
    dailyUsed: number;
    dailyLimit: number;
    minuteUsed: number;
    minuteLimit: number;
  };
  retryAfter?: number; // segundos para retry
}

export class TokenMiddleware {
  
  // Verificar se o advogado tem acesso irrestrito
  static async hasUnrestrictedAccess(advogadoId: string): Promise<boolean> {
    try {
      const advogadoRef = doc(db, 'advogados', advogadoId);
      const advogadoSnap = await getDoc(advogadoRef);
      
      if (!advogadoSnap.exists()) {
        return false;
      }

      const data = advogadoSnap.data();
      const email = data.email?.toLowerCase();
      
      return UNRESTRICTED_EMAILS.includes(email);
    } catch (error) {
      console.error('Erro ao verificar acesso irrestrito:', error);
      return false;
    }
  }
  
  // 🚀 ATUALIZADA: Estimativa compatível com chunking da API
  static async estimatePdfAnalysisTokens(fileSize: number, pages?: number): Promise<number> {
    // Baseado na lógica real da API com chunking
    if (pages) {
      // ~1.500-2.000 tokens por página (incluindo chunking, overlap e consolidação)
      const baseTokens = pages * 1800;
      // Adiciona overhead para consolidação de múltiplos chunks
      const consolidationOverhead = pages > 20 ? baseTokens * 0.3 : baseTokens * 0.1;
      return Math.min(baseTokens + consolidationOverhead, 500000); // Cap aumentado
    }
    
    // Fallback baseado no tamanho do arquivo
    // PDF típico: ~2-3 tokens por byte considerando chunking
    const estimatedTokens = Math.ceil(fileSize / 2.5);
    return Math.min(estimatedTokens, 500000); // Cap aumentado para documentos extensos
  }
  
  // Verificar tokens antes da chamada IA
  static async checkTokens(
    advogadoId: string, 
    tokenType: TokenType,
    customTokenEstimate?: number
  ): Promise<{ success: true } | { success: false; error: TokenLimitError }> {
    try {
      // ✅ VERIFICAÇÃO DE ACESSO IRRESTRITO PRIMEIRO
      const hasUnrestrictedAccess = await this.hasUnrestrictedAccess(advogadoId);
      
      if (hasUnrestrictedAccess) {
        console.log(`🔓 Acesso irrestrito concedido para advogado ${advogadoId}`);
        return { success: true };
      }

      // 1. Verificar se assinatura está ativa
      const isActive = await SubscriptionService.isSubscriptionActive(advogadoId);
      if (!isActive) {
        return {
          success: false,
          error: {
            error: 'Assinatura inativa. Renove sua assinatura para continuar usando a IA.',
            code: 'SUBSCRIPTION_INACTIVE'
          }
        };
      }

      // 2. Verificar limites de tokens
      const tokensEstimados = customTokenEstimate || TOKEN_ESTIMATES[tokenType];
      
      // 🚀 LOG MELHORADO para debugging de documentos extensos
      console.log(`🧮 Verificação de tokens - Documentos Extensos:`, {
        advogadoId,
        tokenType,
        tokensEstimados,
        customEstimate: !!customTokenEstimate,
        isLargeDocument: tokensEstimados > 50000
      });
      
      const canUse = await TokenService.canUseTokens(advogadoId, tokensEstimados);

      if (!canUse.canUse) {
        let retryAfter: number | undefined;
        let code: 'DAILY_LIMIT' | 'MINUTE_LIMIT' = 'DAILY_LIMIT';

        if (canUse.reason?.includes('minuto')) {
          code = 'MINUTE_LIMIT';
          retryAfter = 60; // 1 minuto
        } else {
          code = 'DAILY_LIMIT';
          // Calcular segundos até meia-noite para retry
          const agora = new Date();
          const meiaNoite = new Date();
          meiaNoite.setHours(24, 0, 0, 0);
          retryAfter = Math.floor((meiaNoite.getTime() - agora.getTime()) / 1000);
        }

        // 🚀 LOG APRIMORADO para documentos extensos
        console.log(`⚠️ Limite de tokens excedido - Documento Extenso:`, {
          advogadoId,
          tokensEstimados,
          reason: canUse.reason,
          limits: canUse.limitsInfo,
          documentSize: tokensEstimados > 100000 ? 'VERY_LARGE' : tokensEstimados > 50000 ? 'LARGE' : 'MEDIUM'
        });

        return {
          success: false,
          error: {
            error: canUse.reason || 'Limite de tokens excedido',
            code,
            limits: canUse.limitsInfo,
            retryAfter
          }
        };
      }

      return { success: true };

    } catch (error) {
      console.error('Erro no middleware de tokens:', error);
      return {
        success: false,
        error: {
          error: 'Erro interno do servidor',
          code: 'INTERNAL_ERROR'
        }
      };
    }
  }

  // Incrementar tokens após chamada IA bem-sucedida
  static async incrementTokens(
    advogadoId: string, 
    tokensUsados: number
  ): Promise<void> {
    try {
      // ✅ PULAR INCREMENTO PARA ACESSO IRRESTRITO
      const hasUnrestrictedAccess = await this.hasUnrestrictedAccess(advogadoId);
      
      if (hasUnrestrictedAccess) {
        console.log(`🔓 Tokens não incrementados - acesso irrestrito para ${advogadoId}`);
        return;
      }

      // 🚀 LOG MELHORADO para documentos extensos
      console.log(`📊 Incrementando tokens - Documento Extenso:`, {
        advogadoId,
        tokensUsados,
        timestamp: new Date().toISOString(),
        isLargeDocument: tokensUsados > 50000
      });

      await TokenService.incrementTokenUsage(advogadoId, tokensUsados);
    } catch (error) {
      console.error('Erro ao incrementar tokens:', error);
      // Não falhar a requisição por erro de incremento
    }
  }

  // Middleware para Next.js API Routes
  static withTokenGuard(tokenType: TokenType) {//eslint-disable-next-line
    return function(handler: Function) {//eslint-disable-next-line
      return async function(req: NextRequest, context?: any) {
        try {
          // Extrair advogadoId do body/query/headers
          let advogadoId: string;
          
          if (req.method === 'POST') {
            const body = await req.json();
            advogadoId = body.advogadoId || body.userId;
          } else {
            const url = new URL(req.url);
            advogadoId = url.searchParams.get('advogadoId') || url.searchParams.get('userId') || '';
          }

          if (!advogadoId) {
            return NextResponse.json(
              { error: 'ID do advogado não informado' },
              { status: 400 }
            );
          }

          // Verificar tokens
          const tokenCheck = await TokenMiddleware.checkTokens(advogadoId, tokenType);
          
          if (!tokenCheck.success) {
            const status = tokenCheck.error.code === 'SUBSCRIPTION_INACTIVE' ? 402 : 429;
            return NextResponse.json(tokenCheck.error, { status });
          }

          // Continuar com o handler original
          return handler(req, context);
          
        } catch (error) {
          console.error('Erro no middleware:', error);
          return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
          );
        }
      };
    };
  }
}

// Helpers para uso direto nas páginas
export class TokenGuard {
  
  // Para Chat Público
  static async checkChatTokens(advogadoId: string) {
    return TokenMiddleware.checkTokens(advogadoId, 'CHAT_PUBLIC');
  }

  // 🚀 ATUALIZADO: Para Análise PDF com suporte a documentos extensos
  static async checkPdfTokens(advogadoId: string, customEstimate?: number) {
    return TokenMiddleware.checkTokens(advogadoId, 'PDF_ANALYSIS', customEstimate);
  }

  // Para Geração de Documentos
  static async checkDocTokens(advogadoId: string) {
    return TokenMiddleware.checkTokens(advogadoId, 'DOC_GENERATION');
  }

  // Incrementar tokens após uso
  static async recordTokenUsage(advogadoId: string, tokensUsados: number) {
    return TokenMiddleware.incrementTokens(advogadoId, tokensUsados);
  }

  // Obter estatísticas de uso
  static async getUsageStats(advogadoId: string) {
    return TokenService.getUsageStats(advogadoId);
  }

  // ✅ Verificar se tem acesso irrestrito
  static async hasUnrestrictedAccess(advogadoId: string) {
    return TokenMiddleware.hasUnrestrictedAccess(advogadoId);
  }

  // 🚀 ATUALIZADA: Estimativa dinâmica para PDF extensos
  static async estimatePdfTokens(fileSize: number, pages?: number) {
    return TokenMiddleware.estimatePdfAnalysisTokens(fileSize, pages);
  }
}

// 🚀 ATUALIZADO: Utilitário para estimar tokens compatível com chunking da API
export class TokenEstimator {
  
  // Estimativa simples: ~4 caracteres = 1 token (mantida da API)
  static estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  // 🚀 ATUALIZADA: Estimativa para PDF baseado em páginas (compatível com API)
  static estimatePdfTokens(numPages: number): number {
    // Fórmula alinhada com a API:
    // - ~1500-2000 tokens por página de texto
    // - Chunking e overlap adiciona overhead
    // - Consolidação adiciona overhead adicional
    const baseTokens = numPages * 1800;
    const chunkingOverhead = numPages > 20 ? baseTokens * 0.25 : baseTokens * 0.15;
    const consolidationOverhead = numPages > 50 ? baseTokens * 0.2 : baseTokens * 0.1;
    
    return Math.ceil(baseTokens + chunkingOverhead + consolidationOverhead);
  }

  // 🚀 ATUALIZADA: Estimativa baseada no tamanho do arquivo PDF (compatível com API)
  static estimatePdfTokensByFileSize(fileSizeBytes: number): number {
    // Alinhado com a API: PDF com chunking = ~2.5 bytes por token
    return Math.ceil(fileSizeBytes / 2.5);
  }

  // 🚀 ATUALIZADA: Estimativa híbrida (compatível com chunking da API)
  static estimatePdfTokensHybrid(fileSizeBytes: number, numPages?: number): number {
    if (numPages) {
      return this.estimatePdfTokens(numPages);
    } else {
      return this.estimatePdfTokensByFileSize(fileSizeBytes);
    }
  }

  // Verificar se texto excede limite de documento (3000 chars)
  static validateDocLength(text: string): { valid: boolean; length: number; maxLength: number } {
    const maxLength = 3000;
    return {
      valid: text.length <= maxLength,
      length: text.length,
      maxLength
    };
  }

  // 🚀 COMPLETAMENTE ATUALIZADA: Validar PDF extenso (compatível com API)
  static validatePdfSize(fileSizeBytes: number, numPages?: number): { 
    valid: boolean; 
    estimatedTokens: number; 
    maxTokens: number;
    recommendation?: string;
  } {
    const maxTokens = TOKEN_ESTIMATES.PDF_ANALYSIS; // 200k tokens
    const estimatedTokens = this.estimatePdfTokensHybrid(fileSizeBytes, numPages);
    
    const result = {
      valid: estimatedTokens <= maxTokens,
      estimatedTokens,
      maxTokens
    };

    if (!result.valid) {
      if (numPages && numPages > 150) {
        return {
          ...result,
          recommendation: `PDF muito extenso (${numPages} páginas). Para melhor performance, considere dividir em documentos de até 150 páginas.`
        };
      } else if (fileSizeBytes > 50 * 1024 * 1024) { // 50MB (limite da API)
        return {
          ...result,
          recommendation: `Arquivo muito grande (${Math.round(fileSizeBytes / 1024 / 1024)}MB). Limite máximo: 50MB por arquivo.`
        };
      } else {
        return {
          ...result,
          recommendation: `Documento requer muitos tokens (${Math.round(estimatedTokens/1000)}k). Considere um arquivo menor ou divida em partes.`
        };
      }
    }

    // Validações adicionais para documentos extensos
    if (numPages && numPages > 100) {
      return {
        ...result,
        recommendation: `Documento extenso (${numPages} páginas). O processamento pode levar vários minutos devido ao rate limiting da API.`
      };
    }

    return result;
  }

  // 🚀 NOVA: Validação específica para limites da API (50MB, rate limiting)
  static validateApiLimits(fileSizeBytes: number): {
    valid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    
    // Limite de tamanho da API
    if (fileSizeBytes > 50 * 1024 * 1024) { // 50MB
      issues.push(`Arquivo excede limite de 50MB (atual: ${Math.round(fileSizeBytes / 1024 / 1024)}MB)`);
    }
    
    // Aviso sobre tempo de processamento
    if (fileSizeBytes > 10 * 1024 * 1024) { // 10MB
      issues.push('Arquivo grande - processamento pode levar vários minutos');
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }
}
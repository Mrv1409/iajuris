// src/middleware/token.middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { TokenService } from '@/services/token.service';
import { SubscriptionService } from '@/services/subscription.service';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/firestore';

// Estimativas de tokens por funcionalidade
export const TOKEN_ESTIMATES = {
  CHAT_PUBLIC: 500,     // Chat público - mensagem média
  PDF_ANALYSIS: 25000,  // Análise PDF 50 páginas
  DOC_GENERATION: 1500, // Geração documento (máx 3000 chars)
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
  
  // Verificar tokens antes da chamada IA
  static async checkTokens(
    advogadoId: string, 
    tokenType: TokenType
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
      const tokensEstimados = TOKEN_ESTIMATES[tokenType];
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

  // Para Análise PDF
  static async checkPdfTokens(advogadoId: string) {
    return TokenMiddleware.checkTokens(advogadoId, 'PDF_ANALYSIS');
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

  // ✅ NOVA FUNÇÃO - Verificar se tem acesso irrestrito
  static async hasUnrestrictedAccess(advogadoId: string) {
    return TokenMiddleware.hasUnrestrictedAccess(advogadoId);
  }
}

// Utilitário para estimar tokens de texto
export class TokenEstimator {
  
  // Estimativa simples: ~4 caracteres = 1 token
  static estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  // Estimativa para PDF baseado em páginas
  static estimatePdfTokens(numPages: number): number {
    return numPages * 500; // ~500 tokens por página
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
}
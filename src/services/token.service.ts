// src/services/token.service.ts
import { db } from '@/firebase/firestore';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';

export interface TokenUsage {
  tokensDiarios: number;
  dataResetDiario: string; // YYYY-MM-DD
  tokensUltimoMinuto: number;
  timestampUltimoUso: number; // timestamp em milliseconds
  tokensHistoricoMinuto: Array<{ timestamp: number; tokens: number }>; // ✅ NOVO: Sliding window
}

export class TokenService {

  // 🚀 LIMITES ATUALIZADOS PARA GROQ + CHUNKS MÚLTIPLOS
  private static readonly LIMITE_TOKENS_DIA = 75000;     // ✅ Aumentado para chunks
  private static readonly LIMITE_TOKENS_MINUTO = 6000;   // ✅ Alinhado com TPM Groq
  private static readonly LIMITE_TOKENS_MES = 2250000;   // ✅ Proporcional ao novo limite diário
  
  // 🚀 CONFIGURAÇÕES PARA CHUNKS
  private static readonly BUFFER_CONSOLIDACAO = 1000;    // ✅ Tokens extras para consolidação
  private static readonly WINDOW_SEGUNDOS = 60;          // ✅ Janela de 60 segundos

  // Buscar uso atual de tokens
  static async getTokenUsage(advogadoId: string): Promise<TokenUsage> {
    try {
      const advogadoRef = doc(db, 'advogados', advogadoId);
      const advogadoSnap = await getDoc(advogadoRef);
      
      if (!advogadoSnap.exists()) {
        throw new Error('Advogado não encontrado');
      }

      const data = advogadoSnap.data();
      const hoje = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      // Se não tem dados de token ou mudou o dia, resetar
      if (!data.usoTokens || data.usoTokens.dataResetDiario !== hoje) {
        const novoUso: TokenUsage = {
          tokensDiarios: 0,
          dataResetDiario: hoje,
          tokensUltimoMinuto: 0,
          timestampUltimoUso: 0,
          tokensHistoricoMinuto: [] // ✅ NOVO
        };

        await updateDoc(advogadoRef, {
          usoTokens: novoUso,
          updatedAt: Timestamp.now()
        });

        return novoUso;
      }

      return {
        ...data.usoTokens,
        tokensHistoricoMinuto: data.usoTokens.tokensHistoricoMinuto || [] // ✅ Compatibilidade
      } as TokenUsage;
    } catch (error) {
      console.error('❌ Erro ao buscar uso de tokens:', error);
      throw error;
    }
  }

  // 🚀 NOVA: Calcular tokens no último minuto usando sliding window
  private static calculateTokensInLastMinute(historico: Array<{ timestamp: number; tokens: number }>): number {
    const agora = Date.now();
    const umMinutoAtras = agora - (this.WINDOW_SEGUNDOS * 1000);
    
    return historico
      .filter(entry => entry.timestamp > umMinutoAtras)
      .reduce((total, entry) => total + entry.tokens, 0);
  }

  // 🚀 NOVA: Estimar tokens para processamento com chunks
  static estimateTokensForPdfAnalysis(textLength: number, analysisType: string): {
    estimatedTokens: number;
    chunksEstimated: number;
    includesConsolidation: boolean;
  } {
    // Estimativa básica: ~4 caracteres por token
    const textTokens = Math.ceil(textLength / 4);
    
    // Configurações por tipo de análise (tokens de resposta)
    const responseTokens = {
      'resumo': 600,
      'timeline': 800,
      'partes': 500,
      'decisoes': 1000,
      'estrategia': 1200,
      'completa': 1500
    };

    const maxResponseTokens = responseTokens[analysisType as keyof typeof responseTokens] || 800;

    // Se documento pequeno (< 4000 tokens), processamento direto
    if (textTokens <= 4000) {
      return {
        estimatedTokens: textTokens + maxResponseTokens,
        chunksEstimated: 1,
        includesConsolidation: false
      };
    }

    // Documento grande: calcular chunks
    const chunksEstimated = Math.ceil(textTokens / 4000);
    
    // Tokens por chunk: texto + prompt + resposta
    const tokensPerChunk = 4000 + 200 + maxResponseTokens; // texto + prompt overhead + resposta
    
    // Total: (chunks * tokens_por_chunk) + consolidação
    const totalTokens = (chunksEstimated * tokensPerChunk) + this.BUFFER_CONSOLIDACAO;

    return {
      estimatedTokens: totalTokens,
      chunksEstimated,
      includesConsolidation: true
    };
  }

  // 🚀 VERIFICAÇÃO MELHORADA: Considera chunks múltiplos
  static async canUseTokens(advogadoId: string, tokensEstimados: number): Promise<{
    canUse: boolean;
    reason?: string;
    retryAfterSeconds?: number;
    limitsInfo: {
      dailyUsed: number;
      dailyLimit: number;
      minuteUsed: number;
      minuteLimit: number;
      estimatedProcessingTime?: number; // ✅ NOVO: tempo estimado em minutos
    }
  }> {
    try {
      const tokenUsage = await this.getTokenUsage(advogadoId);
      
      // 🚀 CÁLCULO SLIDING WINDOW
      const tokensUltimoMinuto = this.calculateTokensInLastMinute(tokenUsage.tokensHistoricoMinuto || []);

      const limitsInfo = {
        dailyUsed: tokenUsage.tokensDiarios,
        dailyLimit: this.LIMITE_TOKENS_DIA,
        minuteUsed: tokensUltimoMinuto,
        minuteLimit: this.LIMITE_TOKENS_MINUTO,
        estimatedProcessingTime: Math.ceil(tokensEstimados / this.LIMITE_TOKENS_MINUTO) // minutos
      };

      // Verificar limite diário
      if (tokenUsage.tokensDiarios + tokensEstimados > this.LIMITE_TOKENS_DIA) {
        return {
          canUse: false,
          reason: `Limite diário excedido. Usado: ${tokenUsage.tokensDiarios}/${this.LIMITE_TOKENS_DIA} tokens`,
          limitsInfo
        };
      }

      // 🚀 VERIFICAÇÃO INTELIGENTE: Se vai ultrapassar TPM, calcular tempo de espera
      if (tokensUltimoMinuto + tokensEstimados > this.LIMITE_TOKENS_MINUTO) {
        // Encontrar o token mais antigo que ainda está na janela
        const agora = Date.now();
        const historico = tokenUsage.tokensHistoricoMinuto || [];
        const tokensOrdenados = historico
          .filter(entry => entry.timestamp > agora - 60000)
          .sort((a, b) => a.timestamp - b.timestamp);

        if (tokensOrdenados.length > 0) {
          const tempoParaLiberar = Math.ceil((tokensOrdenados[0].timestamp + 60000 - agora) / 1000);
          return {
            canUse: false,
            reason: `Limite por minuto excedido. Usado: ${tokensUltimoMinuto}/${this.LIMITE_TOKENS_MINUTO} tokens`,
            retryAfterSeconds: Math.max(tempoParaLiberar, 1),
            limitsInfo
          };
        }
      }

      return {
        canUse: true,
        limitsInfo
      };
    } catch (error) {
      console.error('❌ Erro ao verificar limites de token:', error);
      return {
        canUse: false,
        reason: 'Erro interno do servidor',
        limitsInfo: {
          dailyUsed: 0,
          dailyLimit: this.LIMITE_TOKENS_DIA,
          minuteUsed: 0,
          minuteLimit: this.LIMITE_TOKENS_MINUTO
        }
      };
    }
  }

  // 🚀 INCREMENTO MELHORADO: Sliding window + melhor tracking
  static async incrementTokenUsage(advogadoId: string, tokensUsados: number): Promise<void> {
    try {
      const tokenUsage = await this.getTokenUsage(advogadoId);
      const agora = Date.now();
      
      // 🚀 ATUALIZAR HISTÓRICO SLIDING WINDOW
      const novoHistorico = [
        ...(tokenUsage.tokensHistoricoMinuto || []),
        { timestamp: agora, tokens: tokensUsados }
      ];

      // Limpar entradas antigas (> 60 segundos)
      const historicoLimpo = novoHistorico.filter(
        entry => entry.timestamp > agora - (this.WINDOW_SEGUNDOS * 1000)
      );

      // Recalcular tokens do último minuto
      const tokensUltimoMinuto = this.calculateTokensInLastMinute(historicoLimpo);

      const novoUso: TokenUsage = {
        tokensDiarios: tokenUsage.tokensDiarios + tokensUsados,
        dataResetDiario: tokenUsage.dataResetDiario,
        tokensUltimoMinuto, // ✅ Calculado dinamicamente
        timestampUltimoUso: agora,
        tokensHistoricoMinuto: historicoLimpo // ✅ Sliding window
      };

      const advogadoRef = doc(db, 'advogados', advogadoId);
      await updateDoc(advogadoRef, {
        usoTokens: novoUso,
        updatedAt: Timestamp.now()
      });

      console.log(`✅ Tokens incrementados para ${advogadoId}:`, {
        tokensUsados,
        totalDiario: novoUso.tokensDiarios,
        ultimoMinuto: tokensUltimoMinuto,
        historicoEntries: historicoLimpo.length
      });
    } catch (error) {
      console.error('❌ Erro ao incrementar tokens:', error);
      throw error;
    }
  }

  // 🚀 ESTATÍSTICAS MELHORADAS
  static async getUsageStats(advogadoId: string): Promise<{
    dailyUsage: {
      used: number;
      limit: number;
      percentage: number;
    };
    minuteUsage: {
      used: number;
      limit: number;
      percentage: number;
      timeUntilReset: number; // ✅ NOVO: segundos até reset
    };
    monthlyEstimate: {
      used: number;
      limit: number;
      percentage: number;
      daysInMonth: number;
    };
    chunkingInfo: {
      canProcessLargeDocuments: boolean;
      estimatedChunksPerDay: number;
    };
  }> {
    try {
      const tokenUsage = await this.getTokenUsage(advogadoId);
      
      // 🚀 CÁLCULO SLIDING WINDOW
      const tokensUltimoMinuto = this.calculateTokensInLastMinute(tokenUsage.tokensHistoricoMinuto || []);
      
      // Calcular tempo até o reset (baseado no token mais antigo)
      const agora = Date.now();
      const historico = tokenUsage.tokensHistoricoMinuto || [];
      const tokenMaisAntigo = historico
        .filter(entry => entry.timestamp > agora - 60000)
        .sort((a, b) => a.timestamp - b.timestamp)[0];
      
      const timeUntilReset = tokenMaisAntigo ? 
        Math.max(0, Math.ceil((tokenMaisAntigo.timestamp + 60000 - agora) / 1000)) : 0;

      // Calcular estimativa mensal
      const hoje = new Date();
      const diaDoMes = hoje.getDate();
      const diasNoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
      const estimativaMensal = (tokenUsage.tokensDiarios / diaDoMes) * diasNoMes;

      // Calcular capacidade para documentos grandes
      const tokensRestantesDia = this.LIMITE_TOKENS_DIA - tokenUsage.tokensDiarios;
      const estimatedChunksPerDay = Math.floor(tokensRestantesDia / 5000); // ~5K tokens por chunk médio

      return {
        dailyUsage: {
          used: tokenUsage.tokensDiarios,
          limit: this.LIMITE_TOKENS_DIA,
          percentage: Math.round((tokenUsage.tokensDiarios / this.LIMITE_TOKENS_DIA) * 100)
        },
        minuteUsage: {
          used: tokensUltimoMinuto,
          limit: this.LIMITE_TOKENS_MINUTO,
          percentage: Math.round((tokensUltimoMinuto / this.LIMITE_TOKENS_MINUTO) * 100),
          timeUntilReset
        },
        monthlyEstimate: {
          used: Math.round(estimativaMensal),
          limit: this.LIMITE_TOKENS_MES,
          percentage: Math.round((estimativaMensal / this.LIMITE_TOKENS_MES) * 100),
          daysInMonth: diasNoMes
        },
        chunkingInfo: {
          canProcessLargeDocuments: estimatedChunksPerDay > 0,
          estimatedChunksPerDay
        }
      };
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error);
      throw error;
    }
  }

  // 🚀 FUNÇÃO NOVA: Validar se pode processar documento específico
  static async canProcessDocument(advogadoId: string, textLength: number, analysisType: string): Promise<{
    canProcess: boolean;
    reason?: string;
    estimation: {
      chunks: number;
      totalTokens: number;
      estimatedTimeMinutes: number;
    };
    retryAfterSeconds?: number;
  }> {
    try {
      const estimation = this.estimateTokensForPdfAnalysis(textLength, analysisType);
      const canUseResult = await this.canUseTokens(advogadoId, estimation.estimatedTokens);

      return {
        canProcess: canUseResult.canUse,
        reason: canUseResult.reason,
        estimation: {
          chunks: estimation.chunksEstimated,
          totalTokens: estimation.estimatedTokens,
          estimatedTimeMinutes: canUseResult.limitsInfo.estimatedProcessingTime || 1
        },
        retryAfterSeconds: canUseResult.retryAfterSeconds
      };
    } catch (error) {
      console.error('❌ Erro ao validar processamento de documento:', error);
      return {
        canProcess: false,
        reason: 'Erro interno do servidor',
        estimation: {
          chunks: 0,
          totalTokens: 0,
          estimatedTimeMinutes: 0
        }
      };
    }
  }

  // Reset manual de tokens (admin/debug)
  static async resetDailyTokens(advogadoId: string): Promise<void> {
    try {
      const hoje = new Date().toISOString().split('T')[0];
      const novoUso: TokenUsage = {
        tokensDiarios: 0,
        dataResetDiario: hoje,
        tokensUltimoMinuto: 0,
        timestampUltimoUso: 0,
        tokensHistoricoMinuto: [] // ✅ NOVO
      };

      const advogadoRef = doc(db, 'advogados', advogadoId);
      await updateDoc(advogadoRef, {
        usoTokens: novoUso,
        updatedAt: Timestamp.now()
      });

      console.log(`✅ Tokens resetados para ${advogadoId}`);
    } catch (error) {
      console.error('❌ Erro ao resetar tokens:', error);
      throw error;
    }
  }

  // 🚀 FUNÇÃO NOVA: Cleanup periódico do histórico (pode ser chamada periodicamente)
  static async cleanupTokenHistory(advogadoId: string): Promise<void> {
    try {
      const tokenUsage = await this.getTokenUsage(advogadoId);
      const agora = Date.now();
      
      // Limpar entradas antigas
      const historicoLimpo = (tokenUsage.tokensHistoricoMinuto || [])
        .filter(entry => entry.timestamp > agora - (this.WINDOW_SEGUNDOS * 1000));

      if (historicoLimpo.length !== (tokenUsage.tokensHistoricoMinuto?.length || 0)) {
        const tokensUltimoMinuto = this.calculateTokensInLastMinute(historicoLimpo);
        
        const novoUso: TokenUsage = {
          ...tokenUsage,
          tokensUltimoMinuto,
          tokensHistoricoMinuto: historicoLimpo
        };

        const advogadoRef = doc(db, 'advogados', advogadoId);
        await updateDoc(advogadoRef, {
          usoTokens: novoUso,
          updatedAt: Timestamp.now()
        });

        console.log(`🧹 Histórico limpo para ${advogadoId}: ${(tokenUsage.tokensHistoricoMinuto?.length || 0) - historicoLimpo.length} entradas removidas`);
      }
    } catch (error) {
      console.error('❌ Erro no cleanup do histórico:', error);
    }
  }
}
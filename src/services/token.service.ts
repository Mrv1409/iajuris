// src/services/token.service.ts
import { db } from '@/firebase/firestore';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';

export interface TokenUsage {
  tokensDiarios: number;
  dataResetDiario: string; // YYYY-MM-DD
  tokensUltimoMinuto: number;
  timestampUltimoUso: number; // timestamp em milliseconds
}

export class TokenService {
  // LIMITES POR CLIENTE (baseado em 30 clientes)
  private static readonly LIMITE_TOKENS_DIA = 16700;  // 500K ÷ 30 dias
  private static readonly LIMITE_TOKENS_MINUTO = 200; // 6K ÷ 30 clientes
  private static readonly LIMITE_TOKENS_MES = 500000; // 500K por cliente

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
          timestampUltimoUso: 0
        };

        await updateDoc(advogadoRef, {
          usoTokens: novoUso,
          updatedAt: Timestamp.now()
        });

        return novoUso;
      }

      return data.usoTokens as TokenUsage;
    } catch (error) {
      console.error('Erro ao buscar uso de tokens:', error);
      throw error;
    }
  }

  // Verificar se pode usar tokens (ANTES da chamada IA)
  static async canUseTokens(advogadoId: string, tokensEstimados: number): Promise<{
    canUse: boolean;
    reason?: string;
    limitsInfo: {
      dailyUsed: number;
      dailyLimit: number;
      minuteUsed: number;
      minuteLimit: number;
    }
  }> {
    try {
      const tokenUsage = await this.getTokenUsage(advogadoId);
      const agora = Date.now();
      
      // Reset tokens do último minuto se passou mais de 1 minuto
      let tokensUltimoMinuto = tokenUsage.tokensUltimoMinuto;
      if (agora - tokenUsage.timestampUltimoUso > 60000) { // 60 segundos
        tokensUltimoMinuto = 0;
      }

      const limitsInfo = {
        dailyUsed: tokenUsage.tokensDiarios,
        dailyLimit: this.LIMITE_TOKENS_DIA,
        minuteUsed: tokensUltimoMinuto,
        minuteLimit: this.LIMITE_TOKENS_MINUTO
      };

      // Verificar limite diário
      if (tokenUsage.tokensDiarios + tokensEstimados > this.LIMITE_TOKENS_DIA) {
        return {
          canUse: false,
          reason: `Limite diário excedido. Usado: ${tokenUsage.tokensDiarios}/${this.LIMITE_TOKENS_DIA} tokens`,
          limitsInfo
        };
      }

      // Verificar limite por minuto
      if (tokensUltimoMinuto + tokensEstimados > this.LIMITE_TOKENS_MINUTO) {
        return {
          canUse: false,
          reason: `Limite por minuto excedido. Usado: ${tokensUltimoMinuto}/${this.LIMITE_TOKENS_MINUTO} tokens`,
          limitsInfo
        };
      }

      return {
        canUse: true,
        limitsInfo
      };
    } catch (error) {
      console.error('Erro ao verificar limites de token:', error);
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

  // Incrementar uso de tokens (DEPOIS da chamada IA)
  static async incrementTokenUsage(advogadoId: string, tokensUsados: number): Promise<void> {
    try {
      const tokenUsage = await this.getTokenUsage(advogadoId);
      const agora = Date.now();
      
      // Reset tokens do último minuto se passou mais de 1 minuto
      let tokensUltimoMinuto = tokenUsage.tokensUltimoMinuto;
      if (agora - tokenUsage.timestampUltimoUso > 60000) {
        tokensUltimoMinuto = 0;
      }

      const novoUso: TokenUsage = {
        tokensDiarios: tokenUsage.tokensDiarios + tokensUsados,
        dataResetDiario: tokenUsage.dataResetDiario,
        tokensUltimoMinuto: tokensUltimoMinuto + tokensUsados,
        timestampUltimoUso: agora
      };

      const advogadoRef = doc(db, 'advogados', advogadoId);
      await updateDoc(advogadoRef, {
        usoTokens: novoUso,
        updatedAt: Timestamp.now()
      });

      console.log(`Tokens incrementados para ${advogadoId}: +${tokensUsados} (Total diário: ${novoUso.tokensDiarios})`);
    } catch (error) {
      console.error('Erro ao incrementar tokens:', error);
      throw error;
    }
  }

  // Obter estatísticas de uso
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
    };
    monthlyEstimate: {
      used: number;
      limit: number;
      percentage: number;
      daysInMonth: number;
    };
  }> {
    try {
      const tokenUsage = await this.getTokenUsage(advogadoId);
      const agora = Date.now();
      
      // Reset tokens do último minuto se necessário
      let tokensUltimoMinuto = tokenUsage.tokensUltimoMinuto;
      if (agora - tokenUsage.timestampUltimoUso > 60000) {
        tokensUltimoMinuto = 0;
      }

      // Calcular estimativa mensal (baseado no uso diário)
      const hoje = new Date();
      const diaDoMes = hoje.getDate();
      const diasNoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
      const estimativaMensal = (tokenUsage.tokensDiarios / diaDoMes) * diasNoMes;

      return {
        dailyUsage: {
          used: tokenUsage.tokensDiarios,
          limit: this.LIMITE_TOKENS_DIA,
          percentage: Math.round((tokenUsage.tokensDiarios / this.LIMITE_TOKENS_DIA) * 100)
        },
        minuteUsage: {
          used: tokensUltimoMinuto,
          limit: this.LIMITE_TOKENS_MINUTO,
          percentage: Math.round((tokensUltimoMinuto / this.LIMITE_TOKENS_MINUTO) * 100)
        },
        monthlyEstimate: {
          used: Math.round(estimativaMensal),
          limit: this.LIMITE_TOKENS_MES,
          percentage: Math.round((estimativaMensal / this.LIMITE_TOKENS_MES) * 100),
          daysInMonth: diasNoMes
        }
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      throw error;
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
        timestampUltimoUso: 0
      };

      const advogadoRef = doc(db, 'advogados', advogadoId);
      await updateDoc(advogadoRef, {
        usoTokens: novoUso,
        updatedAt: Timestamp.now()
      });

      console.log(`Tokens resetados para ${advogadoId}`);
    } catch (error) {
      console.error('Erro ao resetar tokens:', error);
      throw error;
    }
  }
}
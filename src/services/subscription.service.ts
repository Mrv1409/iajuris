// src/services/subscription.service.ts
import { db } from '@/firebase/firestore';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { stripe, SUBSCRIPTION_CONFIG } from '@/lib/stripe.config';

export interface AdvogadoSubscription {
  statusAssinatura: 'active' | 'inactive' | 'canceled' | 'past_due' | 'trialing';
  clienteStripeId: string | null;
  assinaturaId: string | null;
  planoAtual: 'profissional' | 'escritorio' | null;
  statusPagamento: 'paid' | 'failed' | 'pending' | 'canceled';
  dataFimAssinatura: string | null; // ISO string
  dataFimTrial?: string | null; // ISO string
  cancelAtPeriodEnd: boolean;
  limites: {
    consultasIA: number;
    pdfProcessados: number;
    loginsSimultaneos: number;
  };
  usoMensal: {
    consultasIA: number;
    pdfProcessados: number;
    dataReset: string; // ISO string
  };
  carteiraOab?: string;
  createdAt?: Timestamp;
  updatedAt: Timestamp;
}

export class SubscriptionService {
  // Verificar status da assinatura
  static async getSubscriptionStatus(advogadoId: string): Promise<AdvogadoSubscription | null> {
    try {
      const advogadoRef = doc(db, 'advogados', advogadoId);
      const advogadoSnap = await getDoc(advogadoRef);
      
      if (!advogadoSnap.exists()) {
        return null;
      }

      const data = advogadoSnap.data();
      
      // Montar objeto de assinatura a partir dos campos do documento
      if (!data.statusAssinatura) {
        return null;
      }

      return {
        statusAssinatura: data.statusAssinatura,
        clienteStripeId: data.clienteStripeId || null,
        assinaturaId: data.assinaturaId || null,
        planoAtual: data.planoAtual || null,
        statusPagamento: data.statusPagamento || 'pending',
        dataFimAssinatura: data.dataFimAssinatura || null,
        dataFimTrial: data.dataFimTrial || null,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd || false,
        limites: data.limites || {
          consultasIA: 0,
          pdfProcessados: 0,
          loginsSimultaneos: 1
        },
        usoMensal: data.usoMensal || {
          consultasIA: 0,
          pdfProcessados: 0,
          dataReset: new Date().toISOString()
        },
        carteiraOab: data.carteiraOab || null,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt || Timestamp.now(),
      };
    } catch (error) {
      console.error('Erro ao buscar assinatura:', error);
      return null;
    }
  }

  // Verificar se a assinatura está ativa
  static async isSubscriptionActive(advogadoId: string): Promise<boolean> {
    const subscription = await this.getSubscriptionStatus(advogadoId);
    
    if (!subscription) return false;
    
    // Verificar se está ativa e não expirou
    if (subscription.statusAssinatura === 'active' && subscription.dataFimAssinatura) {
      const now = new Date();
      const endDate = new Date(subscription.dataFimAssinatura);
      return now <= endDate;
    }
    
    // Se está em trial
    if (subscription.statusAssinatura === 'trialing' && subscription.dataFimTrial) {
      const now = new Date();
      const trialEnd = new Date(subscription.dataFimTrial);
      return now <= trialEnd;
    }
    
    return false;
  }

  // Verificar limites de uso - ✅ CORRIGIDO
  static async checkUsageLimit(advogadoId: string, tipo: 'consultasIA' | 'pdfProcessados'): Promise<boolean> {
    const subscription = await this.getSubscriptionStatus(advogadoId);
    
    if (!subscription || !(await this.isSubscriptionActive(advogadoId))) {
      return false;
    }

    const usado = subscription.usoMensal[tipo] || 0;
    const limite = subscription.limites[tipo] || 0;
    
    return usado < limite;
  }

  // Incrementar uso mensal
  static async incrementUsage(advogadoId: string, tipo: 'consultasIA' | 'pdfProcessados'): Promise<void> {
    try {
      const subscription = await this.getSubscriptionStatus(advogadoId);
      
      if (!subscription) return;

      // Verificar se precisa resetar o uso mensal
      const agora = new Date();
      const dataReset = new Date(subscription.usoMensal.dataReset);
      
      let novoUsoMensal = subscription.usoMensal;
      
      // Se passou um mês, resetar
      if (agora.getMonth() !== dataReset.getMonth() || agora.getFullYear() !== dataReset.getFullYear()) {
        novoUsoMensal = {
          consultasIA: 0,
          pdfProcessados: 0,
          dataReset: agora.toISOString()
        };
      }

      // Incrementar o uso
      novoUsoMensal[tipo] += 1;

      await this.updateSubscriptionData(advogadoId, {
        usoMensal: novoUsoMensal,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Erro ao incrementar uso:', error);
    }
  }

  // Criar customer no Stripe
  static async createStripeCustomer(advogadoId: string, email: string, name: string) {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          advogadoId: advogadoId,
        },
      });

      // Salvar Customer ID no Firestore
      await this.updateSubscriptionData(advogadoId, {
        clienteStripeId: customer.id,
        updatedAt: Timestamp.now(),
      });

      return customer;
    } catch (error) {
      console.error('Erro ao criar customer:', error);
      throw error;
    }
  }

  // Criar sessão de checkout
  static async createCheckoutSession(
    advogadoId: string,
    email: string,
    name: string,
    plano: 'profissional' | 'escritorio',
    successUrl: string,
    cancelUrl: string
  ) {
    try {
      // Verificar se já tem customer
      let customerId = await this.getStripeCustomerId(advogadoId);
      
      if (!customerId) {
        const customer = await this.createStripeCustomer(advogadoId, email, name);
        customerId = customer.id;
      }

      // Definir price_id baseado no plano
      let priceId: string;
      
      if (plano === 'profissional') {
        priceId = SUBSCRIPTION_CONFIG.plans.profissional?.priceId || 'price_1S0mgDDFq6ALe0I1KlKC1mrD'; // R$ 247
      } else {
        priceId = SUBSCRIPTION_CONFIG.plans.escritorio?.priceId || 'price_1RzQkuDFq6ALe0I14czUgLBr'; // R$ 297
      }

      // Criar sessão de checkout
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          advogadoId: advogadoId,
          planoEscolhido: plano,
        },
      });

      return session;
    } catch (error) {
      console.error('Erro ao criar checkout session:', error);
      throw error;
    }
  }

  // Buscar Customer ID
  static async getStripeCustomerId(advogadoId: string): Promise<string | null> {
    const subscription = await this.getSubscriptionStatus(advogadoId);
    return subscription?.clienteStripeId || null;
  }

  // Atualizar dados da assinatura - DIRETO NO DOCUMENTO
  static async updateSubscriptionData(
    advogadoId: string, 
    data: Partial<AdvogadoSubscription>
  ) {
    try {
      const advogadoRef = doc(db, 'advogados', advogadoId);
      
      // Atualizar campos DIRETO no documento (sem prefixo)
      await updateDoc(advogadoRef, {
        ...data,
        updatedAt: Timestamp.now(),
      });

      console.log('Dados da assinatura atualizados para:', advogadoId);
    } catch (error) {
      console.error('Erro ao atualizar assinatura:', error);
      throw error;
    }
  }

  // Criar portal do cliente
  static async createCustomerPortal(advogadoId: string, returnUrl: string) {
    try {
      const customerId = await this.getStripeCustomerId(advogadoId);
      
      if (!customerId) {
        throw new Error('Customer não encontrado');
      }

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });

      return portalSession;
    } catch (error) {
      console.error('Erro ao criar portal:', error);
      throw error;
    }
  }

  // Cancelar assinatura
  static async cancelSubscription(advogadoId: string) {
    try {
      const subscription = await this.getSubscriptionStatus(advogadoId);
      
      if (!subscription?.assinaturaId) {
        throw new Error('Assinatura não encontrada');
      }

      await stripe.subscriptions.update(subscription.assinaturaId, {
        cancel_at_period_end: true,
      });

      await this.updateSubscriptionData(advogadoId, {
        cancelAtPeriodEnd: true,
        updatedAt: Timestamp.now(),
      });

      console.log('Assinatura cancelada para:', advogadoId);
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error);
      throw error;
    }
  }

  // Obter limites do plano
  static getLimitesPlano(plano: 'profissional' | 'escritorio') {
    if (plano === 'escritorio') {
      return {
        consultasIA: 1500,
        pdfProcessados: 150,
        loginsSimultaneos: 3
      };
    } else {
      return {
        consultasIA: 500,
        pdfProcessados: 50,
        loginsSimultaneos: 1
      };
    }
  }

  // Criar conta de teste gratuito (72h)
  static async createTrialAccount(
    advogadoId: string, 
    plano: 'profissional' | 'escritorio' = 'profissional',
    horasValidas: number = 72
  ): Promise<void> {
    try {
      const dataFimTrial = new Date();
      dataFimTrial.setHours(dataFimTrial.getHours() + horasValidas);
      
      const limites = this.getLimitesPlano(plano);
      
      await this.updateSubscriptionData(advogadoId, {
        statusAssinatura: 'trialing',
        dataFimTrial: dataFimTrial.toISOString(),
        planoAtual: plano,
        statusPagamento: 'pending',
        cancelAtPeriodEnd: false,
        limites: limites,
        usoMensal: {
          consultasIA: 0,
          pdfProcessados: 0,
          dataReset: new Date().toISOString()
        },
        updatedAt: Timestamp.now(),
      });

      console.log(`Conta trial criada para: ${advogadoId} - ${horasValidas}h válidas - Plano: ${plano}`);
    } catch (error) {
      console.error('Erro ao criar conta trial:', error);
      throw error;
    }
  }
}
// src/services/subscription.service.ts
import { db } from '@/firebase/firestore';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { stripe, SUBSCRIPTION_CONFIG } from '@/lib/stripe.config';

export interface AdvogadoSubscription {
  status: 'active' | 'inactive' | 'canceled' | 'past_due';
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  planId: string | null;
  currentPeriodEnd: Timestamp; // Firestore timestamp
  cancelAtPeriodEnd: boolean;
  createdAt: Timestamp;
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
      return data.subscription || null;
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
    if (subscription.status === 'active' && subscription.currentPeriodEnd) {
      const now = new Date();
      const endDate = subscription.currentPeriodEnd.toDate();
      return now <= endDate;
    }
    
    return false;
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
        stripeCustomerId: customer.id,
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

      // Criar sessão de checkout
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: SUBSCRIPTION_CONFIG.plans.basico.priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          advogadoId: advogadoId,
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
    return subscription?.stripeCustomerId || null;
  }

  // Atualizar dados da assinatura - CORRIGIDO
  static async updateSubscriptionData(
    advogadoId: string, 
    data: Partial<AdvogadoSubscription>
  ) {
    try {
      const advogadoRef = doc(db, 'advogados', advogadoId);
      
      // Criar objeto com prefixo 'subscription.' nas chaves
      const updateData = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [`subscription.${key}`, value])
      );

      await updateDoc(advogadoRef, updateData);
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
      
      if (!subscription?.stripeSubscriptionId) {
        throw new Error('Assinatura não encontrada');
      }

      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });

      await this.updateSubscriptionData(advogadoId, {
        cancelAtPeriodEnd: true,
        updatedAt: Timestamp.now(),
      });

    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error);
      throw error;
    }
  }
}
// src/hooks/useSubscription.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { AdvogadoSubscription } from '@/services/subscription.service';

// 🆕 NOVAS INTERFACES PARA LIMITAÇÕES
interface PlanLimitations {
  // IA Configuration
  iaProvider: 'groq' | 'chatgpt';
  
  // Access Limits
  maxEmails: number;
  
  // Features Access
  canAccessFinancial: boolean;
  canAccessClients: boolean;
  canAccessCalculator: boolean;
  canAccessDeadlines: boolean;
  canAccessProfessional: boolean;
  canAccessDocGeneration: boolean;
  canAccessPdfAnalysis: boolean;
  
  // Customization
  canCustomizeColors: boolean;
  canCustomizeLogo: boolean;
  canCustomizeImage: boolean;
  
  // Usage Limits
  monthlyIAQueries: number;
  monthlyPdfProcessing: number;
  simultaneousLogins: number;
}

interface UseSubscriptionReturn {
  // ✅ MANTIDOS (já existiam)
  isActive: boolean;
  subscription: AdvogadoSubscription | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  openPaymentModal: () => void;
  openCustomerPortal: () => Promise<void>;
  
  // 🆕 NOVOS - LIMITAÇÕES POR PLANO
  planType: 'profissional' | 'escritorio' | null;
  limitations: PlanLimitations;
  currentUsage: {
    iaQueries: number;
    pdfProcessed: number;
  };
  
  // 🆕 NOVOS - MÉTODOS UTILITÁRIOS
  canUseFeature: (feature: keyof PlanLimitations) => boolean;
  hasReachedLimit: (type: 'consultasIA' | 'pdfProcessados') => boolean;
  getRemainingUsage: (type: 'consultasIA' | 'pdfProcessados') => number;
}

// 🆕 LIMITAÇÕES POR PLANO
const PLAN_LIMITATIONS: Record<'profissional' | 'escritorio', PlanLimitations> = {
  profissional: {
    // IA: Groq
    iaProvider: 'groq',
    
    // Access: 1 email
    maxEmails: 1,
    
    
    canAccessFinancial: true,
    canAccessClients: true,
    canAccessCalculator: true,
    canAccessDeadlines: true,
    canAccessProfessional: true,
    canAccessDocGeneration: true,
    canAccessPdfAnalysis: true,
    
  
    canCustomizeColors: true,
    canCustomizeLogo: false,
    canCustomizeImage: true,
    
    // Usage Limits
    monthlyIAQueries: 500,
    monthlyPdfProcessing: 50,
    simultaneousLogins: 1,
  },
  escritorio: {
    // IA: ChatGPT
    iaProvider: 'chatgpt',
    
    // Access: 3 emails
    maxEmails: 3,
    
    // Features: COM Gestão Financeira - TUDO LIBERADO
    canAccessFinancial: true,
    canAccessClients: true,
    canAccessCalculator: true,
    canAccessDeadlines: true,
    canAccessProfessional: true,
    canAccessDocGeneration: true,
    canAccessPdfAnalysis: true,
    
    // Customization: cores + logo + imagem
    canCustomizeColors: true,
    canCustomizeLogo: true,
    canCustomizeImage: true,
    
    // Usage Limits
    monthlyIAQueries: 1500,
    monthlyPdfProcessing: 150,
    simultaneousLogins: 3,
  },
};

// 🆕 LIMITAÇÕES PADRÃO (sem assinatura ativa)
const DEFAULT_LIMITATIONS: PlanLimitations = {
  iaProvider: 'groq',
  maxEmails: 1,
  canAccessFinancial: false,
  canAccessClients: false,
  canAccessCalculator: false,
  canAccessDeadlines: false,
  canAccessProfessional: false,
  canAccessDocGeneration: false,
  canAccessPdfAnalysis: false,
  canCustomizeColors: false,
  canCustomizeLogo: false,
  canCustomizeImage: false,
  monthlyIAQueries: 0,
  monthlyPdfProcessing: 0,
  simultaneousLogins: 1,
};

export function useSubscription(): UseSubscriptionReturn {
  const { data: session, status } = useSession();
  
  // ✅ ESTADOS EXISTENTES (mantidos)
  const [isActive, setIsActive] = useState(false);
  const [subscription, setSubscription] = useState<AdvogadoSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  //eslint-disable-next-line
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // ✅ FUNÇÃO EXISTENTE (mantida, só corrigir método)
  const fetchSubscriptionStatus = useCallback(async () => {
    if (status === 'loading' || !session?.user?.id) {
      return;
    }

    try {
      setError(null);
      setIsLoading(true);

      // 🔧 CORRIGIR: usar POST e enviar userId
      const response = await fetch('/api/subscription/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao verificar assinatura');
      }

      const data = await response.json();
      setIsActive(data.isActive);
      setSubscription(data.subscription);

    } catch (err) {
      console.error('Erro ao buscar status da assinatura:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setIsActive(false);
      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, status]);

  // ✅ EFFECT EXISTENTE (mantido)
  useEffect(() => {
    fetchSubscriptionStatus();
  }, [fetchSubscriptionStatus]);

  // ✅ FUNÇÕES EXISTENTES (mantidas)
  const refetch = useCallback(async () => {
    await fetchSubscriptionStatus();
  }, [fetchSubscriptionStatus]);

  const openPaymentModal = useCallback(() => {
    setShowPaymentModal(true);
  }, []);

  const createCheckoutSession = useCallback(async () => {
    if (!session?.user) {
      setError('Usuário não autenticado');
      return;
    }

    try {
      setError(null);
      
      const checkoutData = {
        advogadoId: session.user.id,
        email: session.user.email,
        name: session.user.name,
        successUrl: `${window.location.origin}/dashboard/subscription/success`,
        cancelUrl: `${window.location.origin}/dashboard/subscription`,
      };

      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkoutData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar checkout');
      }

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('URL do checkout não encontrada');
      }

    } catch (err) {
      console.error('Erro ao criar checkout:', err);
      setError(err instanceof Error ? err.message : 'Erro ao processar pagamento');
    }
  }, [session?.user]);

  const openCustomerPortal = useCallback(async () => {
    if (!session?.user?.id) {
      setError('Usuário não autenticado');
      return;
    }

    try {
      setError(null);

      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/dashboard/subscription`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao abrir portal');
      }

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('URL do portal não encontrada');
      }

    } catch (err) {
      console.error('Erro ao abrir portal:', err);
      setError(err instanceof Error ? err.message : 'Erro ao abrir portal do cliente');
    }
  }, [session?.user?.id]);

  // 🆕 NOVOS - DADOS CALCULADOS
  const planType = subscription?.planoAtual || null;
  
  const limitations = isActive && planType && PLAN_LIMITATIONS[planType] 
    ? PLAN_LIMITATIONS[planType]
    : DEFAULT_LIMITATIONS;
//eslint-disable-next-line
  const currentUsage = {
    iaQueries: subscription?.usoMensal.consultasIA || 0,
    pdfProcessed: subscription?.usoMensal.pdfProcessados || 0,
  };

  // 🆕 NOVOS - MÉTODOS UTILITÁRIOS
  const canUseFeature = useCallback((feature: keyof PlanLimitations): boolean => {
    if (!isActive) return false;
    return Boolean(limitations[feature]);
  }, [isActive, limitations]);

  const hasReachedLimit = useCallback((type: 'consultasIA' | 'pdfProcessados'): boolean => {
    if (!isActive || !subscription) return true;
    
    const used = type === 'consultasIA' ? currentUsage.iaQueries : currentUsage.pdfProcessed;
    const limit = type === 'consultasIA' ? limitations.monthlyIAQueries : limitations.monthlyPdfProcessing;
    
    return used >= limit;
  }, [isActive, subscription, currentUsage, limitations]);

  const getRemainingUsage = useCallback((type: 'consultasIA' | 'pdfProcessados'): number => {
    if (!isActive || !subscription) return 0;
    
    const used = type === 'consultasIA' ? currentUsage.iaQueries : currentUsage.pdfProcessed;
    const limit = type === 'consultasIA' ? limitations.monthlyIAQueries : limitations.monthlyPdfProcessing;
    
    return Math.max(0, limit - used);
  }, [isActive, subscription, currentUsage, limitations]);

  // ✅ RETORNOS PARA STATUS NÃO AUTENTICADO (mantidos)
  if (status === 'loading') {
    return {
      isActive: false,
      subscription: null,
      isLoading: true,
      error: null,
      refetch,
      openPaymentModal,
      openCustomerPortal,
      // 🆕 NOVOS
      planType: null,
      limitations: DEFAULT_LIMITATIONS,
      currentUsage: { iaQueries: 0, pdfProcessed: 0 },
      canUseFeature: () => false,
      hasReachedLimit: () => true,
      getRemainingUsage: () => 0,
    };
  }

  if (status === 'unauthenticated') {
    return {
      isActive: false,
      subscription: null,
      isLoading: false,
      error: 'Usuário não autenticado',
      refetch,
      openPaymentModal,
      openCustomerPortal,
      // 🆕 NOVOS
      planType: null,
      limitations: DEFAULT_LIMITATIONS,
      currentUsage: { iaQueries: 0, pdfProcessed: 0 },
      canUseFeature: () => false,
      hasReachedLimit: () => true,
      getRemainingUsage: () => 0,
    };
  }

  // ✅ RETORNO PRINCIPAL (expandido)
  return {
    // ✅ EXISTENTES
    isActive,
    subscription,
    isLoading,
    error,
    refetch,
    openPaymentModal: () => {
      if (isActive) {
        openCustomerPortal();
      } else {
        createCheckoutSession();
      }
    },
    openCustomerPortal,
    
    // 🆕 NOVOS
    planType,
    limitations,
    currentUsage,
    canUseFeature,
    hasReachedLimit,
    getRemainingUsage,
  };
}
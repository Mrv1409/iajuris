// src/hooks/useSubscription.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { AdvogadoSubscription } from '@/services/subscription.service';

interface UseSubscriptionReturn {
  isActive: boolean;
  subscription: AdvogadoSubscription | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  openPaymentModal: () => void;
  openCustomerPortal: () => Promise<void>;
}

export function useSubscription(): UseSubscriptionReturn {
  const { data: session, status } = useSession();
  const [isActive, setIsActive] = useState(false);
  const [subscription, setSubscription] = useState<AdvogadoSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);//eslint-disable-next-line
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Função para buscar status da assinatura
  const fetchSubscriptionStatus = useCallback(async () => {
    if (status === 'loading' || !session?.user?.id) {
      return;
    }

    try {
      setError(null);
      setIsLoading(true);

      const response = await fetch('/api/subscription/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
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

  // Buscar status quando o componente monta ou sessão muda
  useEffect(() => {
    fetchSubscriptionStatus();
  }, [fetchSubscriptionStatus]);

  // Função para refetch manual
  const refetch = useCallback(async () => {
    await fetchSubscriptionStatus();
  }, [fetchSubscriptionStatus]);

  // Abrir modal de pagamento
  const openPaymentModal = useCallback(() => {
    setShowPaymentModal(true);
  }, []);

  // Criar checkout session e redirecionar
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

      // Redirecionar para o Stripe Checkout
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

  // Abrir portal do cliente Stripe
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

      // Redirecionar para o portal do cliente
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

  // Se não estiver autenticado, retornar estado inicial
  if (status === 'loading') {
    return {
      isActive: false,
      subscription: null,
      isLoading: true,
      error: null,
      refetch,
      openPaymentModal,
      openCustomerPortal,
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
    };
  }

  return {
    isActive,
    subscription,
    isLoading,
    error,
    refetch,
    openPaymentModal: () => {
      // Se já tem assinatura ativa, vai para o portal
      if (isActive) {
        openCustomerPortal();
      } else {
        // Se não tem assinatura, cria checkout
        createCheckoutSession();
      }
    },
    openCustomerPortal,
  };
}
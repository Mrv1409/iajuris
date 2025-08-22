// src/components/PaymentModal.tsx
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { loadStripe } from '@stripe/stripe-js';
import { 
  X, 
  Crown, 
  Check, 
  CreditCard, 
  Shield, 
  Sparkles,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { stripePublishableKey, SUBSCRIPTION_CONFIG } from '@/lib/stripe.config';

const stripePromise = loadStripe(stripePublishableKey!);

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}
//eslint-disable-next-line
export default function PaymentModal({ isOpen, onClose, onSuccess }: PaymentModalProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleCheckout = async () => {
    if (!session?.user) {
      setError('Usuário não autenticado');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Chamar API para criar checkout session
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          advogadoId: session.user.id,
          email: session.user.email,
          name: session.user.name,
          successUrl: `${window.location.origin}/dashboard/leads/advogado?payment=success`,
          cancelUrl: `${window.location.origin}/dashboard/leads/advogado?payment=canceled`,
        }),
      });

      const { sessionId, error: apiError } = await response.json();

      if (apiError) {
        throw new Error(apiError);
      }

      // Redirecionar para Stripe Checkout
      const stripe = await stripePromise;
      const { error } = await stripe!.redirectToCheckout({ sessionId });

      if (error) {
        throw new Error(error.message);
      }

    } catch (error) {
      console.error('Erro no checkout:', error);
      setError(error instanceof Error ? error.message : 'Erro inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="relative p-6 bg-gradient-to-r from-amber-600 to-yellow-500 text-white rounded-t-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-3 mb-2">
            <Crown className="w-8 h-8" />
            <h2 className="text-2xl font-bold">Plano Profissional</h2>
          </div>
          
          <p className="text-amber-100">
            Desbloqueie todo o potencial da IA jurídica
          </p>
        </div>

        {/* Pricing */}
        <div className="p-6 text-center border-b border-gray-200">
          <div className="flex items-baseline justify-center space-x-2 mb-2">
            <span className="text-4xl font-bold text-gray-900">R$ 97</span>
            <span className="text-gray-600">/mês</span>
          </div>
          <p className="text-sm text-gray-500">
            Cancele quando quiser • Sem compromisso
          </p>
        </div>

        {/* Features */}
        <div className="p-6 space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center">
            <Sparkles className="w-5 h-5 text-amber-500 mr-2" />
            Tudo que você precisa:
          </h3>
          
          <div className="space-y-3">
            {SUBSCRIPTION_CONFIG.features.map((feature, index) => (
              <div key={index} className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Security Badge */}
        <div className="px-6 pb-4">
          <div className="bg-gray-50 rounded-lg p-3 flex items-center space-x-2">
            <Shield className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-600">
              Pagamento 100% seguro via Stripe
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-6 space-y-3">
          <button
            onClick={handleCheckout}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-amber-600 to-yellow-500 text-white py-4 px-6 rounded-xl font-semibold hover:from-amber-700 hover:to-yellow-600 focus:ring-4 focus:ring-amber-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Processando...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5 mr-2" />
                Assinar Agora
              </>
            )}
          </button>
          
          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 text-center">
          <p className="text-xs text-gray-500">
            Ao assinar, você concorda com nossos Termos de Uso
          </p>
        </div>
      </div>
    </div>
  );
}
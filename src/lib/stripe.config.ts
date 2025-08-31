import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is required');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-07-30.basil',
});

export const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

export const SUBSCRIPTION_CONFIG = {
  plans: {
    profissional: {
      name: 'Profissional',
      price: 'R$ 147',
      priceId: 'price_1RzQggDFq6ALe0I1LXKaaGLE',
      limits: {
        consultasIA: 500,
        pdfProcessados: 50,
        loginsSimultaneos: 1
      },
      features: [
        '500 consultas IA/mês',
        '50 PDFs processados/mês', 
        '1 usuário simultâneo',
        'IA jurídica 24h',
        'Análise de contratos',
        'Relatórios básicos',
        'Suporte por email',
        'Dashboard personalizado'
      ]
    },
    escritorio: {
      name: 'Escritório',
      price: 'R$ 297',
      priceId: 'price_1RzQkuDFq6ALe0I14czUgLBr',
      limits: {
        consultasIA: 1500,
        pdfProcessados: 150,
        loginsSimultaneos: 3
      },
      features: [
        '1.500 consultas IA/mês',
        '150 PDFs processados/mês',
        '3 usuários simultâneos',
        'IA jurídica 24h',
        'Análise de contratos avançada',
        'Relatórios completos',
        'Analytics avançados',
        'Integrações API',
        'Suporte prioritário',
        'Dashboard personalizado',
        'Gestão de equipe'
      ]
    }
  }
};

// Helper para obter configuração do plano
export const getPlanConfig = (planType: 'profissional' | 'escritorio') => {
  return SUBSCRIPTION_CONFIG.plans[planType];
};

// Helper para obter todos os planos
export const getAllPlans = () => {
  return Object.values(SUBSCRIPTION_CONFIG.plans);
};
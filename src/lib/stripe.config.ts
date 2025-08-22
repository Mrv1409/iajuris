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
    basico: {
      name: 'Básico',
      price: 'R$ 97',
      priceId: 'price_1RtdqRDFq6ALe0I1cCmMzPgb',
      features: [
        '200 páginas PDF/mês', 
        '500 consultas IA/mês', 
        '1 usuário',
        'Relatórios básicos',
        'Suporte por email',
        'IA 24h para agendamentos',
        'Página personalizada',
        'Multi-usuários',
        'Analytics avançados',
        'Suporte prioritário',
      ]
    },
    profissional: {
      name: 'Profissional',
      price: 'R$ 197',
      priceId: 'price_1RtdrfDFq6ALe0I1g2mVlr5q',
      features: [
          '300 páginas PDF/mês', 
          '2.000 consultas IA/mês', 
          'Até 5 usuários',
          'Relatórios avançados',
          'IA 24h para agendamentos',
          'Página personalizada',
          'Analytics avançados',
          'Suporte prioritário',
          'Integrações API',
          'Dashboard personalizado', 
      ]
    },
    empresarial: {
      name: 'Empresarial',
      price: 'R$ 397',
      priceId: 'price_1RtdszDFq6ALe0I1Yga67T2y',
      features: [
        'Páginas PDF ilimitadas', 
        'Consultas IA ilimitadas', 
        'Usuários ilimitados',
        'Relatórios enterprise',
        'IA 24h para agendamentos',
        'Páginas personalizadas',
        'Analytics enterprise',
        'Suporte dedicado',
        'Integrações completas',
        'Dashboard personalizado'
      ]
    }
  }
};
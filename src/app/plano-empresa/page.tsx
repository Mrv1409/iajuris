'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Scale, Gavel, ArrowLeft, Check, X, Star, Shield, Zap, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Inicializar Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Configuração dos planos
const PLANS = {
  basico: {
    name: 'Básico',
    price: 'R$ 97',
    priceId: 'price_1RtdqRDFq6ALe0I1cCmMzPgb',
    description: 'Ideal para advogados autônomos',
    popular: false,
    features: [
      { text: '200 páginas PDF/mês', included: true },
      { text: '500 consultas IA/mês', included: true },
      { text: '1 usuário', included: true },
      { text: 'Relatórios básicos', included: true },
      { text: 'Suporte por email', included: true },
      { text: 'IA 24h para agendamentos', included: false },
      { text: 'Página personalizada', included: false },
      { text: 'Multi-usuários', included: false },
      { text: 'Analytics avançados', included: false },
      { text: 'Suporte prioritário', included: false }
    ]
  },
  profissional: {
    name: 'Profissional',
    price: 'R$ 197',
    priceId: 'price_1RtdrfDFq6ALe0I1g2mVlr5q',
    description: 'Para escritórios em crescimento',
    popular: true,
    features: [
      { text: '300 páginas PDF/mês', included: true },
      { text: '2.000 consultas IA/mês', included: true },
      { text: 'Até 5 usuários', included: true },
      { text: 'Relatórios avançados', included: true },
      { text: 'IA 24h para agendamentos', included: true },
      { text: 'Página personalizada', included: true },
      { text: 'Analytics avançados', included: true },
      { text: 'Suporte prioritário', included: true },
      { text: 'Integrações API', included: true },
      { text: 'Dashboard personalizado', included: false }
    ]
  },
  empresarial: {
    name: 'Empresarial',
    price: 'R$ 397',
    priceId: 'price_1RtdszDFq6ALe0I1Yga67T2y',
    description: 'Solução enterprise completa',
    popular: false,
    features: [
      { text: 'Páginas PDF ilimitadas', included: true },
      { text: 'Consultas IA ilimitadas', included: true },
      { text: 'Usuários ilimitados', included: true },
      { text: 'Relatórios enterprise', included: true },
      { text: 'IA 24h para agendamentos', included: true },
      { text: 'Páginas personalizadas', included: true },
      { text: 'Analytics enterprise', included: true },
      { text: 'Suporte dedicado', included: true },
      { text: 'Integrações completas', included: true },
      { text: 'Dashboard personalizado', included: true }
    ]
  }
};

export default function IAJurisPricingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showFAQ, setShowFAQ] = useState<number | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleCheckout = async (priceId: string, planName: string, planPrice: string) => {
    try {
      setIsLoading(planName);
      
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: priceId,
          planName: planName,
          planPrice: planPrice,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro na criação da sessão');
      }

      const { sessionId } = await response.json();
      
      const stripe = await stripePromise;
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({
          sessionId,
        });
        
        if (error) {
          console.error('Erro no checkout:', error);
          alert('Erro ao processar pagamento. Tente novamente.');
        }
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao processar pagamento. Tente novamente.');
    } finally {
      setIsLoading(null);
    }
  };

  const handleBackToDashboard = () => {
    router.push('/');
  };

  const benefits = [
    {
      icon: '🚀',
      title: 'IA Especializada em Direito',
      description: 'Inteligência artificial treinada especificamente para o direito brasileiro, com conhecimento atualizado da legislação.'
    },
    {
      icon: '⚡',
      title: 'Processamento Ultra-Rápido',
      description: 'Análise de documentos de 100+ páginas em menos de 30 segundos. Economize horas de trabalho manual.'
    },
    {
      icon: '🔍',
      title: 'Análise Profunda de PDFs',
      description: 'Extração inteligente de dados, identificação de riscos, resumos executivos e insights valiosos.'
    },
    {
      icon: '💼',
      title: 'Gestão Completa de Casos',
      description: 'Organize seus casos, clientes e documentos em um só lugar com sistema intuitivo e poderoso.'
    },
    {
      icon: '🔐',
      title: 'Segurança Enterprise',
      description: 'Criptografia de ponta a ponta, compliance LGPD e infraestrutura em nuvem com 99.9% de uptime.'
    },
    {
      icon: '📊',
      title: 'Analytics Inteligentes',
      description: 'Métricas detalhadas do seu escritório, produtividade da equipe e insights para crescimento.'
    }
  ];

  const testimonials = [
    {
      name: 'Dr. Carlos Mendes',
      position: 'Sócio-fundador, Mendes & Associados',
      text: 'Reduziu em 70% o tempo de análise de contratos. Nossa produtividade triplicou com a IAJuris.',
      rating: 5,
      avatar: '👨‍💼'
    },
    {
      name: 'Dra. Ana Beatriz Silva',
      position: 'Especialista em Direito Empresarial',
      text: 'A precisão da análise é impressionante. Identifica riscos que eu levaria horas para encontrar.',
      rating: 5,
      avatar: '👩‍💼'
    },
    {
      name: 'Dr. Roberto Almeida',
      position: 'Diretor Jurídico, TechCorp',
      text: 'ROI em menos de 2 meses. É uma ferramenta indispensável para qualquer escritório moderno.',
      rating: 5,
      avatar: '👨‍⚖️'
    }
  ];

  const faqData = [
    {
      question: 'Como funciona o período de teste gratuito?',
      answer: 'Você tem 7 dias completos para testar todas as funcionalidades do plano escolhido. Se não ficar satisfeito, cancele antes do vencimento e não será cobrado nada.'
    },
    {
      question: 'Posso trocar de plano a qualquer momento?',
      answer: 'Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. As alterações são aplicadas imediatamente e o valor é ajustado proporcionalmente.'
    },
    {
      question: 'Os dados são seguros e confidenciais?',
      answer: 'Absolutamente. Utilizamos criptografia de ponta a ponta, somos compliance LGPD e nossos servidores ficam em data centers certificados no Brasil. Seus documentos jamais são compartilhados.'
    },
    {
      question: 'Como funciona o suporte técnico?',
      answer: 'Oferecemos suporte por email para todos os planos, com tempo de resposta de até 24h. Planos Profissional e Empresarial têm suporte prioritário com resposta em até 4h.'
    },
    {
      question: 'Posso cancelar minha assinatura?',
      answer: 'Sim, você pode cancelar sua assinatura a qualquer momento através do painel de controle. O serviço permanece ativo até o final do período pago.'
    },
    {
      question: 'Há taxa de configuração ou setup?',
      answer: 'Não cobramos nenhuma taxa adicional. O valor da assinatura é tudo que você paga, sem surpresas ou custos ocultos.'
    }
  ];

  const stats = [
    { number: '1000+', label: 'Advogados ativos', icon: <Users className="w-6 h-6" /> },
    { number: '99.9%', label: 'Precisão da IA', icon: <Zap className="w-6 h-6" /> },
    { number: '300%', label: 'Aumento produtividade', icon: <Star className="w-6 h-6" /> },
    { number: '24/7', label: 'Disponibilidade', icon: <Shield className="w-6 h-6" /> }
  ];

  return (
    <main className="min-h-screen text-white relative overflow-hidden font-inter">
      {/* Header fixo com logo e botão dashboard */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b border-gray-800/50">
        <div 
          className="px-6 py-4"
          style={{
            background: 'linear-gradient(135deg, rgba(10, 10, 10, 0.95) 0%, rgba(26, 26, 26, 0.95) 50%, rgba(10, 10, 10, 0.95) 100%)'
          }}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center group cursor-default"> 
              <Scale className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3" 
                      style={{ color: '#b0825a' }} />
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white drop-shadow-lg">
                IAJURIS
              </h1>
              <Gavel className="w-6 h-6 sm:w-8 sm:h-8 ml-2 sm:ml-3" 
                      style={{ color: '#b0825a' }} />
            </div>

            {/* Botão Dashboard */}
            <button
              onClick={handleBackToDashboard}
              className="group flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-700 bg-gradient-to-r from-gray-800/80 to-gray-900/80 hover:border-amber-500/50 hover:from-amber-500/10 hover:to-amber-600/10 transition-all duration-300 hover:scale-105"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400 group-hover:text-amber-300 transition-colors" />
              <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                Início
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Background com gradientes premium - mais escuro */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          background: `
            radial-gradient(circle at 25% 25%, rgba(176, 130, 90, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(176, 130, 90, 0.06) 0%, transparent 50%),
            linear-gradient(135deg, #050505 0%, #0f0f0f 25%, #1a1a1a 50%, #0f0f0f 75%, #050505 100%)
          `
        }}
      />

      {/* Efeitos 3D de fundo - reduzido a opacidade */}
      <div className="absolute inset-0 overflow-hidden z-0">
        {/* Círculos flutuantes com efeito 3D */}
        <div className="absolute top-20 left-20 w-32 h-32 rounded-full animate-float opacity-5 bg-gradient-to-br from-amber-400 to-amber-600 blur-xl" />
        <div className="absolute bottom-20 right-20 w-24 h-24 rounded-full animate-float-delayed opacity-5 bg-gradient-to-br from-amber-500 to-amber-700 blur-lg" />
        <div className="absolute top-1/2 left-10 w-16 h-16 rounded-full animate-float-slow opacity-5 bg-gradient-to-br from-amber-300 to-amber-500 blur-md" />
        
        {/* Efeito de cursor interativo - reduzido */}
        <div
          className="absolute w-96 h-96 rounded-full pointer-events-none transition-all duration-1000 opacity-3"
          style={{
            background: `radial-gradient(circle, rgba(176, 130, 90, 0.2) 0%, transparent 70%)`,
            left: mousePosition.x - 192,
            top: mousePosition.y - 192,
            filter: 'blur(40px)'
          }}
        />
      </div>

      {/* Conteúdo principal - ajustado para o header fixo */}
      <div className="relative z-10 pt-32 pb-20">
        {/* Header Hero */}
        <div className="text-center mb-20 px-4">
          <div className="max-w-5xl mx-auto">
            {/* Logo/Marca principal - menor que antes */}
            <div className="mb-8">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-4 tracking-tight leading-tight">
                <span 
                  className="bg-gradient-to-r bg-clip-text text-transparent drop-shadow-2xl"
                  style={{
                    backgroundImage: 'linear-gradient(135deg, #b0825a 0%, #d4a574 50%, #b0825a 100%)',
                    textShadow: '0 0 30px rgba(176, 130, 90, 0.5)'
                  }}
                >
                  IAJuris
                </span>
              </h1>
              <div className="flex items-center justify-center gap-6 mb-8">
                <div className="h-px w-20 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg" />
                <div className="h-px w-20 bg-gradient-to-l from-transparent via-amber-500 to-transparent" />
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-6 leading-tight">
              Revolucione sua <span className="text-amber-400">prática jurídica</span> com 
              <br className="hidden sm:block" />
              Inteligência Artificial Especializada
            </h2>
            
            <p className="text-base sm:text-lg mb-8 font-medium opacity-90 max-w-3xl mx-auto leading-relaxed text-gray-300">
              Transforme documentos complexos em insights valiosos. Aumente sua produtividade em até 300% 
              com nossa IA treinada especificamente para o Direito brasileiro.
            </p>

            <div className="flex flex-wrap justify-center gap-4 text-sm font-medium opacity-80">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span>Mais de 1000+ advogados confiam</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span>99.9% de precisão</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-400" />
                <span>LGPD Compliant</span>
              </div>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="max-w-6xl mx-auto mb-20 px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="text-center p-6 rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-xl hover:border-amber-500/30 transition-all duration-300 hover:scale-105"
              >
                <div className="flex justify-center mb-3 text-amber-400">
                  {stat.icon}
                </div>
                <div className="text-2xl md:text-3xl font-bold text-amber-400 mb-2">
                  {stat.number}
                </div>
                <div className="text-sm text-gray-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Seção de Preços Premium */}
        <div className="max-w-7xl mx-auto mb-20 px-4">
          <div className="text-center mb-16">
            <h3 className="text-2xl sm:text-3xl font-bold mb-4">
              Escolha o plano <span className="text-amber-400">perfeito</span> para seu escritório
            </h3>
            <p className="text-base sm:text-lg opacity-80 max-w-2xl mx-auto">
              Todos os planos incluem nossa IA especializada, suporte técnico e atualizações gratuitas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-4">
            {Object.entries(PLANS).map(([key, plan]) => (
              <div
                key={key}
                className={`relative group ${plan.popular ? 'md:scale-105 lg:z-10' : ''}`}
              >
                {/* Card principal com efeito 3D */}
                <div
                  className={`relative h-full p-6 lg:p-8 rounded-3xl border-2 transition-all duration-500 hover:scale-105 transform-gpu ${
                    plan.popular 
                      ? 'border-amber-500 bg-gradient-to-br from-amber-500/15 via-amber-600/8 to-amber-700/15 shadow-2xl shadow-amber-500/20' 
                      : 'border-gray-700 bg-gradient-to-br from-gray-800/70 via-gray-900/70 to-black/70 hover:border-gray-600'
                  }`}
                  style={{
                    backdropFilter: 'blur(20px)',
                    boxShadow: plan.popular 
                      ? '0 25px 50px -12px rgba(176, 130, 90, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
                      : '0 20px 40px -12px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                  }}
                >
                  {/* Badge "Mais Popular" */}
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-amber-400 to-amber-600 text-black text-xs font-bold px-4 py-2 rounded-full shadow-lg">
                        ⭐ MAIS POPULAR
                      </div>
                    </div>
                  )}

                  {/* Header do plano */}
                  <div className="text-center mb-6">
                    <h4 className={`text-xl font-bold mb-2 ${plan.popular ? 'text-amber-400' : 'text-white'}`}>
                      {plan.name}
                    </h4>
                    <p className="text-gray-400 mb-4 text-sm">
                      {plan.description}
                    </p>
                    
                    <div className="mb-6">
                      <span className={`text-4xl font-black ${plan.popular ? 'text-amber-400' : 'text-white'}`}>
                        {plan.price}
                      </span>
                      <span className="text-lg opacity-70 ml-1">/mês</span>
                    </div>

                    <button
                      onClick={() => handleCheckout(plan.priceId, plan.name, plan.price)}
                      disabled={isLoading === plan.name}
                      className={`w-full group/btn relative font-bold py-3 px-4 rounded-2xl transition-all duration-300 hover:shadow-xl hover:scale-105 transform text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                        plan.popular
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-lg shadow-amber-500/30'
                          : 'bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white'
                      }`}
                    >
                      <span className="relative z-10">
                        {isLoading === plan.name ? 'Processando...' : 'Assinar Agora'}
                      </span>
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover/btn:opacity-10 transition-opacity duration-300" />
                    </button>

                    <p className="text-xs mt-3 opacity-60">
                      ✨ 7 dias grátis • Cancele quando quiser
                    </p>
                  </div>

                  {/* Lista de recursos */}
                  <div className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <div 
                        key={index}
                        className={`flex items-center gap-3 text-xs ${
                          feature.included ? 'text-gray-300' : 'text-gray-600'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                          feature.included 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
                            : 'bg-gray-700/50 text-gray-500 border border-gray-600/50'
                        }`}>
                          {feature.included ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        </div>
                        <span className={feature.included ? '' : 'line-through'}>
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-sm opacity-70 mb-4">
              💳 Pagamento 100% seguro via Stripe • 🔒 Seus dados sempre protegidos • ⚡ Ativação imediata
            </p>
            <p className="text-xs opacity-50">
              Todos os preços em reais (BRL). Valores podem ser alterados sem aviso prévio.
            </p>
          </div>
        </div>

        {/* Seção de Benefícios */}
        <div className="max-w-7xl mx-auto mb-20 px-4">
          <div className="text-center mb-16">
            <h3 className="text-2xl sm:text-3xl font-bold mb-4">
              Por que escolher a <span className="text-amber-400">IAJuris</span>?
            </h3>
            <p className="text-base sm:text-lg opacity-80 max-w-3xl mx-auto">
              Nossa plataforma oferece muito mais que análise de documentos. É uma solução completa 
              para modernizar seu escritório de advocacia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="group p-6 rounded-3xl border border-gray-700 bg-gradient-to-br from-gray-800/50 via-gray-900/50 to-black/50 backdrop-blur-xl hover:border-amber-500/50 transition-all duration-500 hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/10"
                style={{
                  boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                }}
              >
                <div className="text-center">
                  <div
                    className="w-14 h-14 rounded-3xl mx-auto mb-4 flex items-center justify-center text-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/30"
                  >
                    {benefit.icon}
                  </div>

                  <h4 className="text-lg font-bold mb-3 group-hover:text-amber-400 transition-colors duration-300">
                    {benefit.title}
                  </h4>

                  <p className="text-gray-400 text-sm leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Seção de Depoimentos */}
        <div className="max-w-6xl mx-auto mb-20 px-4">
          <div className="text-center mb-16">
            <h3 className="text-2xl sm:text-3xl font-bold mb-4">
              Transformando escritórios <span className="text-amber-400">pelo Brasil</span>
            </h3>
            <p className="text-base sm:text-lg opacity-80">
              Veja o que nossos clientes estão dizendo sobre a IAJuris
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="group p-6 rounded-3xl border border-gray-700 bg-gradient-to-br from-gray-800/50 via-gray-900/50 to-black/50 backdrop-blur-xl hover:border-amber-500/30 transition-all duration-500 hover:scale-105 hover:shadow-2xl"
                style={{
                  boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                }}
              >
                <div className="text-center">
                  {/* Avatar */}
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-xl shadow-lg shadow-amber-500/30">
                    {testimonial.avatar}
                  </div>

                  {/* Rating */}
                  <div className="flex justify-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-amber-400 fill-current" />
                    ))}
                  </div>

                  {/* Depoimento */}
                  <p className="text-gray-300 mb-4 italic leading-relaxed text-sm">
                    &quot;{testimonial.text}&quot;
                  </p>

                  {/* Autor */}
                  <div>
                    <p className="font-bold text-amber-400 mb-1 text-sm">
                      {testimonial.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {testimonial.position}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto mb-20 px-4">
          <div className="text-center mb-16">
            <h3 className="text-2xl sm:text-3xl font-bold mb-4">
              Perguntas <span className="text-amber-400">Frequentes</span>
            </h3>
            <p className="text-base sm:text-lg opacity-80">
              Tire suas dúvidas sobre nossos planos e funcionalidades
            </p>
          </div>

          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <div
                key={index}
                className="border border-gray-700 rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl overflow-hidden"
              >
                <button
                  onClick={() => setShowFAQ(showFAQ === index ? null : index)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-800/30 transition-all duration-300"
                >
                  <span className="font-semibold text-white">{faq.question}</span>
                  <div className={`transform transition-transform duration-300 ${showFAQ === index ? 'rotate-180' : ''}`}>
                    <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                {showFAQ === index && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-400 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA Final */}
        <div className="text-center px-4">
          <div 
            className="max-w-4xl mx-auto p-8 lg:p-12 rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/8 via-amber-600/4 to-amber-700/8 backdrop-blur-xl"
            style={{
              boxShadow: '0 25px 50px -12px rgba(176, 130, 90, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}
          >
            <h3 className="text-2xl sm:text-3xl font-bold mb-6">
              Pronto para <span className="text-amber-400">revolucionar</span> seu escritório?
            </h3>
            <p className="text-base sm:text-lg mb-8 opacity-90 leading-relaxed">
              Junte-se a mais de 1000 advogados que já transformaram sua prática jurídica com a IAJuris. 
              Comece hoje mesmo e veja a diferença em poucos minutos.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => handleCheckout(PLANS.profissional.priceId, PLANS.profissional.name, PLANS.profissional.price)}
                disabled={isLoading === PLANS.profissional.name}
                className="group/btn relative font-bold py-4 px-8 rounded-2xl transition-all duration-300 hover:shadow-2xl hover:scale-105 transform text-base disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-lg shadow-amber-500/30"
              >
                <span className="relative z-10">
                  {isLoading === PLANS.profissional.name ? 'Processando...' : 'Começar Agora - R$ 197/mês'}
                </span>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover/btn:opacity-20 transition-opacity duration-300" />
              </button>
              
              <p className="text-sm opacity-70">
                ou <button className="text-amber-400 hover:text-amber-300 underline">agende uma demonstração</button>
              </p>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm opacity-80">
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span>7 dias gratuitos</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span>Sem taxa de setup</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span>Cancele quando quiser</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span>Suporte especializado</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-20 border-t border-gray-800 pt-12 pb-8 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <div className="flex items-center justify-center mb-6">
              <Scale className="w-6 h-6 mr-2 text-amber-400" />
              <span className="text-xl font-bold text-white">IAJuris</span>
              <Gavel className="w-6 h-6 ml-2 text-amber-400" />
            </div>
            
            <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
              Transformando a prática jurídica com inteligência artificial especializada. 
              Mais produtividade, menos tempo perdido, resultados excepcionais.
            </p>
            
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500 mb-6">
              <a href="#" className="hover:text-amber-400 transition-colors">Termos de Uso</a>
              <a href="#" className="hover:text-amber-400 transition-colors">Política de Privacidade</a>
              <a href="#" className="hover:text-amber-400 transition-colors">Suporte</a>
              <a href="#" className="hover:text-amber-400 transition-colors">Contato</a>
            </div>
            
            <p className="text-xs text-gray-600">
              © 2024 IAJuris. Todos os direitos reservados. Desenvolvido com ❤️ para advogados brasileiros.
            </p>
          </div>
        </footer>
      </div>

      {/* Estilos CSS para animações */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(-3deg); }
        }
        
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
          animation-delay: 2s;
        }
        
        .animate-float-slow {
          animation: float-slow 10s ease-in-out infinite;
          animation-delay: 4s;
        }
      `}</style>
    </main>
  );
}

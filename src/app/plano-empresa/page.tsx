'use client';

import React, { useState, useEffect } from 'react';//eslint-disable-next-line
import { Scale, Gavel, ArrowLeft, Check, X, Star, Shield, Zap, Users, Mail, User, Loader2, Clock, FileText, Calculator, DollarSign, UserCheck, Globe, Smartphone, AlertTriangle, TrendingUp, Target, Award, Bot, Timer, HeadphonesIcon, CreditCard, PiggyBank, Receipt, BarChart3, ChevronLeft, ChevronRight, Monitor } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/firebase/firestore';

//eslint-disable-next-line
interface Feature {
  text: string;
  included: boolean;
  icon: string;
}

// Configuração do plano único - FOCO TOTAL NO PROFISSIONAL
const PLAN = {
  name: 'Profissional',
  price: 'R$ 247',
  originalPrice: 'R$ 5.000+',
  priceId: 'price_1S0mgDDFq6ALe0I1KlKC1mrD',
  description: 'Site + App + IA + Secretária 24h para advogados',
  popular: true,
  ia: 'IA Groq Especializada',
  monthlyAnalysis: '1.000 páginas/mês de análise IA',
  features: [
    { text: 'Site Profissional com IA integrada', included: true, icon: '🌐' },
    { text: 'Secretária Virtual 24h (responde clientes)', included: true, icon: '🤖' },
    { text: 'Análise de PDFs até 1.000 páginas/mês', included: true, icon: '⚡' },
    { text: 'Geração de Documentos Jurídicos', included: true, icon: '✍️' },
    { text: 'Gestão Completa de Clientes', included: true, icon: '👥' },
    { text: 'Gestão Financeira Completa', included: true, icon: '💰' },
    { text: 'Calculadora Jurídica Avançada', included: true, icon: '🧮' },
    { text: 'Controle de Prazos Processuais', included: true, icon: '⏰' },
    { text: 'App Mobile Responsivo', included: true, icon: '📱' }
  ]
};

// Dados dos mockups
const mockupsData = [
  {
    id: 1,
    title: 'Página Padrão Incluída',
    description: 'Configuração inicial profissional',
    type: 'desktop',
    badge: 'Incluído',
    image: '/prints/francisco-goncalves-ferreira.png' // Substitua pelo caminho real
  },
  {
    id: 2,
    title: 'Personalização Profissional',
    description: 'Dr. João - Direito Penal',
    type: 'desktop',
    badge: 'Personalizado',
    image: '/prints/dr-joao-ferreira.png' // Substitua pelo caminho real
  },
  {
    id: 3,
    title: 'Versão Mobile',
    description: 'Dr. Ramon - Direito Civil',
    type: 'mobile',
    badge: 'Responsivo',
    image: '/prints/dr-ramon-ribeiro-mobile.png' // Substitua pelo caminho real
  },
  {
    id: 4,
    title: 'Identidade Visual Única',
    description: 'Outras cores e estilos',
    type: 'desktop',
    badge: 'Customizado',
    image: '/prints/exemplo-cores-diferentes.png' // Adicione mais exemplos
  }
];

export default function IAJurisLandingPage() {
  const router = useRouter();//eslint-disable-next-line
  const [isLoading, setIsLoading] = useState(false);//eslint-disable-next-line
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showFAQ, setShowFAQ] = useState<number | null>(null);
  
  // Estados do Slider de Mockups
  const [currentMockup, setCurrentMockup] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  
  // Estados do Modal
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({
    nome: '',
    email: ''
  });
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Auto-play do slider
  useEffect(() => {
    if (isAutoPlaying) {
      const interval = setInterval(() => {
        setCurrentMockup((prev) => (prev + 1) % mockupsData.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isAutoPlaying]);

  // Navegação do slider
  const nextMockup = () => {
    setIsAutoPlaying(false);
    setCurrentMockup((prev) => (prev + 1) % mockupsData.length);
  };

  const prevMockup = () => {
    setIsAutoPlaying(false);
    setCurrentMockup((prev) => (prev - 1 + mockupsData.length) % mockupsData.length);
  };

  const goToMockup = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentMockup(index);
  };

  // Validar email
  const validarEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Gerar slug automático
  const gerarSlug = (nome: string): string => {
    return nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // Verificar se advogado existe
  const verificarAdvogadoExistente = async (email: string) => {
    try {
      const q = query(collection(db, 'advogados'), where('email', '==', email.toLowerCase()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { exists: true, id: doc.id, data: doc.data() };
      }
      
      return { exists: false, id: null, data: null };
    } catch (error) {
      console.error('Erro ao verificar advogado:', error);
      throw error;
    }
  };

  // Criar advogado básico
  const criarAdvogadoBasico = async (nome: string, email: string) => {
    try {
      const novoAdvogado = {
        nome: nome,
        email: email.toLowerCase(),
        especialidades: ['Direito Geral'],
        experiencia: 'Não informado',
        cidade: 'Não informado',
        contato: 'Não informado',
        biografia: 'Perfil criado automaticamente via sistema de pagamentos.',
        slug: gerarSlug(nome),
        dataCriacao: new Date().toISOString(),
        status: 'active',
        role: 'advogado'
      };
      
      const docRef = await addDoc(collection(db, 'advogados'), novoAdvogado);
      return { id: docRef.id, data: novoAdvogado };
    } catch (error) {
      console.error('Erro ao criar advogado:', error);
      throw error;
    }
  };

  const abrirModal = () => {
    setShowModal(true);
    setModalData({ nome: '', email: '' });
  };

  // Fechar modal
  const fecharModal = () => {
    setShowModal(false);
    setModalData({ nome: '', email: '' });
  };

  // Processar checkout
  const processarCheckout = async () => {
    // Validações
    if (!modalData.nome.trim()) {
      alert('Por favor, informe seu nome completo.');
      return;
    }

    if (!modalData.email.trim()) {
      alert('Por favor, informe seu email.');
      return;
    }

    if (!validarEmail(modalData.email)) {
      alert('Por favor, informe um email válido.');
      return;
    }

    try {
      setModalLoading(true);

      // 1. Verificar se advogado já existe
      const { exists, id: advogadoId } = await verificarAdvogadoExistente(modalData.email);
      
      let finalAdvogadoId = advogadoId;

      // 2. Se não existe, criar advogado básico
      if (!exists) {
        const { id } = await criarAdvogadoBasico(modalData.nome, modalData.email);
        finalAdvogadoId = id;
      }

      // 3. Criar sessão de checkout
      const response = await fetch('/api/create-subscription-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          advogadoId: finalAdvogadoId,
          email: modalData.email,
          name: modalData.nome,
          plano: 'profissional',
          successUrl: `${window.location.origin}/dashboard?success=true&plan=profissional`,
          cancelUrl: `${window.location.origin}/pricing?canceled=true`
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro na criação da sessão de checkout');
      }

      const { url } = await response.json();
      
      // Redirecionar para o checkout do Stripe
      window.location.href = url;
      
    } catch (error) {
      console.error('Erro no checkout:', error);
      alert(`Erro ao processar pagamento: ${error instanceof Error ? error.message : 'Tente novamente.'}`);
    } finally {
      setModalLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    router.push('/');
  };

  // Comparação direta com mercado
  const marketComparison = [
    {
      traditional: "Sites tradicionais: R$ 5.000+",
      iajuris: "IAJURIS: R$ 247/mês",
      economy: "Economia: 97% menor custo",
      icon: "💰"
    },
    {
      traditional: "Análise manual: 3 dias",
      iajuris: "IA IAJURIS: 30 segundos",
      economy: "Economia: 99% do tempo",
      icon: "⚡"
    },
    {
      traditional: "6 ferramentas separadas",
      iajuris: "IAJURIS: Tudo integrado",
      economy: "Economia: 1 única mensalidade",
      icon: "🔧"
    },
    {
      traditional: "Secretária: R$ 2.000+/mês",
      iajuris: "IA 24h: Incluído grátis",
      economy: "Economia: R$ 24.000/ano",
      icon: "🤖"
    }
  ];

  // 4 pilares principais
  const mainPillars = [
    {
      title: 'Site Profissional',
      subtitle: 'Sua vitrine digital completa',
      description: 'Site responsivo, elegante e otimizado que substitui soluções de R$ 5.000+ por apenas R$ 247/mês.',
      icon: <Globe className="w-8 h-8 sm:w-10 lg:w-12" />,
      benefit: 'Economia de 97%'
    },
    {
      title: 'App Mobile',
      subtitle: 'Escritório no seu bolso',
      description: 'Acesse tudo pelo celular: clientes, documentos, IA e gestão completa onde você estiver.',
      icon: <Smartphone className="w-8 h-8 sm:w-10 lg:w-12" />,
      benefit: 'Mobilidade total'
    },
    {
      title: 'IA Especializada',
      subtitle: 'Até 1.000 páginas/mês',
      description: 'Analise documentos de 100+ páginas em 30 segundos. Gere petições e contratos automaticamente. Até 1.000 páginas por mês.',
      icon: <Bot className="w-8 h-8 sm:w-10 lg:w-12" />,
      benefit: '1.000 páginas/mês'
    },
    {
      title: 'Gestão Financeira',
      subtitle: 'Controle total dos recursos',
      description: 'Gestão de fluxo de caixa, emissão de recibos automática, controle de pagamentos e relatórios financeiros completos.',
      icon: <BarChart3 className="w-8 h-8 sm:w-10 lg:w-12" />,
      benefit: 'Controle financeiro total'
    }
  ];

  const testimonials = [
    {
      name: 'Dr. Carlos Mendes',
      position: 'Advogado Tributarista, São Paulo',
      text: 'Cancelei meu site de R$ 8.000 no primeiro mês. A IAJURIS me dá Site + App + IA + Secretária por R$ 147. A análise que levava 3 dias, resolvo em 30 segundos. ROI imediato.',
      rating: 5,
      avatar: '👨‍💼',
      savings: 'Economizou R$ 95.000/ano'
    },
    {
      name: 'Dra. Marina Silva',
      position: 'Direito Civil, Rio de Janeiro',
      text: 'A Secretária Virtual da IAJURIS trabalha 24h respondendo meus clientes. Nunca mais perdi um lead. Minha receita aumentou 60% em 3 meses.',
      rating: 5,
      avatar: '👩‍⚖️',
      savings: 'Receita +60% em 90 dias'
    },
    {
      name: 'Dr. Roberto Almeida',
      position: 'Direito Empresarial, Minas Gerais',
      text: 'Substitui 6 ferramentas pela IAJURIS. Economizo 15 horas por semana e R$ 4.500/mês em mensalidades. A IA é impressionante na análise de contratos.',
      rating: 5,
      avatar: '👨‍⚖️',
      savings: 'Economiza R$ 54.000/ano'
    }
  ];

  const faqData = [
    {
      question: 'A IAJURIS realmente substitui um site de R$ 5.000+?',
      answer: 'Sim, completamente. Você terá um site profissional responsivo + IA que responde clientes + gestão completa + app mobile. Sites tradicionais custam R$ 5.000+ e só captam leads. A IAJURIS faz tudo isso por R$ 247/mês.'
    },
    {
      question: 'Como funciona o limite de 1.000 páginas por mês?',
      answer: 'Você pode analisar até 1.000 páginas de documentos por mês com nossa IA. Isso equivale a cerca de 20 análises de processos médios. É um limite muito generoso que atende 99% dos advogados sem restrições.'
    },
    {
      question: 'Como a Secretária Virtual funciona 24 horas?',
      answer: 'Nossa IA especializada responde seus clientes automaticamente, agenda consultas, qualifica leads e organiza demandas. Trabalha 24/7 sem pausas, feriados ou férias. Equivale a uma secretária de R$ 2.000+/mês.'
    },
    {
      question: 'A análise realmente acontece em 30 segundos?',
      answer: 'Sim! Nossa IA Groq especializada em Direito brasileiro analisa documentos de 100+ páginas em menos de 30 segundos, extraindo informações relevantes, identificando riscos e gerando resumos executivos.'
    },
    {
      question: 'Funciona no celular como um app?',
      answer: 'Perfeitamente! A IAJURIS é totalmente responsiva e funciona como um app nativo no seu celular. Site + App numa solução só, sem necessidade de downloads.'
    },
    {
      question: 'Os dados ficam seguros?',
      answer: 'Segurança máxima! Criptografia de ponta a ponta, servidores no Brasil, compliance total com LGPD. Seus dados e de seus clientes ficam 100% protegidos.'
    }
  ];

  const stats = [
    { number: '1000+', label: 'Advogados usando', icon: <Users className="w-4 h-4 sm:w-6" /> },
    { number: '97%', label: 'Economia vs sites', icon: <TrendingUp className="w-4 h-4 sm:w-6" /> },
    { number: '1000', label: 'Páginas IA/mês', icon: <FileText className="w-4 h-4 sm:w-6" /> },
    { number: '24h', label: 'Secretária Virtual', icon: <Bot className="w-4 h-4 sm:w-6" /> }
  ];

  // Componente de Mockup Device
  const MockupDevice = ({ mockup }: { mockup: typeof mockupsData[0] }) => {
    if (mockup.type === 'mobile') {
      return (
        <div className="relative mx-auto" style={{ width: '280px', height: '560px' }}>
          {/* Smartphone frame */}
          <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 p-2 shadow-2xl">
            <div className="w-full h-full rounded-[2rem] bg-black overflow-hidden relative">
              {/* Notch */}
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-20 h-6 bg-black rounded-full z-10" />
              
              {/* Screen */}
              <div className="w-full h-full rounded-[2rem] overflow-hidden">
                <Image 
                  src= "/images/ramonribeiroMobile.png"
                  alt={mockup.title}
                  width={280}
                  height={580}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `
                        <div class="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                          <div class="text-center text-gray-400">
                            <div class="text-3xl mb-2">📱</div>
                            <div class="text-sm">Preview Mobile</div>
                            <div class="text-xs">${mockup.title}</div>
                          </div>
                        </div>
                      `;
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="relative mx-auto" style={{ width: '480px', height: '300px' }}>
          {/* Laptop frame */}
          <div className="absolute inset-0">
            {/* Screen */}
            <div className="w-full h-4/5 rounded-t-xl bg-black overflow-hidden shadow-2xl border-2 border-gray-800">
              <Image
                src="/images/ramonribeiroDesktop.png"
                alt={mockup.title}
                width={800}
                height={600}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `
                      <div class="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                        <div class="text-center text-gray-400">
                          <div class="text-4xl mb-3">💻</div>
                          <div class="text-base">Preview Desktop</div>
                          <div class="text-sm">${mockup.title}</div>
                        </div>
                      </div>
                    `;
                  }
                }}
              />
            </div>
            
            {/* Laptop base */}
            <div className="w-full h-1/5 bg-gradient-to-b from-gray-700 to-gray-900 rounded-b-2xl relative">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-2 bg-gray-600 rounded-full" />
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#000000] via-[#1a1a1a] to-[#2a2a2a]">
      {/* Background decorativo */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-[#b0825a] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
      <div className="absolute bottom-20 right-20 w-72 h-72 bg-[#b0825a] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000" />

      {/* Container Principal */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-4">
        {/* Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 border-b border-[#6e6d6b] border-opacity-20 backdrop-blur-sm"
           style={{ backgroundColor: 'rgba(20, 20, 20, 0.8)' }}>
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Botão Voltar */}
            <button
              onClick={handleBackToDashboard}
              className="flex items-center px-4 py-2 bg-[#2a2a2a] border border-[#6e6d6b] rounded-lg transition-all duration-300 transform hover:scale-105 hover:opacity-90 group"
            >
              <ArrowLeft className="w-4 h-4 mr-2 text-[#d4d4d4] group-hover:text-white transition-colors" style={{ opacity: 0.7 }} />
              <span className="text-[#d4d4d4] group-hover:text-white text-sm font-medium">Início</span>
            </button>

            {/* Logo Centralizada */}
            <div className="flex items-center justify-center flex-1 mx-4">
              <Scale className="w-6 h-6 text-[#b0825a] mr-2" style={{ opacity: 0.7 }} />
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#b0825a] text-shadow-lg">
                IAJURIS
              </h1>
              <Gavel className="w-6 h-6 text-[#b0825a] ml-2" style={{ opacity: 0.7 }} />
            </div>

            {/* CTA Header */}
            <div className="hidden sm:block">
              <button
                onClick={abrirModal}
                className="px-4 py-2 bg-gradient-to-r from-[#b0825a] to-[#8b6942] text-white text-sm font-semibold rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                Começar Agora
              </button>
            </div>
          </div>
        </div>

        {/* Hero Section - Totalmente reformulada */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 text-center">
          <div className="mb-8">
            {/* Badge de economia */}
            <div className="inline-flex items-center px-3 sm:px-4 py-2 rounded-full bg-gradient-to-r from-[#9b693e] to-[#91693b] text-[#d4d4d4] font-bold text-xs sm:text-sm mb-4 sm:mb-6">
              <AlertTriangle className="w-3 h-3 sm:w-4 mr-2" />
              PARE DE PAGAR R$ 5.000+ POR SITES INÚTEIS
            </div>

            {/* Headline principal */}
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-6xl font-black mb-4 sm:mb-6 leading-tight">
              <span className="text-white">Tenha</span>{' '}
              <span className="text-[#92b05a]">Site + App + IA</span>{' '}
              <span className="text-white">+</span>{' '}
              <span className="text-[#bbb687]">Secretária 24h</span>
              <br />
              <span className="text-white">por apenas</span>{' '}
              <span className="text-[#92b05a] text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-7xl">R$ 247/mês</span>
            </h2>

            {/* Destaque especial para 1.000 páginas */}
            <div className="inline-block mb-4 sm:mb-6 px-4 py-3 rounded-2xl bg-gradient-to-r from-[rgba(176,130,90,0.2)] to-[rgba(176,130,90,0.1)] border-2 border-[#b0825a] border-opacity-50">
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-[#bbb687] mb-1">
                ✨ ATÉ 1.000 PÁGINAS DE ANÁLISE IA POR MÊS
              </p>
              <p className="text-sm sm:text-base text-[#d4d4d4]">
                Mais de 30 páginas por dia • Análise completa em 30 segundos
              </p>
            </div>

            {/* Subheadline */}
            <p className="text-sm sm:text-base md:text-lg lg:text-xl mb-6 sm:mb-8 text-[#d4d4d4] max-w-4xl mx-auto leading-relaxed">
              Mais de <span className="font-bold text-[#b0825a]">1000 advogados</span> já cancelaram 
              seus sites caros e economizaram <span className="font-bold text-[#b0825a]">milhares</span> com nossa solução completa
            </p>

            {/* Comparação de preço em destaque */}
            <div className="inline-flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mb-6 sm:mb-8 p-3 sm:p-4 lg:p-6 rounded-2xl bg-[rgba(176,130,90,0.1)] border border-[#b0825a] border-opacity-30">
              <div className="text-center">
                <div className="text-[#6e6d6b] text-xs sm:text-sm lg:text-lg line-through">Sites tradicionais</div>
                <div className="text-[#6e6d6b] text-lg sm:text-xl lg:text-2xl font-bold line-through">R$ 5.000+</div>
              </div>
              <div className="text-xl sm:text-2xl lg:text-4xl text-[#b0825a]">→</div>
              <div className="text-center">
                <div className="text-[#b0825a] text-xs sm:text-sm lg:text-lg">IAJURIS completo</div>
                <div className="text-[#b0825a] text-lg sm:text-xl lg:text-3xl font-black">R$ 247/mês</div>
              </div>
            </div>

            {/* CTA Principal */}
            <button
              onClick={abrirModal}
              disabled={isLoading}
              className="px-4 sm:px-6 lg:px-12 py-3 sm:py-4 lg:py-6 text-sm sm:text-base lg:text-xl font-bold bg-gradient-to-br from-[#b0825a] via-[#8b6942] to-[#6d532a] text-white rounded-2xl transition-all duration-300 transform hover:scale-105 hover:opacity-90 active:scale-95 shadow-2xl disabled:opacity-50 mb-4 sm:mb-6"
              style={{ boxShadow: '0 15px 35px rgba(176, 130, 90, 0.4)' }}
            >
              <span className="hidden sm:inline">{isLoading ? 'Processando...' : 'QUERO MEU ESCRITÓRIO VIRTUAL AGORA'}</span>
              <span className="sm:hidden">{isLoading ? 'Processando...' : 'COMEÇAR AGORA'}</span>
            </button>

            {/* Garantias */}
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-[#cccccc]">
                <Check className="w-3 h-3 sm:w-4" />
                <span>72h teste grátis</span>
              </div>
              <div className="flex items-center gap-2 text-[#cccccc]">
                <Check className="w-3 h-3 sm:w-4" />
                <span>Ativação imediata</span>
              </div>
              <div className="flex items-center gap-2 text-[#cccccc]">
                <Check className="w-3 h-3 sm:w-4" />
                <span>Cancele quando quiser</span>
              </div>
              <div className="flex items-center gap-2 text-[#cccccc]">
                <Check className="w-3 h-3 sm:w-4" />
                <span>Sem taxa de setup</span>
              </div>
            </div>
          </div>
        </div>

        {/* Estatísticas de impacto */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 sm:mb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center transition-all duration-300 transform hover:scale-105"
                   style={{ 
                     backgroundColor: 'rgba(20, 20, 20, 0.8)',
                     border: '1px solid rgba(176, 130, 90, 0.2)',
                     backdropFilter: 'blur(8px)',
                     boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                   }}>
                <div className="flex justify-center mb-2 sm:mb-3 text-[#cccccc]">
                  {stat.icon}
                </div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2 text-[#84bb65]">{stat.number}</div>
                <div className="text-xs sm:text-sm text-[#cccccc]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Comparação com mercado */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 sm:mb-16">
          <h3 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8">
            <span className="text-white">Pare de</span>{' '}
            <span className="text-[#b0825a]">desperdiçar dinheiro!</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {marketComparison.map((comparison, index) => (
              <div key={index} className="rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-all duration-300 transform hover:scale-[1.02]"
                   style={{ 
                     backgroundColor: 'rgba(20, 20, 20, 0.8)',
                     border: '1px solid rgba(176, 130, 90, 0.2)',
                     backdropFilter: 'blur(8px)',
                     boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                   }}>
                <div className="flex items-center gap-3 sm:gap-4 mb-4">
                  <div className="text-2xl sm:text-3xl">{comparison.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <X className="w-3 h-3 sm:w-4 text-red-500" />
                      <span className="text-[#6e6d6b] line-through text-xs sm:text-sm">{comparison.traditional}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <Check className="w-3 h-3 sm:w-4 text-[#b0825a]" />
                      <span className="text-white font-semibold text-sm sm:text-base">{comparison.iajuris}</span>
                    </div>
                    <div className="rounded-lg px-3 py-2 bg-[rgba(176,130,90,0.1)] border border-[#b0825a] border-opacity-20">
                      <span className="text-[#b0825a] font-bold text-xs sm:text-sm">{comparison.economy}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4 Pilares Principais */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 sm:mb-16">
          <h3 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8">
            <span className="text-[#b0825a]">TUDO em 1:</span>{' '}
            <span className="text-white">Seu escritório completo</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {mainPillars.map((pillar, index) => (
              <div key={index} className="rounded-xl sm:rounded-2xl p-6 sm:p-8 transition-all duration-300 transform hover:scale-[1.02]"
                   style={{ 
                     backgroundColor: 'rgba(20, 20, 20, 0.8)',
                     border: '1px solid rgba(176, 130, 90, 0.2)',
                     backdropFilter: 'blur(8px)',
                     boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                   }}>
                <div className="flex items-start gap-4 sm:gap-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center bg-[rgba(176,130,90,0.2)] border border-[#b0825a] border-opacity-30 flex-shrink-0 text-[#b0825a]">
                    {pillar.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg sm:text-xl font-bold mb-2 text-white">{pillar.title}</h4>
                    <p className="text-[#b0825a] font-semibold mb-3 text-sm sm:text-base">{pillar.subtitle}</p>
                    <p className="text-[#d4d4d4] mb-4 leading-relaxed text-sm sm:text-base">{pillar.description}</p>
                    <div className="inline-block px-3 sm:px-4 py-2 rounded-full bg-[rgba(176,130,90,0.1)] border border-[#b0825a] border-opacity-20">
                      <span className="text-[#b0825a] font-bold text-xs sm:text-sm">{pillar.benefit}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* NOVA SEÇÃO: Slider de Mockups */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 sm:mb-16">
          <h3 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8">
            <span className="text-white">Veja como ficará</span>{' '}
            <span className="text-[#b0825a]">sua página profissional</span>
          </h3>

          <div className="relative rounded-2xl sm:rounded-3xl p-6 sm:p-8"
               style={{ 
                 backgroundColor: 'rgba(20, 20, 20, 0.8)',
                 border: '1px solid rgba(176, 130, 90, 0.2)',
                 backdropFilter: 'blur(8px)',
                 boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
               }}>
            
            {/* Conteúdo do Slider */}
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
              
              {/* Mockup Device - Lado Esquerdo */}
              <div className="flex-1 flex justify-center">
                <div className="transition-all duration-500 transform">
                  <MockupDevice mockup={mockupsData[currentMockup]} />
                </div>
              </div>

              {/* Informações - Lado Direito */}
              <div className="flex-1 text-center lg:text-left">
                <div className="mb-4">
                  <div className="inline-flex items-center gap-2 mb-3">
                    {mockupsData[currentMockup].type === 'mobile' ? (
                      <Smartphone className="w-5 h-5 text-[#d4d4d4]" />
                    ) : (
                      <Monitor className="w-5 h-5 text-[#d4d4d4]" />
                    )}
                    <span className="text-sm text-[#cccccc] font-semibold">
                      {mockupsData[currentMockup].type === 'mobile' ? 'Mobile' : 'Desktop'}
                    </span>
                  </div>
                  
                  <div className="inline-block px-3 py-1 rounded-full bg-[rgba(176,130,90,0.2)] border border-[#b0825a] border-opacity-30 mb-4">
                    <span className="text-xs font-bold text-[#d4d4d4]">
                      {mockupsData[currentMockup].badge}
                    </span>
                  </div>
                </div>

                <h4 className="text-xl sm:text-2xl font-bold mb-3 text-white">
                  {mockupsData[currentMockup].title}
                </h4>
                
                <p className="text-[#d4d4d4] mb-6 leading-relaxed">
                  {mockupsData[currentMockup].description}
                </p>

                {/* Features do mockup atual */}
                <div className="space-y-3 mb-6">
                  {currentMockup === 0 && (
                    <>
                      <div className="flex items-center gap-3 text-sm text-[#d4d4d4]">
                        <Check className="w-4 h-4 text-[#b0825a]" />
                        <span>Layout profissional responsivo</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-[#d4d4d4]">
                        <Check className="w-4 h-4 text-[#b0825a]" />
                        <span>Informações básicas organizadas</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-[#d4d4d4]">
                        <Check className="w-4 h-4 text-[#b0825a]" />
                        <span>Ativação imediata incluída</span>
                      </div>
                    </>
                  )}
                  {currentMockup === 1 && (
                    <>
                      <div className="flex items-center gap-3 text-sm text-[#d4d4d4]">
                        <Check className="w-4 h-4 text-[#b0825a]" />
                        <span>Logo e identidade personalizada</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-[#d4d4d4]">
                        <Check className="w-4 h-4 text-[#b0825a]" />
                        <span>Informações profissionais completas</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-[#d4d4d4]">
                        <Check className="w-4 h-4 text-[#b0825a]" />
                        <span>Especialização bem definida</span>
                      </div>
                    </>
                  )}
                  {currentMockup === 2 && (
                    <>
                      <div className="flex items-center gap-3 text-sm text-[#d4d4d4]">
                        <Check className="w-4 h-4 text-[#b0825a]" />
                        <span>Totalmente responsivo</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-[#d4d4d4]">
                        <Check className="w-4 h-4 text-[#b0825a]" />
                        <span>Experiência mobile nativa</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-[#d4d4d4]">
                        <Check className="w-4 h-4 text-[#b0825a]" />
                        <span>Foto profissional integrada</span>
                      </div>
                    </>
                  )}
                  {currentMockup === 3 && (
                    <>
                      <div className="flex items-center gap-3 text-sm text-[#d4d4d4]">
                        <Check className="w-4 h-4 text-[#b0825a]" />
                        <span>Paleta de cores personalizada</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-[#d4d4d4]">
                        <Check className="w-4 h-4 text-[#b0825a]" />
                        <span>Identidade visual única</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-[#d4d4d4]">
                        <Check className="w-4 h-4 text-[#b0825a]" />
                        <span>Branding profissional</span>
                      </div>
                    </>
                  )}
                </div>

                <button
                  onClick={abrirModal}
                  className="w-full lg:w-auto px-6 py-3 bg-gradient-to-r from-[#b0825a] to-[#8b6942] text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105"
                >
                  Criar Minha Página Agora
                </button>
              </div>
            </div>

            {/* Controles de Navegação */}
            <div className="flex items-center justify-center gap-4 mt-8">
              {/* Botão Anterior */}
              <button
                onClick={prevMockup}
                className="p-2 rounded-full bg-[rgba(176,130,90,0.1)] border border-[#b0825a] border-opacity-30 text-[#b0825a] transition-all duration-300 hover:bg-[rgba(176,130,90,0.2)]"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Indicadores */}
              <div className="flex gap-2">
                {mockupsData.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToMockup(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentMockup 
                        ? 'bg-[#b0825a] scale-110' 
                        : 'bg-[rgba(176,130,90,0.3)] hover:bg-[rgba(176,130,90,0.5)]'
                    }`}
                  />
                ))}
              </div>

              {/* Botão Próximo */}
              <button
                onClick={nextMockup}
                className="p-2 rounded-full bg-[rgba(176,130,90,0.1)] border border-[#b0825a] border-opacity-30 text-[#b0825a] transition-all duration-300 hover:bg-[rgba(176,130,90,0.2)]"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Badge de informação */}
            <div className="text-center mt-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[rgba(176,130,90,0.1)] border border-[#b0825a] border-opacity-20">
                <Star className="w-4 h-4 text-[#b0825a]" />
                <span className="text-sm text-[#cccccc] font-semibold">
                  Mais de 1000 advogados já escolheram a IAJURIS
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Plano único em destaque */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 sm:mb-16">
          <h3 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8">
            <span className="text-[#d4d4d4]">Tudo isso por apenas</span>{' '}
            <span className="text-[#8fc75b]">R$ 247/mês</span>
          </h3>

          <div className="relative">
            <div className="rounded-2xl sm:rounded-3xl p-6 sm:p-8 transition-all duration-300 transform hover:scale-[1.02]"
                 style={{ 
                   backgroundColor: 'rgba(20, 20, 20, 0.8)',
                   border: '2px solid #b0825a',
                   backdropFilter: 'blur(8px)',
                   boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                 }}>
              
              {/* Badge popular */}
              <div className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-[#b0825a] text-black text-xs sm:text-sm font-bold px-4 sm:px-6 py-2 rounded-full">
                  MAIS DE 1000 ADVOGADOS ESCOLHERAM
                </div>
              </div>

              <div className="text-center mb-6 sm:mb-8 mt-4">
                <h4 className="text-xl sm:text-2xl font-bold mb-4 text-white">{PLAN.name}</h4>
                <p className="mb-4 text-[#d4d4d4] text-sm sm:text-base">{PLAN.description}</p>
                
                {/* Destaque especial para 1.000 páginas */}
                <div className="inline-block mb-4 px-4 py-2 rounded-xl bg-gradient-to-r from-[rgba(176,130,90,0.2)] to-[rgba(176,130,90,0.1)] border border-[#b0825a] border-opacity-50">
                  <p className="text-sm sm:text-base font-bold text-[#b0825a]">
                    ⚡ {PLAN.monthlyAnalysis}
                  </p>
                </div>
                
                <div className="mb-6">
                  <div className="flex items-center justify-center gap-3 sm:gap-4 mb-2">
                    <span className="text-[#6e6d6b] text-lg sm:text-xl line-through">{PLAN.originalPrice}</span>
                    <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#cccccc]">{PLAN.price}</span>
                    <span className="text-lg sm:text-xl text-[#d4d4d4]">/mês</span>
                  </div>
                  <p className="text-[#64b05a] font-bold text-sm sm:text-base">97% mais barato que sites tradicionais</p>
                </div>

                <button
                  onClick={abrirModal}
                  disabled={isLoading}
                  className="w-full py-3 sm:py-4 text-base sm:text-lg font-bold bg-gradient-to-br from-[#b0825a] via-[#8b6942] to-[#6d532a] text-white rounded-xl transition-all duration-300 transform hover:scale-105 hover:opacity-90 active:scale-95 shadow-xl disabled:opacity-50 mb-4"
                  style={{ boxShadow: '0 10px 25px rgba(176, 130, 90, 0.3)' }}
                >
                  {isLoading ? 'Processando...' : 'COMEÇAR AGORA - REVOLUCIONAR PRODUTIVIDADE'}
                </button>

                <p className="text-xs text-[#6e6d6b]">Sem compromisso • Cancele quando quiser</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {PLAN.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3 text-xs sm:text-sm text-[#d4d4d4]">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center bg-[rgba(176,130,90,0.2)] border border-[#b0825a] border-opacity-30">
                      <Check className="w-3 h-3 sm:w-4 text-[#b0825a]" />
                    </div>
                    <span className="flex items-center gap-2">
                      <span className="text-sm sm:text-base">{feature.icon}</span>
                      <span>{feature.text}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Depoimentos */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 sm:mb-16">
          <h3 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8">
            <span className="text-white">Advogados que</span>{' '}
            <span className="text-[#b0825a]">economizaram milhares</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-all duration-300 transform hover:scale-[1.02]"
                   style={{ 
                     backgroundColor: 'rgba(20, 20, 20, 0.8)',
                     border: '1px solid rgba(176, 130, 90, 0.2)',
                     backdropFilter: 'blur(8px)',
                     boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                   }}>
                <div className="text-center">
                  <div className="w-12 sm:w-16 h-12 sm:h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl sm:text-3xl bg-[rgba(176,130,90,0.2)] border border-[#b0825a] border-opacity-30">
                    {testimonial.avatar}
                  </div>

                  <div className="flex justify-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 sm:w-4 text-[#b0825a]" />
                    ))}
                  </div>

                  <p className="mb-4 italic leading-relaxed text-xs sm:text-sm text-[#d4d4d4]">
                    &quot;{testimonial.text}&quot;
                  </p>

                  <div className="mb-3">
                    <p className="font-bold mb-1 text-[#b0825a] text-sm sm:text-base">{testimonial.name}</p>
                    <p className="text-xs text-[#6e6d6b]">{testimonial.position}</p>
                  </div>
                  
                  <div className="inline-block px-3 py-1 rounded-full bg-[rgba(176,130,90,0.1)] border border-[#b0825a] border-opacity-20">
                    <span className="text-xs font-bold text-[#b0825a]">{testimonial.savings}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 sm:mb-16">
          <h3 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8">
            <span className="text-white">Dúvidas</span>{' '}
            <span className="text-[#b0825a]">Frequentes</span>
          </h3>

          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <div key={index} className="rounded-xl sm:rounded-2xl p-4 sm:p-6"
                   style={{ 
                     backgroundColor: 'rgba(20, 20, 20, 0.8)',
                     border: '1px solid rgba(176, 130, 90, 0.2)',
                     backdropFilter: 'blur(8px)',
                     boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                   }}>
                <button
                  onClick={() => setShowFAQ(showFAQ === index ? null : index)}
                  className="w-full text-left flex items-center justify-between"
                >
                  <span className="font-semibold text-white pr-4 text-sm sm:text-base">{faq.question}</span>
                  <div className={`transform transition-transform duration-300 ${showFAQ === index ? 'rotate-180' : ''}`}>
                    <svg className="w-4 h-4 sm:w-5 text-[#b0825a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                {showFAQ === index && (
                  <div className="mt-4">
                    <p className="text-[#d4d4d4] leading-relaxed text-sm sm:text-base">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA Final */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-12 sm:mb-16">
          <div className="rounded-2xl sm:rounded-3xl p-8 sm:p-12"
               style={{ 
                 backgroundColor: 'rgba(20, 20, 20, 0.8)',
                 border: '2px solid rgba(176, 130, 90, 0.5)',
                 backdropFilter: 'blur(8px)',
                 boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
               }}>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">
              <span className="text-white">Pare de</span>{' '}
              <span className="text-[#b0825a]">desperdiçar R$ 5.000+</span>
              <br />
              <span className="text-white">Tenha tudo por</span>{' '}
              <span className="text-[#92c568]">R$ 247/mês</span>
            </h3>
            
            <p className="text-lg sm:text-xl mb-6 sm:mb-8 text-[#d4d4d4] leading-relaxed">
              Junte-se aos <span className="font-bold text-[#b0825a]">1000+ advogados</span> que já 
              economizaram milhares com o único Escritório Virtual completo do Brasil
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6 sm:mb-8">
              <button
                onClick={abrirModal}
                disabled={isLoading}
                className="px-6 sm:px-8 py-3 sm:py-4 text-lg sm:text-xl font-bold bg-gradient-to-br from-[#b0825a] via-[#8b6942] to-[#6d532a] text-white rounded-2xl transition-all duration-300 transform hover:scale-105 hover:opacity-90 active:scale-95 shadow-xl disabled:opacity-50"
                style={{ boxShadow: '0 15px 35px rgba(176, 130, 90, 0.4)' }}
              >
                {isLoading ? 'Processando...' : 'COMEÇAR AGORA - REVOLUCIONAR PRODUTIVIDADE'}
              </button>
              
              <div className="text-center">
                <p className="text-[#92c568] font-bold text-sm sm:text-base">Ativação imediata</p>
              </div>
            </div>

            {/* Garantias finais */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-xl bg-[rgba(176,130,90,0.1)] border border-[#b0825a] border-opacity-20">
                <Check className="w-5 h-5 sm:w-6 text-[#b0825a] mx-auto mb-2" />
                <p className="text-xs sm:text-sm font-semibold text-[#cccccc]">Site + App + IA</p>
              </div>
              <div className="p-2 sm:p-3 rounded-xl bg-[rgba(176,130,90,0.1)] border border-[#b0825a] border-opacity-20">
                <Bot className="w-5 h-5 sm:w-6 text-[#b0825a] mx-auto mb-2" />
                <p className="text-xs sm:text-sm font-semibold text-[#cccccc]">Secretária 24h</p>
              </div>
              <div className="p-2 sm:p-3 rounded-xl bg-[rgba(176,130,90,0.1)] border border-[#b0825a] border-opacity-20">
                <Shield className="w-5 h-5 sm:w-6 text-[#b0825a] mx-auto mb-2" />
                <p className="text-xs sm:text-sm font-semibold text-[#cccccc]">100% Seguro</p>
              </div>
              <div className="p-2 sm:p-3 rounded-xl bg-[rgba(176,130,90,0.1)] border border-[#b0825a] border-opacity-20">
                <Zap className="w-5 h-5 sm:w-6 text-[#b0825a] mx-auto mb-2" />
                <p className="text-xs sm:text-sm font-semibold text-[#cccccc]">Ativação Imediata</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Cadastro - Responsivo */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={fecharModal} />
          
          <div className="relative rounded-2xl p-4 sm:p-6 w-full max-w-xs sm:max-w-sm mx-auto my-4 sm:my-8 max-h-[90vh] overflow-y-auto"
               style={{ 
                 backgroundColor: 'rgba(20, 20, 20, 0.95)',
                 border: '1px solid rgba(176, 130, 90, 0.3)',
                 backdropFilter: 'blur(16px)',
                 boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
               }}>
            <div className="text-center mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full mx-auto mb-3 flex items-center justify-center bg-gradient-to-br from-[#b0825a] to-[#8b6942]">
                <Star className="w-5 h-5 sm:w-6 text-white" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-1">Escritório Virtual</h3>
              <p className="text-[#b0825a] font-bold text-xs sm:text-sm mb-1">Site + App + IA + Secretária 24h</p>
              <p className="text-xl sm:text-2xl font-black text-[#92c568] mb-1">R$ 247/mês</p>
              <p className="text-xs text-[#6e6d6b]">Revolucione sua produtividade</p>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-medium mb-1 text-[#d4d4d4]">
                  <User className="w-3 h-3 inline mr-1" />
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={modalData.nome}
                  onChange={(e) => setModalData({...modalData, nome: e.target.value})}
                  placeholder="Dr. João Silva"
                  disabled={modalLoading}
                  className="w-full p-2 sm:p-3 rounded-xl bg-[rgba(40,40,40,0.8)] border border-[#6e6d6b] text-white text-sm placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#b0825a] transition-all duration-300"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 text-[#d4d4d4]">
                  <Mail className="w-3 h-3 inline mr-1" />
                  Email Profissional
                </label>
                <input
                  type="email"
                  value={modalData.email}
                  onChange={(e) => setModalData({...modalData, email: e.target.value})}
                  placeholder="joao.silva@email.com"
                  disabled={modalLoading}
                  className="w-full p-2 sm:p-3 rounded-xl bg-[rgba(40,40,40,0.8)] border border-[#6e6d6b] text-white text-sm placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#b0825a] transition-all duration-300"
                />
              </div>
            </div>

            <div className="rounded-xl p-3 mb-4 bg-[rgba(176,130,90,0.1)] border border-[#b0825a] border-opacity-20">
              <p className="text-xs font-bold mb-2 text-[#b0825a]">Acesso imediato:</p> 
              <ul className="text-xs space-y-1">
                <li className="flex items-center gap-1 text-[#d4d4d4]">
                  <Check className="w-3 h-3 text-[#b0825a] flex-shrink-0" />
                  <span>Site + App Mobile</span>
                </li>
                <li className="flex items-center gap-1 text-[#d4d4d4]">
                  <Check className="w-3 h-3 text-[#b0825a] flex-shrink-0" />
                  <span>IA até 1.000 páginas/mês</span>
                </li>
                <li className="flex items-center gap-1 text-[#d4d4d4]">
                  <Check className="w-3 h-3 text-[#b0825a] flex-shrink-0" />
                  <span>Secretária Virtual 24h</span>
                </li>
                <li className="flex items-center gap-1 text-[#d4d4d4]">
                  <Check className="w-3 h-3 text-[#b0825a] flex-shrink-0" />
                  <span>Gestão financeira completa</span>
                </li>
              </ul>
            </div>

            <div className="flex gap-2 mb-3">
              <button
                onClick={fecharModal}
                disabled={modalLoading}
                className="flex-1 py-2 sm:py-3 text-xs sm:text-sm rounded-xl bg-[#2a2a2a] border border-[#6e6d6b] text-white transition-all duration-300 hover:opacity-80 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={processarCheckout}
                disabled={modalLoading}
                className="flex-2 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm rounded-xl font-bold bg-gradient-to-br from-[#b0825a] via-[#8b6942] to-[#6d532a] text-white transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
                style={{ boxShadow: '0 10px 25px rgba(176, 130, 90, 0.3)' }}
              >
                {modalLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Processando...
                  </div>
                ) : (
                  'ASSINAR IAJURIS'
                )}
              </button>
            </div>

            <p className="text-center text-xs text-[#6e6d6b]">
              Seguro • Cancele quando quiser • iajurissuporte@outlook.com
            </p>
          </div>
        </div>
      )}

      {/* CSS Customizado */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.2; transform: scale(1.05); }
        }
        .animation-delay-2000 { animation-delay: 2s; }
        .animate-pulse { animation: pulse 3s ease-out infinite; }
      `}</style>
    </div>
  );
}
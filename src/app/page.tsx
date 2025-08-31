'use client';

import Link from 'next/link';
import Head from 'next/head';
import React, { useState, useEffect } from 'react';

export default function Home() {//eslint-disable-next-line
  const [isVisible, setIsVisible] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setIsVisible(true);
    
    // Preload da imagem principal
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.src = '/images/proximo-advogado-ai-robo.jpg';
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Função para solicitar teste gratuito
  const solicitarTeste = () => {
    const emailBody = `Olá!

Gostaria de solicitar o teste gratuito de 72 horas da IAJURIS.

Meus dados:
- Nome: [SEU NOME COMPLETO]
- Email: [SEU EMAIL]
- OAB: [SEU NÚMERO OAB]
- Especialidade: [SUA ESPECIALIDADE JURÍDICA]
- Cidade/Estado: [SUA CIDADE/UF]

Aguardo o retorno com as credenciais de acesso!

Obrigado.`;

    const mailtoLink = `mailto:iajurissuporte@outlook.com?subject=Solicitação Teste Gratuito - 72h&body=${encodeURIComponent(emailBody)}`;
    window.location.href = mailtoLink;
  };

  const benefits = [
    {
      icon: '🌐',
      title: 'Aplicação Web Completa',
      description: 'Sistema completo com site profissional personalizado + aplicação web responsiva. Gerencie tudo em uma única plataforma moderna.',
    },
    {
      icon: '🤖',
      title: 'IA para Documentos Jurídicos',
      description: 'Gere contratos, petições, pareceres e documentos jurídicos automaticamente com IA especializada em Direito Brasileiro.',
    },
    {
      icon: '📊',
      title: 'Gestão Financeira Completa',
      description: 'Controle receitas, despesas, honorários e fluxo de caixa. Relatórios automáticos e dashboard financeiro em tempo real.',
    },
    {
      icon: '📄',
      title: 'Análise Inteligente de PDFs',
      description: 'Analise contratos, processos e documentos jurídicos em segundos. IA extrai informações relevantes e gera resumos executivos.',
    },
  ];

  return (
    <>
      <Head>
        <link rel="preload" href="/images/proximo-advogado-ai-robo.jpg" as="image" />
      </Head>
      
      <main
        className="min-h-screen flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 relative overflow-hidden pt-16 sm:pt-20 lg:pt-24 pb-16 sm:pb-20 lg:pb-24"
        style={{
          backgroundImage: imageLoaded ? "url('/images/proximo-advogado-ai-robo.jpg')" : 'none',
          backgroundColor: imageLoaded ? 'transparent' : '#1a1a1a',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          transition: 'background-image 0.3s ease-in-out',
        }}
      >
        {/* Logo/Botão disfarçado no canto superior esquerdo - SEU LOGIN EXCLUSIVO */}
        <Link
          href="/login"
          className="absolute top-4 left-4 z-40 group transition-all duration-300 hover:scale-110"
        >
          <div 
            className="px-3 py-2 rounded-lg text-xs font-bold opacity-20 hover:opacity-100 transition-all duration-300 border border-opacity-30 backdrop-blur-sm"
            style={{ 
              backgroundColor: 'rgba(176, 130, 90, 0.2)',
              borderColor: '#b0825a',
              color: '#b0825a'
            }}
          >
            IAJURIS
          </div>
        </Link>

        {/* Overlay escuro */}
        <div className="absolute inset-0 bg-black/50 z-10" />

        {/* Efeitos visuais de partículas */}
        <div className="absolute inset-0 overflow-hidden z-20">
          <div
            className="absolute top-10 sm:top-20 left-10 sm:left-20 w-16 sm:w-20 lg:w-28 h-16 sm:h-20 lg:h-28 border border-current rounded-full animate-pulse opacity-10"
            style={{ color: '#b0825a' }}
          ></div>
          <div
            className="absolute bottom-10 sm:bottom-20 right-10 sm:right-20 w-12 sm:w-16 lg:w-20 h-12 sm:h-16 lg:h-20 border border-current rounded-full animate-pulse opacity-10 animation-delay-1000"
            style={{ color: '#6e6d6b' }}
          ></div>
          <div
            className="absolute top-1/2 left-5 sm:left-10 w-8 sm:w-12 lg:w-16 h-8 sm:h-12 lg:h-16 border border-current rounded-full animate-pulse opacity-10 animation-delay-2000"
            style={{ color: '#b0825a' }}
          ></div>
          <div
            className="absolute top-1/4 right-1/4 w-6 sm:w-8 lg:w-12 h-6 sm:h-8 lg:h-12 border border-current rounded-full animate-pulse opacity-10 animation-delay-3000"
            style={{ color: '#6e6d6b' }}
          ></div>

          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black opacity-30" />

          <div
            className="absolute w-48 sm:w-64 lg:w-80 h-48 sm:h-64 lg:h-80 rounded-full pointer-events-none transition-all duration-1000 opacity-5"
            style={{
              background: `radial-gradient(circle, #b0825a 0%, transparent 70%)`,
              left: mousePosition.x - 96,
              top: mousePosition.y - 96,
            }}
          />
        </div>

        {/* Conteúdo principal */}
        <div className="relative z-30 max-w-6xl mx-auto transition-all duration-1000 text-white">
          {/* Título REFORMULADO */}
          <div className="mb-8 sm:mb-10 lg:mb-12">
            <h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6 tracking-wider leading-none"
              style={{ color: '#b0825a' }}
            >
              IAJURIS
            </h1>

            <div className="flex items-center justify-center gap-2 sm:gap-4 mb-4 sm:mb-6">
              <div
                className="h-px w-8 sm:w-12 lg:w-16 bg-gradient-to-r from-transparent to-current"
                style={{ color: '#b0825a' }}
              ></div>
              <div
                className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full"
                style={{ backgroundColor: '#b0825a' }}
              ></div>
              <div
                className="h-px w-8 sm:w-12 lg:w-16 bg-gradient-to-l from-transparent to-current"
                style={{ color: '#b0825a' }}
              ></div>
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 text-white leading-tight">
              Sistema Completo com IA Jurídica + Site Personalizado
            </h2>
            
            <p className="text-sm sm:text-base md:text-lg lg:text-xl mb-4 sm:mb-6 max-w-3xl mx-auto leading-relaxed font-light text-white px-2">
              Geração de documentos, análise de PDFs, gestão financeira e{' '}
              <span className="font-semibold" style={{ color: '#b0825a' }}>
                site profissional incluído
              </span>
            </p>
            
            <p
              className="text-xs sm:text-sm md:text-base opacity-70 max-w-2xl mx-auto leading-relaxed px-2"
              style={{ color: '#bfbfbf' }}
            >
              Aplicação web moderna + IA especializada em Direito Brasileiro
            </p>
          </div>

          {/* Estatísticas REFORMULADAS */}
          <div className="mb-10 sm:mb-12 lg:mb-16">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-4xl mx-auto">
              {[
                { number: '1000+', label: 'Documentos IA/mês', sublabel: 'Geração automática' },
                { number: '24h', label: 'Site Profissional', sublabel: 'Personalizado incluído' },
                { number: '500+', label: 'PDFs Analisados/mês', sublabel: 'IA jurídica especializada' },
              ].map((stat, index) => (
                <div key={index} className="text-center group">
                  <div className="relative">
                    <div
                      className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-2 transition-all duration-300 group-hover:scale-110"
                      style={{ color: '#b0825a' }}
                    >
                      {stat.number}
                    </div>
                    <div className="text-sm sm:text-base lg:text-lg font-semibold mb-1 text-white">
                      {stat.label}
                    </div>
                    <div className="text-xs sm:text-sm opacity-60" style={{ color: '#bfbfbf' }}>
                      {stat.sublabel}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SEÇÃO TESTE GRATUITO - NOVA */}
          <div className="mb-10 sm:mb-12 lg:mb-16">
            <div 
              className="relative p-4 sm:p-6 lg:p-8 rounded-2xl border-2 backdrop-blur-lg mx-2 sm:mx-4"
              style={{
                backgroundColor: 'rgba(176, 130, 90, 0.1)',
                borderColor: '#b0825a',
              }}
            >
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-green-400">TESTE GRATUITO DISPONÍVEL</span>
                </div>
                
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-4 text-white">
                  Experimente por 72h - Todas as Funcionalidades
                </h3>
                
                <p className="text-sm sm:text-base mb-6 opacity-90" style={{ color: '#bfbfbf' }}>
                  Teste a geração de documentos com IA, análise de PDFs, gestão financeira e tenha seu site personalizado criado durante o período de teste.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-center mb-4">
                  <div className="flex items-center gap-2 text-xs sm:text-sm" style={{ color: '#05df72' }}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Acesso total por 72h
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm" style={{ color: '#05df72' }}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Site personalizado incluído
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm" style={{ color: '#05df72' }}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Suporte personalizado
                  </div>
                </div>
                
                <button
                  onClick={solicitarTeste}
                  className="group relative inline-flex items-center gap-3 font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl transition-all duration-300 hover:shadow-xl hover:scale-105 transform text-sm sm:text-base border-2 mb-3"
                  style={{ 
                    backgroundColor: 'transparent',
                    borderColor: '#a1744e',
                    color: '#a1744e'
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a1 1 0 001.415 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Solicitar Teste Gratuito (72h)
                </button>
                
                <p className="text-xs opacity-70" style={{ color: '#bfbfbf' }}>
                  Envie um email automático com seus dados • Resposta em até 2h úteis
                </p>
              </div>
            </div>
          </div>

          {/* URGÊNCIA E SOCIAL PROOF */}
          <div className="mb-10 sm:mb-12 lg:mb-16">
            <div 
              className="relative p-4 sm:p-6 rounded-2xl border border-opacity-30 backdrop-blur-lg mx-2 sm:mx-4"
              style={{
                backgroundColor: 'rgba(176, 130, 90, 0.15)',
                borderColor: '#b0825a',
              }}
            >
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-red-400">OFERTA LIMITADA</span>
              </div>
              <p className="text-sm sm:text-base lg:text-lg font-semibold text-white mb-2">
                Últimas vagas com preço promocional ante ao retorno dos valores oficiais
              </p>
              <p className="text-xs sm:text-sm opacity-80" style={{ color: '#bfbfbf' }}>
                Sistema completo + site personalizado por R$ 247/mês
              </p>
            </div>
          </div>

          {/* CTA PRINCIPAL - ÚNICO E FOCADO */}
          <div className="mb-12 sm:mb-16 lg:mb-20">
            <Link
              href="/plano-empresa"
              className="group/btn relative inline-flex items-center gap-3 font-bold py-4 sm:py-5 lg:py-6 px-8 sm:px-10 lg:px-12 rounded-xl sm:rounded-2xl transition-all duration-500 hover:shadow-2xl hover:scale-105 transform text-base sm:text-lg lg:text-xl border-2 mb-4"
              style={{ 
                backgroundColor: '#b0825a',
                borderColor: '#b0825a',
                color: '#ffffff'
              }}
            >
              <span className="relative z-10">
                Assinar Sistema Completo Agora
              </span>
              <svg 
                className="w-5 sm:w-6 h-5 sm:h-6 transition-transform duration-300 group-hover/btn:translate-x-1" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              
              <div 
                className="absolute inset-0 rounded-xl sm:rounded-2xl opacity-0 group-hover/btn:opacity-20 transition-opacity duration-300 bg-black"
              ></div>
            </Link>

            <div className="text-center">
              <p className="text-sm mb-2" style={{ color: '#b0825a' }}>
                Site personalizado em 24h • Cancelamento a qualquer momento • Suporte especializado
              </p>
              <p className="text-xs opacity-60" style={{ color: '#bfbfbf' }}>
                IA + Gestão + Site profissional • Tudo integrado em uma plataforma
              </p>
            </div>
          </div>

          {/* Por que escolher - REFORMULADO COM FOCO NAS FUNCIONALIDADES */}
          <div className="mb-12 sm:mb-16 lg:mb-20">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-white px-2">
              Funcionalidades Principais:
            </h2>
            
            <p className="text-sm sm:text-base mb-8 sm:mb-10 lg:mb-12 opacity-80 max-w-2xl mx-auto" style={{ color: '#bfbfbf' }}>
              Sistema completo de gestão jurídica com{' '}
              <span style={{ color: '#b0825a' }}>IA especializada em Direito Brasileiro</span>
            </p>
            <p className="text-sm sm:text-base mb-8 sm:mb-10 lg:mb-12 opacity-80 max-w-2xl mx-auto" style={{ color: '#bfbfbf' }}>
              Fale conosco pelo email:
              <span style={{ color: '#05df72' }}> <strong>iajurissuporte@outlook.com</strong></span>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 max-w-6xl mx-auto">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="group p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl border border-opacity-20 backdrop-blur-sm hover:border-opacity-40 transition-all duration-300 hover:transform hover:scale-105 mx-2 sm:mx-0"
                  style={{
                    backgroundColor: 'rgba(26, 26, 26, 0.8)',
                    borderColor: '#6e6d6b',
                  }}
                >
                  <div className="relative">
                    <div
                      className="w-12 sm:w-14 lg:w-16 h-12 sm:h-14 lg:h-16 rounded-xl sm:rounded-2xl mx-auto mb-4 sm:mb-6 flex items-center justify-center text-xl sm:text-2xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-12"
                      style={{ backgroundColor: '#b0825a' }}
                    >
                      {benefit.icon}
                    </div>

                    <h3
                      className="text-sm sm:text-base lg:text-lg font-bold mb-3 sm:mb-4 group-hover:text-current transition-colors duration-300 text-white"
                    >
                      {benefit.title}
                    </h3>

                    <p
                      className="text-xs sm:text-sm leading-relaxed opacity-80"
                      style={{ color: '#bfbfbf' }}
                    >
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TESTIMONIAL SIMULADO */}
          <div className="mb-12 sm:mb-16 lg:mb-20">
            <div 
              className="relative p-4 sm:p-6 lg:p-8 rounded-2xl border border-opacity-30 backdrop-blur-lg mx-2 sm:mx-4"
              style={{
                backgroundColor: 'rgba(26, 26, 26, 0.6)',
                borderColor: '#b0825a',
              }}
            >
              <div className="text-center">
                <div className="text-2xl mb-4">⭐⭐⭐⭐⭐</div>
                <p className="text-sm sm:text-base lg:text-lg italic mb-4 text-white">
                  &quot;A IA gera meus contratos em minutos e o sistema de gestão financeira organizou completamente meu escritório. O site personalizado trouxe credibilidade imediata.&quot;
                </p>
                <p className="text-sm font-semibold" style={{ color: '#b0825a' }}>
                  Dra. Ana Paula Costa - Direito Empresarial • Rio de Janeiro/RJ
                </p>
              </div>
            </div>
          </div>

          {/* Botões de acesso - REFORMULADO */}
          <div className="mb-12 sm:mb-16 lg:mb-20">
            <p className="text-sm mb-4 text-white opacity-80">Já possui cadastro na plataforma?</p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {/* Botão para acesso profissional */}
              <Link
                href="/auth/advogado/signin"
                className="group relative inline-flex items-center gap-2 font-semibold py-3 px-6 rounded-lg border-2 transition-all duration-300 hover:bg-white hover:text-black text-sm"
                style={{ borderColor: '#b0825a', color: '#b0825a' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Entrar na Plataforma
              </Link>
            </div>
          </div>

          {/* Rodapé */}
          <div className="pt-8 sm:pt-12 border-t border-opacity-20 px-2" style={{ borderColor: '#6e6d6b' }}>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-xs sm:text-sm opacity-60 text-center md:text-left" style={{ color: '#bfbfbf' }}>
                © 2025 IAJURIS - Sistema completo de gestão jurídica com IA
              </p>
              <div className="flex gap-4 sm:gap-6">
                <a
                  href="#"
                  className="text-xs sm:text-sm opacity-60 hover:opacity-100 transition-opacity"
                  style={{ color: '#bfbfbf' }}
                >
                  Política de Privacidade
                </a>
                <a
                  href="#"
                  className="text-xs sm:text-sm opacity-60 hover:opacity-100 transition-opacity"
                  style={{ color: '#bfbfbf' }}
                >
                  Termos de Uso
                </a>
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes pulse {
            0%,
            100% {
              opacity: 0.1;
              transform: scale(1);
            }
            50% {
              opacity: 0.2;
              transform: scale(1.05);
            }
          }

          .animation-delay-1000 {
            animation-delay: 1s;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          .animation-delay-3000 {
            animation-delay: 3s;
          }
          .animate-pulse {
            animation: pulse 3s ease-in-out infinite;
          }
        `}</style>
      </main>
    </>
  );
}
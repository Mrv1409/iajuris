'use client';

import Link from 'next/link';
import React, { useState, useEffect } from 'react';

export default function Home() {//eslint-disable-next-line
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setIsVisible(true);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const benefits = [
    {
      icon: '🌐',
      title: 'Site Profissional Incluído',
      description:
        'Receba seu site personalizado em 24h com suas cores, logo e informações. Presença digital completa sem custos extras.',
    },
    {
      icon: '📱',
      title: 'App Móvel Completo',
      description:
        'Gerencie clientes, processos e financeiro direto do seu celular. Sua advocacia na palma da mão, 24h por dia.',
    },
    {
      icon: '🤖',
      title: 'Secretária Jurídica 24h',
      description:
        'Atenda clientes automaticamente, capture leads qualificados e agende consultas mesmo dormindo. Nunca mais perca oportunidades.',
    },
  ];

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 relative overflow-hidden pt-16 sm:pt-24 lg:pt-32 pb-16 sm:pb-24 lg:pb-32"
      style={{
        backgroundImage: "url('/images/proximo-advogado-ai-robo.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
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

      {/* Imagem para Mobile - substitui a desktop */}
      <div 
        className="absolute inset-0 md:hidden z-0 brightness-90"
        style={{
          backgroundImage: "url('/images/advogado-robo.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'top center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Overlay escuro - aplicado para ambas as imagens */}
      <div className="absolute inset-0 bg-black/50 z-10" />

      {/* Efeitos visuais de partículas - aplicados para ambas as imagens */}
      <div className="absolute inset-0 overflow-hidden z-20">
        <div
          className="absolute top-10 sm:top-20 left-10 sm:left-20 w-16 sm:w-24 lg:w-32 h-16 sm:h-24 lg:h-32 border border-current rounded-full animate-pulse opacity-10"
          style={{ color: '#b0825a' }}
        ></div>
        <div
          className="absolute bottom-10 sm:bottom-20 right-10 sm:right-20 w-12 sm:w-16 lg:w-24 h-12 sm:h-16 lg:h-24 border border-current rounded-full animate-pulse opacity-10 animation-delay-1000"
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
          className="absolute w-48 sm:w-64 lg:w-96 h-48 sm:h-64 lg:h-96 rounded-full pointer-events-none transition-all duration-1000 opacity-5"
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
        <div className="mb-8 sm:mb-12">
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

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-white leading-tight">
            Sua Secretária Jurídica 24h + Site Profissional Personalizado
          </h2>
          
          <p className="text-base sm:text-lg md:text-xl mb-4 sm:mb-6 max-w-3xl mx-auto leading-relaxed font-light text-white px-2">
            Atenda clientes, capture leads e gerencie seu escritório{' '}
            <span className="font-semibold" style={{ color: '#b0825a' }}>
              enquanto você dorme
            </span>
          </p>
          
          <p
            className="text-sm sm:text-base opacity-70 max-w-2xl mx-auto leading-relaxed px-2"
            style={{ color: '#bfbfbf' }}
          >
            ✨ Mais de 200+ advogados já transformaram seus escritórios • App móvel incluído
          </p>
        </div>

        {/* Estatísticas REFORMULADAS */}
        <div className="mb-12 sm:mb-16">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-3xl mx-auto">
            {[
              { number: '24/7', label: 'Atendimento Ativo', sublabel: 'Nunca perca clientes' },
              { number: '+3x', label: 'Mais Leads', sublabel: 'Comprovado em testes' },
              { number: '24h', label: 'Site no Ar', sublabel: 'Presença digital completa' },
            ].map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="relative">
                  <div
                    className="text-3xl sm:text-4xl md:text-5xl font-black mb-2 transition-all duration-300 group-hover:scale-110"
                    style={{ color: '#b0825a' }}
                  >
                    {stat.number}
                  </div>
                  <div className="text-base sm:text-lg font-semibold mb-1 text-white">
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

        {/* URGÊNCIA E SOCIAL PROOF */}
        <div className="mb-12 sm:mb-16">
          <div 
            className="relative p-4 sm:p-6 rounded-2xl border border-opacity-30 backdrop-blur-lg mx-2 sm:mx-4 lg:mx-8"
            style={{
              backgroundColor: 'rgba(176, 130, 90, 0.15)',
              borderColor: '#b0825a',
            }}
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-red-400">VAGAS LIMITADAS</span>
            </div>
            <p className="text-base sm:text-lg font-semibold text-white mb-2">
              🔥 Últimas 47 vagas ante ao retorno dos valores oficiais
            </p>
            <p className="text-sm opacity-80" style={{ color: '#bfbfbf' }}>
              Preço promocional válido apenas para os primeiros usuários
            </p>
          </div>
        </div>

        {/* CTA PRINCIPAL - ÚNICO E FOCADO */}
        <div className="mb-16 sm:mb-20">
          <Link
            href="/plano-empresa"
            className="group/btn relative inline-flex items-center gap-3 font-bold py-5 sm:py-6 px-10 sm:px-12 rounded-xl sm:rounded-2xl transition-all duration-500 hover:shadow-2xl hover:scale-105 transform text-lg sm:text-xl border-2 mb-4"
            style={{ 
              backgroundColor: '#b0825a',
              borderColor: '#b0825a',
              color: '#ffffff'
            }}
          >
            <span className="relative z-10">
              🚀 Quero Minha Secretária Jurídica Agora
            </span>
            <svg 
              className="w-6 h-6 transition-transform duration-300 group-hover/btn:translate-x-1" 
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
              ✅ 7 dias grátis • ✅ Cancelamento a qualquer momento • ✅ Suporte 24h
            </p>
            <p className="text-xs opacity-60" style={{ color: '#bfbfbf' }}>
              Comece hoje, site personalizado pronto em 24h
            </p>
          </div>
        </div>

        {/* Por que escolher - REFORMULADO */}
        <div className="mb-16 sm:mb-20">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 text-white px-2">
            O que você recebe hoje:
          </h2>
          
          <p className="text-base mb-8 sm:mb-12 opacity-80 max-w-2xl mx-auto" style={{ color: '#bfbfbf' }}>
            Não é só um software. É sua nova{' '}
            <span style={{ color: '#b0825a' }}>equipe digital completa</span>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
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
                    className="text-base sm:text-lg font-bold mb-3 sm:mb-4 group-hover:text-current transition-colors duration-300 text-white"
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
        <div className="mb-16 sm:mb-20">
          <div 
            className="relative p-6 sm:p-8 rounded-2xl border border-opacity-30 backdrop-blur-lg mx-2 sm:mx-4 lg:mx-8"
            style={{
              backgroundColor: 'rgba(26, 26, 26, 0.6)',
              borderColor: '#b0825a',
            }}
          >
            <div className="text-center">
              <div className="text-2xl mb-4">⭐⭐⭐⭐⭐</div>
              <p className="text-base sm:text-lg italic mb-4 text-white">
                &quot;Em 30 dias captei mais leads do que nos últimos 6 meses. O site personalizado me deu uma credibilidade incrível.&quot;
              </p>
              <p className="text-sm font-semibold" style={{ color: '#b0825a' }}>
                Dr. Carlos Silva - Direito Civil • São Paulo/SP
              </p>
            </div>
          </div>
        </div>

        {/* Botões de acesso - REFORMULADO */}
        <div className="mb-16 sm:mb-20">
          <p className="text-sm mb-4 text-white opacity-80">Já é um profissional cadastrado?</p>
          
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
              Acesso Profissional
            </Link>
          </div>
        </div>

        {/* Rodapé */}
        <div className="pt-8 sm:pt-12 border-t border-opacity-20 px-2" style={{ borderColor: '#6e6d6b' }}>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs sm:text-sm opacity-60 text-center md:text-left" style={{ color: '#bfbfbf' }}>
              © 2025 IAJURIS - A revolução digital da advocacia brasileira
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
  );
}
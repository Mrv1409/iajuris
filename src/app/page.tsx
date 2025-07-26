'use client';

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

  const features = [
    {
      icon: '🤖',
      title: 'Assistente Virtual',
      description:
        'Atendimento automatizado 24/7 para seus clientes com respostas precisas e linguagem acessível',
    },
    {
      icon: '📊',
      title: 'Gestão Inteligente',
      description:
        'Organize processos, agende compromissos e gerencie leads automaticamente',
    },
    {
      icon: '⚡',
      title: 'Eficiência Máxima',
      description:
        'Reduza tempo em tarefas repetitivas e foque no que realmente importa para seu escritório',
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
        {/* Título */}
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

          <p className="text-lg sm:text-xl md:text-2xl font-light mb-2 sm:mb-3 text-white">
            Soluções de Inteligência Artificial para Escritórios de advocacia
          </p>
          <p
            className="text-xs sm:text-sm font-mono tracking-wider opacity-60 uppercase"
            style={{ color: '#bfbfbf' }}
          >
            Powered by Advanced AI Technology
          </p>
        </div>

        {/* Subtítulo */}
        <div className="mb-12 sm:mb-16">
          <p className="text-base sm:text-lg md:text-xl mb-4 sm:mb-6 max-w-3xl mx-auto leading-relaxed font-light text-white px-2">
            Transforme seu escritório com a{' '}
            <span className="font-semibold" style={{ color: '#b0825a' }}>
              primeira assistente virtual
            </span>{' '}
            especializada em Direito brasileiro.
          </p>
          <p
            className="text-sm sm:text-base opacity-70 max-w-2xl mx-auto leading-relaxed px-2"
            style={{ color: '#bfbfbf' }}
          >
            Automatize atendimentos, gerencie leads, organize processos e
            otimize seu tempo com tecnologia de ponta em inteligência
            artificial.
          </p>
        </div>

        {/* Estatísticas */}
        <div className="mb-12 sm:mb-16">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-3xl mx-auto">
            {[
              { number: '24/7', label: 'Disponibilidade', sublabel: 'Sempre ativo' },
              { number: '100%', label: 'Automação', sublabel: 'Sem intervenção' },
              { number: '∞', label: 'Possibilidades', sublabel: 'Sem limites' },
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

        {/* Botão CTA */}
        <div className="mb-16 sm:mb-20">
          <a
            href="/login"
            className="group relative inline-block font-bold py-3 sm:py-4 lg:py-5 px-6 sm:px-8 lg:px-10 rounded-xl sm:rounded-2xl transition-all duration-300 hover:shadow-2xl hover:scale-105 transform text-base sm:text-lg"
            style={{ backgroundColor: '#b0825a', color: '#ffffff' }}
          >
            <span className="relative z-10">Acessar Plataforma</span>
            <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            <div className="absolute -inset-1 rounded-xl sm:rounded-2xl bg-gradient-to-r from-current via-transparent to-current opacity-0 group-hover:opacity-30 blur transition-opacity duration-300"></div>
          </a>

          <p className="text-xs sm:text-sm mt-3 sm:mt-4 opacity-60 px-2" style={{ color: '#bfbfbf' }}>
            Comece sua transformação digital hoje mesmo
          </p>
        </div>

        {/* Por que escolher */}
        <div className="mb-16 sm:mb-20">
          <h2 className="text-xl sm:text-2xl font-bold mb-8 sm:mb-12 text-white px-2">
            Por que escolher o{' '}
            <span style={{ color: '#b0825a' }}>IAJURIS</span>?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {features.map((feature, index) => (
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
                    {feature.icon}
                  </div>

                  <h3
                    className="text-base sm:text-lg font-bold mb-3 sm:mb-4 group-hover:text-current transition-colors duration-300 text-white"
                  >
                    {feature.title}
                  </h3>

                  <p
                    className="text-xs sm:text-sm leading-relaxed opacity-80"
                    style={{ color: '#bfbfbf' }}
                  >
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rodapé */}
        <div className="pt-8 sm:pt-12 border-t border-opacity-20 px-2" style={{ borderColor: '#6e6d6b' }}>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs sm:text-sm opacity-60 text-center md:text-left" style={{ color: '#bfbfbf' }}>
              © 2025 IAJURIS - Transformando a advocacia com inteligência artificial
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

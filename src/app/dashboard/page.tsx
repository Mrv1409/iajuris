'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firestore';//eslint-disable-next-line
import { Scale, Users, TrendingUp, Shield, Gavel, LogOut, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

export default function DashboardPage() {
  const [leadCount, setLeadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeadCount = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'leads'));
        setLeadCount(snapshot.size);
        setIsLoading(false);
      } catch (error) {
        console.error('Erro ao buscar leads:', error);
        setIsLoading(false);
      }
    };
    fetchLeadCount();
  }, []);

  // Alterado para redirecionar para a página principal
  const handleLogout = () => {
    // Implementar logout logic aqui (se houver, como limpar sessão/token)
    console.log('Logout realizado, redirecionando para a página principal.');
    // Redireciona para a página principal
    window.location.href = '/'; // Usando window.location.href para redirecionamento completo
  };

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background Principal com Gradiente IAJURIS */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-amber-900"></div>
      
      {/* Elementos Decorativos */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-amber-800 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-72 h-72 bg-amber-700 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      {/* Container Principal */}
      <div className="relative z-10" style={{ backgroundColor: 'rgba(20, 20, 20, 0.8)' }}>
        {/* Header */}
        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header Row */}
            <div className="flex items-center justify-between mb-8">
              {/* 1. Botão "IAJuris" para o Chat (no lugar antigo da logo) */}
              <Link 
                href="/chat" 
                className="group flex items-center px-4 py-2 rounded-xl border transition-all duration-300 hover:scale-105 active:scale-95 font-semibold"
                style={{ 
                  background: 'linear-gradient(135deg, #b0825a 0%, #8b6942 50%, #6d532a 100%)', // Gradiente Dourado
                  borderColor: 'rgba(176, 130, 90, 0.2)', // Borda dourada sutil
                  boxShadow: '0 10px 25px rgba(176, 130, 90, 0.3)' // Sombra dourada
                }}
              >
                <span className="text-white font-medium text-sm sm:text-base">
                  IAJuris
                </span>
              </Link>

              {/* 1. Logo Centralizada */}
              {/* Flexbox para centralizar a logo */}
              <div className="flex-grow flex justify-center"> 
                <div className="flex items-center group cursor-default"> {/* Cursor default para não parecer clicável */}
                  <Scale className="w-8 h-8 sm:w-10 sm:h-10 mr-3" 
                         style={{ color: '#b0825a' }} />
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg">
                    IAJURIS
                  </h1>
                  <Gavel className="w-8 h-8 sm:w-10 sm:h-10 ml-3" 
                         style={{ color: '#b0825a' }} />
                </div>
              </div>

              {/* 2. Logout Button (com caminho para a tela de apresentação) */}
              <button
                onClick={handleLogout}
                className="group flex items-center px-4 py-2 rounded-xl border transition-all duration-300 hover:scale-105 active:scale-95 font-semibold"
                style={{ 
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)',
                  borderColor: '#6e6d6b',
                  boxShadow: '0 10px 25px rgba(239, 68, 68, 0.3)'
                }}
              >
                <LogOut className="w-5 h-5 text-white mr-2 transition-colors" />
                <span className="text-white font-medium text-sm sm:text-base">
                  Sair
                </span>
              </button>
            </div>

            {/* Título e Subtítulo (mantido como está, mas a logo acima está centralizada) */}
            <div className="text-center">
              {/* Separador Dourado */}
              <div className="h-0.5 w-24 mx-auto mb-4" 
                   style={{ background: 'linear-gradient(to right, transparent, #b0825a, transparent)' }}></div>
              <p className="text-lg sm:text-xl font-light opacity-80" style={{ color: '#d4d4d4' }}>
                Inteligência Artificial Jurídica
              </p>
              <div className="mt-2 text-sm opacity-75" style={{ color: '#d4d4d4' }}>
                POWERED BY ADVANCED AI TECHNOLOGY
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          {/* Boas-vindas */}
          <div className="mb-8 sm:mb-12">
            <div className="p-8 rounded-2xl backdrop-blur-sm border shadow-2xl relative overflow-hidden"
                 style={{ 
                   backgroundColor: 'rgba(20, 20, 20, 0.8)',
                   borderColor: 'rgba(176, 130, 90, 0.2)',
                   boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                 }}>
              
              <div className="relative z-10">
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-xl mr-4 animate-pulse"
                       style={{ backgroundColor: 'rgba(176, 130, 90, 0.2)' }}>
                    <Shield className="w-8 h-8" style={{ color: '#b0825a' }} />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">
                    Painel Profissional
                  </h2>
                </div>
                <p className="text-base sm:text-lg leading-relaxed" style={{ color: '#d4d4d4' }}>
                  Gerencie seus atendimentos jurídicos e organize agendamentos com a excelência que seus clientes merecem.
                </p>
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Card Leads */}
            <Link href="/dashboard/leads" className="group block">
              <div className="p-8 rounded-2xl backdrop-blur-sm border shadow-2xl transition-all duration-300 hover:scale-105 relative overflow-hidden"
                   style={{ 
                     backgroundColor: 'rgba(20, 20, 20, 0.8)',
                     borderColor: 'rgba(176, 130, 90, 0.2)',
                     boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                   }}>
                
                {/* Content */}
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="p-3 rounded-xl mr-4 transition-all duration-300 group-hover:scale-110"
                           style={{ backgroundColor: 'rgba(176, 130, 90, 0.2)' }}>
                        <Users className="w-6 h-6" style={{ color: '#b0825a' }} />
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold text-white transition-colors duration-300">
                        Leads Recebidos
                      </h3>
                    </div>
                    <TrendingUp className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" 
                               style={{ color: '#b0825a' }} />
                  </div>
                  
                  <p className="mb-6 text-sm sm:text-base transition-colors duration-300" 
                      style={{ color: '#d4d4d4' }}>
                    Novos clientes interessados em seus serviços jurídicos via chat inteligente.
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-3xl sm:text-4xl font-bold mr-2 transition-colors duration-300"
                            style={{ color: '#b0825a' }}>
                        {isLoading ? '...' : leadCount}
                      </span>
                      <span className="text-sm transition-colors duration-300" style={{ color: '#d4d4d4' }}>
                        {isLoading ? 'Carregando' : 'Total de leads'}
                      </span>
                    </div>
                    <div className="text-xs transition-colors duration-300" style={{ color: '#6e6d6b' }}>
                      Clique para ver detalhes →
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            {/* Card Prazos Processuais */}
            <Link href="/dashboard/prazos" className="group block">
              <div className="p-8 rounded-2xl backdrop-blur-sm border shadow-2xl transition-all duration-300 hover:scale-105 relative overflow-hidden"
                   style={{ 
                     backgroundColor: 'rgba(20, 20, 20, 0.8)',
                     borderColor: 'rgba(176, 130, 90, 0.2)',
                     boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                   }}>
                
                {/* Content */}
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="p-3 rounded-xl mr-4 transition-all duration-300 group-hover:scale-110"
                           style={{ backgroundColor: 'rgba(176, 130, 90, 0.2)' }}>
                        <Clock className="w-6 h-6" style={{ color: '#b0825a' }} />
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold text-white transition-colors duration-300">
                        Prazos Processuais
                      </h3>
                    </div>
                    <AlertTriangle className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" 
                                   style={{ color: '#b0825a' }} />
                  </div>
                  
                  <p className="mb-6 text-sm sm:text-base transition-colors duration-300" 
                      style={{ color: '#d4d4d4' }}>
                    Gerencie e monitore todos os prazos processuais dos seus casos em andamento.
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <span className="text-2xl sm:text-3xl font-bold mr-1 transition-colors duration-300"
                              style={{ color: '#b0825a' }}>
                          |
                        </span>
                        <span className="text-xs transition-colors duration-300" style={{ color: '#d4d4d4' }}>
                          Urgentes
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-2xl sm:text-3xl font-bold mr-1 transition-colors duration-300"
                              style={{ color: '#22c55e' }}>
                          |
                        </span>
                        <span className="text-xs transition-colors duration-300" style={{ color: '#d4d4d4' }}>
                          Em dia
                        </span>
                      </div>
                    </div>
                    <div className="text-xs transition-colors duration-300" style={{ color: '#6e6d6b' }}>
                      Clique para gerenciar →
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Status Indicators */}
          <div className="mt-8 sm:mt-12">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-xl backdrop-blur-sm border"
                   style={{ 
                     backgroundColor: 'rgba(20, 20, 20, 0.8)',
                     borderColor: 'rgba(176, 130, 90, 0.2)'
                   }}>
                <div className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: '#b0825a' }}>24/7</div>
                <div className="text-sm" style={{ color: '#d4d4d4' }}>Disponibilidade</div>
                <div className="text-xs" style={{ color: '#6e6d6b' }}>Sempre ativo</div>
              </div>
              <div className="p-4 rounded-xl backdrop-blur-sm border"
                   style={{ 
                     backgroundColor: 'rgba(20, 20, 20, 0.8)',
                     borderColor: 'rgba(176, 130, 90, 0.2)'
                   }}>
                <div className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: '#b0825a' }}>100%</div>
                <div className="text-sm" style={{ color: '#d4d4d4' }}>Automação</div>
                <div className="text-xs" style={{ color: '#6e6d6b' }}>Sem intervenção</div>
              </div>
              <div className="p-4 rounded-xl backdrop-blur-sm border"
                   style={{ 
                     backgroundColor: 'rgba(20, 20, 20, 0.8)',
                     borderColor: 'rgba(176, 130, 90, 0.2)'
                   }}>
                <div className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: '#b0825a' }}>∞</div>
                <div className="text-sm" style={{ color: '#d4d4d4' }}>Possibilidades</div>
                <div className="text-xs" style={{ color: '#6e6d6b' }}>Sem limites</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
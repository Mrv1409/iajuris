'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
// Importando os novos ícones para o card de Análise de Contrato Social
import { Scale, TrendingUp, Shield, Gavel, LogOut, Clock, AlertTriangle, CheckCircle, FileText, Calculator, DollarSign, UserCheck, FileSearch, Building, Users } from 'lucide-react'; 

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

  const handleLogout = () => {
    console.log('Logout realizado, redirecionando para a página principal.');
    window.location.href = '/'; 
  };

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background Principal com Gradiente IAJURIS */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-amber-900"></div>
      
      {/* Elementos Decorativos */}
      <div className="absolute top-10 left-10 sm:top-20 sm:left-20 w-48 h-48 sm:w-72 sm:h-72 bg-amber-800 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-10 right-10 sm:bottom-20 sm:right-20 w-48 h-48 sm:w-72 sm:h-72 bg-amber-700 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      {/* Container Principal */}
      <div className="relative z-10 p-3 sm:p-4 lg:p-8">
        {/* Header */}
        <div className="max-w-7xl mx-auto p-4 sm:p-6 rounded-2xl backdrop-blur-sm border shadow-2xl"
          style={{ 
            backgroundColor: 'rgba(20, 20, 20, 0.8)',
            borderColor: 'rgba(176, 130, 90, 0.2)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
          }}>
          {/* Header Row - Melhor responsividade */}
          <div className="flex items-center justify-between mb-6 sm:mb-8 flex-wrap gap-4 sm:gap-0">
            {/* 1. Botão "IAJuris" para o Chat */}
            <Link 
              href="/chat" 
              className="group flex items-center px-3 py-2 sm:px-4 sm:py-2 rounded-xl border transition-all duration-300 hover:scale-105 active:scale-95 font-semibold order-1"
              style={{ 
                background: 'linear-gradient(135deg, #b0825a 0%, #8b6942 50%, #6d532a 100%)',
                borderColor: 'rgba(176, 130, 90, 0.2)',
                boxShadow: '0 10px 25px rgba(176, 130, 90, 0.3)'
              }}
            >
              <span className="text-white font-medium text-sm sm:text-base">
                IAJuris
              </span>
            </Link>

            {/* 2. Logo Centralizada - Ajustada para mobile */}
            <div className="flex-grow flex justify-center order-3 sm:order-2 w-full sm:w-auto"> 
              <div className="flex items-center group cursor-default"> 
                <Scale className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 mr-2 sm:mr-3" 
                        style={{ color: '#b0825a' }} />
                <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white drop-shadow-lg">
                  IAJURIS
                </h1>
                <Gavel className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 ml-2 sm:ml-3" 
                        style={{ color: '#b0825a' }} />
              </div>
            </div>

            {/* 3. Logout Button */}
            <button
              onClick={handleLogout}
              className="group flex items-center px-3 py-2 sm:px-4 sm:py-2 rounded-xl border transition-all duration-300 hover:scale-105 active:scale-95 font-semibold order-2 sm:order-3"
              style={{ 
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)',
                borderColor: '#6e6d6b',
                boxShadow: '0 10px 25px rgba(239, 68, 68, 0.3)'
              }}
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5 text-white mr-2 transition-colors" />
              <span className="text-white font-medium text-sm sm:text-base">
                Sair
              </span>
            </button>
          </div>

          {/* Título e Subtítulo */}
          <div className="text-center">
            <div className="h-0.5 w-16 sm:w-24 mx-auto mb-3 sm:mb-4" 
                 style={{ background: 'linear-gradient(to right, transparent, #b0825a, transparent)' }}></div>
            <p className="text-base sm:text-lg lg:text-xl font-light opacity-80" style={{ color: '#d4d4d4' }}>
              Inteligência Artificial Jurídica
            </p>
            <div className="mt-2 text-xs sm:text-sm opacity-75" style={{ color: '#d4d4d4' }}>
              POWERED BY ADVANCED AI TECHNOLOGY
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
          {/* Boas-vindas */}
          <div className="mb-6 sm:mb-8 lg:mb-12">
            <div className="p-6 sm:p-8 rounded-2xl backdrop-blur-sm border shadow-2xl relative overflow-hidden"
                 style={{ 
                    backgroundColor: 'rgba(20, 20, 20, 0.8)',
                    borderColor: 'rgba(176, 130, 90, 0.2)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                 }}>
              
              <div className="relative z-10">
                <div className="flex items-center mb-4">
                  <div className="p-2 sm:p-3 rounded-xl mr-3 sm:mr-4 animate-pulse"
                       style={{ backgroundColor: 'rgba(176, 130, 90, 0.2)' }}>
                    <Shield className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: '#b0825a' }} />
                  </div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white drop-shadow-lg">
                    Painel Profissional
                  </h2>
                </div>
                <p className="text-sm sm:text-base lg:text-lg leading-relaxed" style={{ color: '#d4d4d4' }}>
                  Gerencie seus atendimentos jurídicos e organize agendamentos com a excelência que seus clientes merecem.
                </p>
              </div>
            </div>
          </div>

          {/* Cards Grid - Responsividade melhorada */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            
            {/* Card Leads */}
            <Link href="/dashboard/leads" className="group block">
              <div className="p-6 sm:p-8 rounded-2xl backdrop-blur-sm border shadow-2xl transition-all duration-300 hover:scale-105 relative overflow-hidden"
                   style={{ 
                    backgroundColor: 'rgba(20, 20, 20, 0.8)',
                    borderColor: 'rgba(176, 130, 90, 0.2)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                   }}>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="p-2 sm:p-3 rounded-xl mr-3 sm:mr-4 transition-all duration-300 group-hover:scale-110"
                           style={{ backgroundColor: 'rgba(176, 130, 90, 0.2)' }}>
                        <Users className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#b0825a' }} />
                      </div>
                      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white transition-colors duration-300">
                        Leads Recebidos
                      </h3>
                    </div>
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-300" 
                               style={{ color: '#b0825a' }} />
                  </div>
                  
                  <p className="mb-4 sm:mb-6 text-xs sm:text-sm lg:text-base transition-colors duration-300" 
                      style={{ color: '#d4d4d4' }}>
                    Novos clientes interessados em seus serviços jurídicos via chat inteligente.
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-2xl sm:text-3xl lg:text-4xl font-bold mr-2 transition-colors duration-300"
                            style={{ color: '#b0825a' }}>
                        {isLoading ? '...' : leadCount}
                      </span>
                      <span className="text-xs sm:text-sm transition-colors duration-300" style={{ color: '#d4d4d4' }}>
                        {isLoading ? 'Carregando' : 'Total de leads'}
                      </span>
                    </div>
                    <div className="text-xs transition-colors duration-300" style={{ color: '#6e6d6b' }}>
                      Clique para ver →
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            {/* Card Clientes */}
            <Link href="/dashboard/clientes" className="group block">
              <div className="p-6 sm:p-8 rounded-2xl backdrop-blur-sm border shadow-2xl transition-all duration-300 hover:scale-105 relative overflow-hidden"
                   style={{ 
                    backgroundColor: 'rgba(20, 20, 20, 0.8)',
                    borderColor: 'rgba(34, 197, 94, 0.2)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                   }}>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="p-2 sm:p-3 rounded-xl mr-3 sm:mr-4 transition-all duration-300 group-hover:scale-110"
                           style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}>
                        <UserCheck className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#22c55e' }} />
                      </div>
                      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white transition-colors duration-300">
                        <span className="sm:hidden">Clientes</span>
                        <span className="hidden sm:inline">Controle de Clientes</span>
                      </h3>
                    </div>
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-300" 
                                 style={{ color: '#22c55e' }} />
                  </div>
                  
                  <p className="mb-4 sm:mb-6 text-xs sm:text-sm lg:text-base transition-colors duration-300" 
                      style={{ color: '#d4d4d4' }}>
                    Gerencie informações e histórico de todos os seus clientes cadastrados.
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-2xl sm:text-3xl lg:text-4xl font-bold mr-2 transition-colors duration-300"
                            style={{ color: '#22c55e' }}>
                        {isLoading ? '...' : 'XX'}
                      </span>
                      <span className="text-xs sm:text-sm transition-colors duration-300" style={{ color: '#d4d4d4' }}>
                        Total de clientes
                      </span>
                    </div>
                    <div className="text-xs transition-colors duration-300" style={{ color: '#6e6d6b' }}>
                      Gerenciar →
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            {/* Card Prazos Processuais */}
            <Link href="/dashboard/prazos" className="group block">
              <div className="p-6 sm:p-8 rounded-2xl backdrop-blur-sm border shadow-2xl transition-all duration-300 hover:scale-105 relative overflow-hidden"
                   style={{ 
                    backgroundColor: 'rgba(20, 20, 20, 0.8)',
                    borderColor: 'rgba(176, 130, 90, 0.2)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                   }}>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="p-2 sm:p-3 rounded-xl mr-3 sm:mr-4 transition-all duration-300 group-hover:scale-110"
                           style={{ backgroundColor: 'rgba(176, 130, 90, 0.2)' }}>
                        <Clock className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#b0825a' }} />
                      </div>
                      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white transition-colors duration-300">
                        <span className="sm:hidden">Prazos</span>
                        <span className="hidden sm:inline">Prazos Processuais</span>
                      </h3>
                    </div>
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-300" 
                                   style={{ color: '#b0825a' }} />
                  </div>
                  
                  <p className="mb-4 sm:mb-6 text-xs sm:text-sm lg:text-base transition-colors duration-300" 
                      style={{ color: '#d4d4d4' }}>
                    Gerencie e monitore todos os prazos processuais dos seus casos em andamento.
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 sm:space-x-4">
                      <div className="flex items-center">
                        <span className="text-xl sm:text-2xl lg:text-3xl font-bold mr-1 transition-colors duration-300"
                              style={{ color: '#b0825a' }}>
                          | 
                        </span>
                        <span className="text-xs transition-colors duration-300" style={{ color: '#d4d4d4' }}>
                          Urgentes
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-xl sm:text-2xl lg:text-3xl font-bold mr-1 transition-colors duration-300"
                              style={{ color: '#22c55e' }}>
                          | 
                        </span>
                        <span className="text-xs transition-colors duration-300" style={{ color: '#d4d4d4' }}>
                          Em dia
                        </span>
                      </div>
                    </div>
                    <div className="text-xs transition-colors duration-300" style={{ color: '#6e6d6b' }}>
                      Gerenciar →
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            {/* Card Petições */}
            <Link href="/dashboard/peticoes" className="group block">
              <div className="p-6 sm:p-8 rounded-2xl backdrop-blur-sm border shadow-2xl transition-all duration-300 hover:scale-105 relative overflow-hidden"
                   style={{ 
                    backgroundColor: 'rgba(20, 20, 20, 0.8)',
                    borderColor: 'rgba(176, 130, 90, 0.2)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                   }}>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="p-2 sm:p-3 rounded-xl mr-3 sm:mr-4 transition-all duration-300 group-hover:scale-110"
                           style={{ backgroundColor: 'rgba(176, 130, 90, 0.2)' }}>
                        <FileText className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#b0825a' }} />
                      </div>
                      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white transition-colors duration-300">
                        Criação Documentos Jurídicos
                      </h3>
                    </div>
                    <Gavel className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-300" 
                           style={{ color: '#b0825a' }} />
                  </div>
                  
                  <p className="mb-4 sm:mb-6 text-xs sm:text-sm lg:text-base transition-colors duration-300" 
                      style={{ color: '#d4d4d4' }}>
                    Gere petições jurídicas profissionais com IA avançada especializada em documentos legais.
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 sm:space-x-4">
                      <div className="flex items-center">
                        <span className="text-xl sm:text-2xl lg:text-3xl font-bold mr-1 transition-colors duration-300"
                              style={{ color: '#b0825a' }}>
                          IA
                        </span>
                        <span className="text-xs transition-colors duration-300" style={{ color: '#d4d4d4' }}>
                          <span className="hidden sm:inline">Geração de </span>Documentos
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-xl sm:text-2xl lg:text-3xl font-bold mr-1 transition-colors duration-300"
                              style={{ color: '#22c55e' }}>
                          ✓
                        </span>
                        <span className="text-xs transition-colors duration-300" style={{ color: '#d4d4d4' }}>
                          Profissional
                        </span>
                      </div>
                    </div>
                    <div className="text-xs transition-colors duration-300" style={{ color: '#6e6d6b' }}>
                      Criar →
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            {/* Card Análise de Contrato Social */}
            <Link href="/dashboard/pdfAnalysis" className="group block">
              <div className="p-6 sm:p-8 rounded-2xl backdrop-blur-sm border shadow-2xl transition-all duration-300 hover:scale-105 relative overflow-hidden"
                   style={{ 
                    backgroundColor: 'rgba(20, 20, 20, 0.8)',
                    borderColor: 'rgba(176, 130, 90, 0.2)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                   }}>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="p-2 sm:p-3 rounded-xl mr-3 sm:mr-4 transition-all duration-300 group-hover:scale-110"
                           style={{ backgroundColor: 'rgba(176, 130, 90, 0.2)' }}>
                        <FileSearch className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#b0825a' }} />
                      </div>
                      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white transition-colors duration-300">
                        <span className="sm:hidden">Análise PDF</span>
                        <span className="hidden sm:inline">Análise de Documentos Jurídicos</span>
                      </h3>
                    </div>
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-300" 
                                 style={{ color: '#22c55e' }} />
                  </div>
                  
                  <p className="mb-4 sm:mb-6 text-xs sm:text-sm lg:text-base transition-colors duration-300" 
                      style={{ color: '#d4d4d4' }}>
                    Analise documentos jurídicos e obtenha insights em segundos com o poder da IA.
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 sm:space-x-4">
                      <div className="flex items-center">
                        <span className="text-xl sm:text-2xl lg:text-3xl font-bold mr-1 transition-colors duration-300"
                              style={{ color: '#b0825a' }}>
                          IA
                        </span>
                        <span className="text-xs transition-colors duration-300" style={{ color: '#d4d4d4' }}>
                          <span className="hidden sm:inline">Análise </span>Completa
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-xl sm:text-2xl lg:text-3xl font-bold mr-1 transition-colors duration-300"
                              style={{ color: '#22c55e' }}>
                          ✓
                        </span>
                        <span className="text-xs transition-colors duration-300" style={{ color: '#d4d4d4' }}>
                          Precisão
                        </span>
                      </div>
                    </div>
                    <div className="text-xs transition-colors duration-300" style={{ color: '#6e6d6b' }}>
                      Analisar →
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            {/* Card Calculadora Jurídica */}
            <Link href="/dashboard/calculadora" className="group block">
              <div className="p-6 sm:p-8 rounded-2xl backdrop-blur-sm border shadow-2xl transition-all duration-300 hover:scale-105 relative overflow-hidden"
                   style={{ 
                    backgroundColor: 'rgba(20, 20, 20, 0.8)',
                    borderColor: 'rgba(176, 130, 90, 0.2)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                   }}>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="p-2 sm:p-3 rounded-xl mr-3 sm:mr-4 transition-all duration-300 group-hover:scale-110"
                           style={{ backgroundColor: 'rgba(176, 130, 90, 0.2)' }}>
                        <Calculator className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#b0825a' }} />
                      </div>
                      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white transition-colors duration-300">
                        <span className="sm:hidden">Calculadora</span>
                        <span className="hidden sm:inline">Calculadora Jurídica</span>
                      </h3>
                    </div>
                    <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-300" 
                                style={{ color: '#22c55e' }} />
                  </div>
                  
                  <p className="mb-4 sm:mb-6 text-xs sm:text-sm lg:text-base transition-colors duration-300" 
                      style={{ color: '#d4d4d4' }}>
                    Realize cálculos processuais e financeiros com precisão e agilidade.
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 sm:space-x-4">
                      <div className="flex items-center">
                        <span className="text-xl sm:text-2xl lg:text-3xl font-bold mr-1 transition-colors duration-300"
                              style={{ color: '#b0825a' }}>
                          R$
                        </span>
                        <span className="text-xs transition-colors duration-300" style={{ color: '#d4d4d4' }}>
                          <span className="hidden sm:inline">Cálculos </span>Rápidos
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-xl sm:text-2xl lg:text-3xl font-bold mr-1 transition-colors duration-300"
                              style={{ color: '#22c55e' }}>
                          %
                        </span>
                        <span className="text-xs transition-colors duration-300" style={{ color: '#d4d4d4' }}>
                          Precisão
                        </span>
                      </div>
                    </div>
                    <div className="text-xs transition-colors duration-300" style={{ color: '#6e6d6b' }}>
                      Calcular →
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            {/* Card Gestão Financeira */}
            <Link href="/dashboard/financeiro" className="group block">
              <div className="p-6 sm:p-8 rounded-2xl backdrop-blur-sm border shadow-2xl transition-all duration-300 hover:scale-105 relative overflow-hidden"
                   style={{ 
                    backgroundColor: 'rgba(20, 20, 20, 0.8)',
                    borderColor: 'rgba(176, 130, 90, 0.2)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                   }}>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="p-2 sm:p-3 rounded-xl mr-3 sm:mr-4 transition-all duration-300 group-hover:scale-110"
                           style={{ backgroundColor: 'rgba(176, 130, 90, 0.2)' }}>
                        <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#b0825a' }} />
                      </div>
                      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white transition-colors duration-300">
                        <span className="sm:hidden">Financeiro</span>
                        <span className="hidden sm:inline">Gestão Financeira</span>
                      </h3>
                    </div>
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-300" 
                               style={{ color: '#22c55e' }} />
                  </div>
                  
                  <p className="mb-4 sm:mb-6 text-xs sm:text-sm lg:text-base transition-colors duration-300" 
                      style={{ color: '#d4d4d4' }}>
                    Controle completo de honorários, despesas e fluxo de caixa do seu escritório.
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 sm:space-x-4">
                      <div className="flex items-center">
                        <span className="text-xl sm:text-2xl lg:text-3xl font-bold mr-1 transition-colors duration-300"
                              style={{ color: '#b0825a' }}>
                          R$
                        </span>
                        <span className="text-xs transition-colors duration-300" style={{ color: '#d4d4d4' }}>
                          <span className="hidden sm:inline">Fluxo de </span>Caixa
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-xl sm:text-2xl lg:text-3xl font-bold mr-1 transition-colors duration-300"
                              style={{ color: '#22c55e' }}>
                          📊
                        </span>
                        <span className="text-xs transition-colors duration-300" style={{ color: '#d4d4d4' }}>
                          Indicadores
                        </span>
                      </div>
                    </div>
                    <div className="text-xs transition-colors duration-300" style={{ color: '#6e6d6b' }}>
                      Gerenciar →
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            {/* Card Dashboard SaaS Advogados - Melhorado para responsividade */}
            <Link href="/dashboard/advogado" className="group block">
              <div className="p-6 sm:p-8 rounded-2xl backdrop-blur-sm border shadow-2xl transition-all duration-300 hover:scale-105 relative overflow-hidden"
                   style={{ 
                    backgroundColor: 'rgba(20, 20, 20, 0.8)',
                    borderColor: 'rgba(176, 130, 90, 0.2)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                   }}>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="p-2 sm:p-3 rounded-xl mr-3 sm:mr-4 transition-all duration-300 group-hover:scale-110"
                           style={{ backgroundColor: 'rgba(176, 130, 90, 0.2)' }}>
                        <Building className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#b0825a' }} />
                      </div>
                      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white transition-colors duration-300">
                        <span className="sm:hidden">SaaS Advogados</span>
                        <span className="hidden sm:inline">Dashboard SaaS Advogados</span>
                      </h3>
                    </div>
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-300" 
                           style={{ color: '#b0825a' }} />
                  </div>
                  
                  <p className="mb-4 sm:mb-6 text-xs sm:text-sm lg:text-base transition-colors duration-300" 
                      style={{ color: '#d4d4d4' }}>
                    Cadastro de novos profissionais.
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 sm:space-x-4">
                      <div className="flex items-center">
                        <span className="text-xl sm:text-2xl lg:text-3xl font-bold mr-1 transition-colors duration-300"
                              style={{ color: '#b0825a' }}>
                          🔔
                        </span>
                        <span className="text-xs transition-colors duration-300" style={{ color: '#d4d4d4' }}>
                          <span className="hidden sm:inline">Notifi</span>cações
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-xl sm:text-2xl lg:text-3xl font-bold mr-1 transition-colors duration-300"
                              style={{ color: '#22c55e' }}>
                          ✓
                        </span>
                        <span className="text-xs transition-colors duration-300" style={{ color: '#d4d4d4' }}>
                          Online 24h
                        </span>
                      </div>
                    </div>
                    <div className="text-xs transition-colors duration-300" style={{ color: '#6e6d6b' }}>
                      Gerenciar →
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Status Indicators - Responsividade melhorada */}
          <div className="mt-6 sm:mt-8 lg:mt-12">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-center">
              <div className="p-3 sm:p-4 rounded-xl backdrop-blur-sm border"
                   style={{ 
                    backgroundColor: 'rgba(20, 20, 20, 0.8)',
                    borderColor: 'rgba(176, 130, 90, 0.2)'
                   }}>
                <div className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: '#b0825a' }}>24/7</div>
                <div className="text-sm" style={{ color: '#d4d4d4' }}>Disponibilidade</div>
                <div className="text-xs" style={{ color: '#6e6d6b' }}>Sempre ativo</div>
              </div>
              <div className="p-3 sm:p-4 rounded-xl backdrop-blur-sm border"
                   style={{ 
                    backgroundColor: 'rgba(20, 20, 20, 0.8)',
                    borderColor: 'rgba(176, 130, 90, 0.2)'
                   }}>
                <div className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: '#b0825a' }}>100%</div>
                <div className="text-sm" style={{ color: '#d4d4d4' }}>Automação</div>
                <div className="text-xs" style={{ color: '#6e6d6b' }}>Sem intervenção</div>
              </div>
              <div className="p-3 sm:p-4 rounded-xl backdrop-blur-sm border"
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
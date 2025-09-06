'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { 
  Scale, 
  ArrowLeft, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  FileText, 
  Receipt,
  Clock,
  RefreshCw,
  Gavel
} from 'lucide-react';
import { FinanceiroHonorarios, FinanceiroDespesas } from '@/types/financeiro';

// ✅ ISOLAMENTO HÍBRIDO MVP/SaaS - Fórmula de Sucesso
const OWNER_EMAIL = 'marvincosta321@gmail.com';

interface DashboardData {
  totalHonorariosPagos: number;
  totalDespesasPagas: number;
  saldoLiquido: number;
  quantidadeHonorarios: number;
  quantidadeDespesas: number;
  ultimaAtualizacao: string;
}

export default function FinanceiroPage() {
  const { data: session } = useSession();
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalHonorariosPagos: 0,
    totalDespesasPagas: 0,
    saldoLiquido: 0,
    quantidadeHonorarios: 0,
    quantidadeDespesas: 0,
    ultimaAtualizacao: ''
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.email) {
      setIsLoading(false);
      return;
    }

    const fetchDashboardData = async () => {
      try {
        // ✅ ISOLAMENTO HÍBRIDO - PADRONIZADO
        const isOwnerMVP = session?.user?.email === OWNER_EMAIL;
        const advogadoId = isOwnerMVP ? OWNER_EMAIL : session?.user?.id;

        // 🔍 BUSCAR HONORÁRIOS PAGOS - CORRIGIDO: clienteId (com 'e')
        const honorariosQuery = query(
          collection(db, 'financeiro_honorarios'),
          where('clienteId', '==', advogadoId),
          where('status', '==', 'pago')
        );
        const honorariosSnapshot = await getDocs(honorariosQuery);
        const honorariosPagos = honorariosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as FinanceiroHonorarios[];

        // 🔍 BUSCAR TODAS AS DESPESAS - CORRIGIDO: clienteId (com 'e')
        const despesasQuery = query(
          collection(db, 'financeiro_despesas'),
          where('clienteId', '==', advogadoId)
        );
        const despesasSnapshot = await getDocs(despesasQuery);
        const todasDespesas = despesasSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as FinanceiroDespesas[];
        
        // Filtrar apenas as pagas
        const despesasPagas = todasDespesas.filter(d => d.status === 'pago');
        
        // 🐛 DEBUG - Log para verificar
        console.log('AdvogadoId usado na busca:', advogadoId);
        console.log('Total honorários encontrados:', honorariosPagos.length);
        console.log('Total despesas encontradas:', todasDespesas.length);
        console.log('Despesas pagas:', despesasPagas.length);
        console.log('Honorários pagos:', honorariosPagos.map(h => ({ id: h.id, valor: h.valor, status: h.status })));
        console.log('Status das despesas:', todasDespesas.map(d => ({ id: d.id, status: d.status, valor: d.valor })));

        // 📊 CALCULAR TOTAIS
        const totalHonorarios = honorariosPagos.reduce((acc, h) => acc + (h.valor || 0), 0);
        const totalDespesas = despesasPagas.reduce((acc, d) => acc + (d.valor || 0), 0);
        const saldoLiquido = totalHonorarios - totalDespesas;

        // ⏰ TIMESTAMP DA ÚLTIMA ATUALIZAÇÃO
        const agora = new Date();
        const ultimaAtualizacao = agora.toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        setDashboardData({
          totalHonorariosPagos: totalHonorarios,
          totalDespesasPagas: totalDespesas,
          saldoLiquido: saldoLiquido,
          quantidadeHonorarios: honorariosPagos.length,
          quantidadeDespesas: despesasPagas.length,
          ultimaAtualizacao
        });

        setIsLoading(false);
      } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [session]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // 🔒 Proteção de acesso - só renderiza se estiver autenticado
  if (!session?.user?.email) {
    return (
      <div className="min-h-screen bg-[#000000] text-white flex items-center justify-center">
        <div className="text-center">
          <Scale className="w-12 h-12 mx-auto mb-4 text-[#b0825a]" style={{ opacity: 0.7 }} />
          <h2 className="text-xl font-bold mb-2">Acesso Restrito</h2>
          <p className="text-[#d4d4d4]">Faça login para acessar a Gestão Financeira</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#000000] via-[#1a1a1a] to-[#2a2a2a]">
      {/* Elementos decorativos - Background Orbs */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-[#b0825a] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
      <div className="absolute bottom-20 right-20 w-72 h-72 bg-[#b0825a] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000" />

      {/* Container Principal */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-4">
        {/* Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 border-b border-[#6e6d6b] border-opacity-20 backdrop-blur-sm"
           style={{ backgroundColor: 'rgba(20, 20, 20, 0.8)' }}>
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative">
            {/* Botão Voltar */}
            <Link 
              href="/dashboard/leads/advogado"
              className="flex items-center px-4 py-2 bg-[#2a2a2a] border border-[#6e6d6b] rounded-lg transition-all duration-300 transform hover:scale-105 hover:opacity-90 group"
            >
              <ArrowLeft className="w-4 h-4 mr-2 text-[#d4d4d4] group-hover:text-white transition-colors" style={{ opacity: 0.7 }} />
              <span className="text-[#d4d4d4] group-hover:text-white text-sm font-medium">Dashboard</span>
            </Link>

            {/* Logo Centralizada - CORRIGIDO: Posicionamento absoluto */}
            <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center">
              <Scale className="w-6 h-6 text-[#b0825a] mr-2" style={{ opacity: 0.7 }} />
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#b0825a] text-shadow-lg">
                IAJURIS
              </h1>
              <Gavel className="w-6 h-6 text-[#b0825a] ml-2" style={{ opacity: 0.7 }} />
            </div>

            {/* Data em Tempo Real */}
            <div className="flex items-center space-x-2 text-sm text-[#d4d4d4]">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">
                Atualizado: {dashboardData.ultimaAtualizacao || '...'}
              </span>
              <span className="sm:hidden">
                {dashboardData.ultimaAtualizacao ? dashboardData.ultimaAtualizacao.split(' ')[0] : '...'}
              </span>
            </div>
          </div>
        </div>

        {/* Título da Página */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-b border-[#6e6d6b] border-opacity-20"
           style={{ backgroundColor: 'rgba(20, 20, 20, 0.8)' }}>
          <div className="flex items-center justify-center">
            <DollarSign className="w-6 sm:w-8 h-6 sm:h-8 text-[#b0825a] mr-3" style={{ opacity: 0.7 }} />
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">Gestão Financeira</h2>
          </div>
          <div className="mx-auto mt-4 h-0.5 w-24 bg-gradient-to-r from-transparent via-[#b0825a] to-transparent" />
          <p className="text-center mt-2 text-[#d4d4d4] text-sm">
            Controle completo das finanças do seu escritório
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 📊 Cards de KPIs Principais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            
            {/* 💰 Total Honorários Pagos */}
            <div className="rounded-2xl p-6 shadow-2xl transition-all duration-300 transform hover:scale-[1.02]"
                 style={{ 
                   backgroundColor: 'rgba(20, 20, 20, 0.8)',
                   border: '1px solid rgba(34, 197, 94, 0.1)',
                   backdropFilter: 'blur(8px)',
                   boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                 }}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}>
                  <TrendingUp className="w-6 h-6" style={{ color: '#d4d4d4' }} />
                </div>
                {!isLoading && (
                  <div className="flex items-center space-x-1 text-xs" style={{ color: '#d4d4d4' }}>
                    <TrendingUp className="w-3 h-3" />
                    <span>RECEITA</span>
                  </div>
                )}
              </div>
              <h3 className="text-sm font-medium mb-2 text-[#d4d4d4]">Honorários Recebidos</h3>
              <p className="text-2xl font-bold mb-2" style={{ color: '#cccccc' }}>
                {isLoading ? (
                  <span className="flex items-center space-x-2">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>...</span>
                  </span>
                ) : (
                  formatCurrency(dashboardData.totalHonorariosPagos)
                )}
              </p>
              <p className="text-xs text-[#6e6d6b]">
                {isLoading ? '...' : `${dashboardData.quantidadeHonorarios} pagamentos recebidos`}
              </p>
            </div>

            {/* 📉 Total Despesas Pagas */}
            <div className="rounded-2xl p-6 shadow-2xl transition-all duration-300 transform hover:scale-[1.02]"
                 style={{ 
                   backgroundColor: 'rgba(20, 20, 20, 0.8)',
                   border: '1px solid rgba(239, 68, 68, 0.1)',
                   backdropFilter: 'blur(8px)',
                   boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                 }}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}>
                  <TrendingDown className="w-6 h-6" style={{ color: '#d4d4d4' }} />
                </div>
                {!isLoading && (
                  <div className="flex items-center space-x-1 text-xs" style={{ color: '#d4d4d4' }}>
                    <TrendingDown className="w-3 h-3" />
                    <span>SAÍDA</span>
                  </div>
                )}
              </div>
              <h3 className="text-sm font-medium mb-2 text-[#d4d4d4]">Despesas Pagas</h3>
              <p className="text-2xl font-bold mb-2" style={{ color: '#cccccc' }}>
                {isLoading ? (
                  <span className="flex items-center space-x-2">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>...</span>
                  </span>
                ) : (
                  formatCurrency(dashboardData.totalDespesasPagas)
                )}
              </p>
              <p className="text-xs text-[#6e6d6b]">
                {isLoading ? '...' : `${dashboardData.quantidadeDespesas} despesas quitadas`}
              </p>
            </div>

            {/* 💵 Saldo Líquido */}
            <div className="rounded-2xl p-6 shadow-2xl transition-all duration-300 transform hover:scale-[1.02]"
                 style={{ 
                   backgroundColor: 'rgba(20, 20, 20, 0.8)',
                   border: '1px solid rgba(176, 130, 90, 0.1)',
                   backdropFilter: 'blur(8px)',
                   boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                 }}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(176, 130, 90, 0.2)' }}>
                  <DollarSign className="w-6 h-6" style={{ color: '#d4d4d4' }} />
                </div>
                {!isLoading && (
                  <div className="flex items-center space-x-1 text-xs" style={{ color: '#d4d4d4' }}>
                    <DollarSign className="w-3 h-3" />
                    <span>LÍQUIDO</span>
                  </div>
                )}
              </div>
              <h3 className="text-sm font-medium mb-2 text-[#d4d4d4]">Saldo Líquido</h3>
              <p className={`text-2xl font-bold mb-2 ${
                isLoading ? 'text-[#b0825a]' : dashboardData.saldoLiquido >= 0 ? 'text-[#cccccc]' : 'text-red-400'
              }`}>
                {isLoading ? (
                  <span className="flex items-center space-x-2">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>...</span>
                  </span>
                ) : (
                  formatCurrency(dashboardData.saldoLiquido)
                )}
              </p>
              <p className="text-xs text-[#6e6d6b]">
                Receita menos despesas
              </p>
            </div>
          </div>

          {/* 🧭 Cards de Navegação para Subpáginas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Honorários */}
            <Link href="/dashboard/financeiro/honorarios" className="group block">
              <div className="rounded-2xl p-6 shadow-2xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-3xl"
                   style={{ 
                     backgroundColor: 'rgba(20, 20, 20, 0.8)',
                     border: '1px solid rgba(176, 130, 90, 0.2)',
                     backdropFilter: 'blur(8px)',
                     boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                   }}>
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-xl mr-3" style={{ backgroundColor: 'rgba(176, 130, 90, 0.2)' }}>
                    <CreditCard className="w-6 h-6" style={{ color: '#d4d4d4' }} />
                  </div>
                  <h3 className="text-lg font-bold text-white">Honorários</h3>
                </div>
                <p className="text-sm mb-4 text-[#d4d4d4]">
                  Gerencie contratos e valores de honorários por cliente
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#6e6d6b]">
                    Clique para gerenciar →
                  </span>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></div>
                </div>
              </div>
            </Link>

            {/* Despesas */}
            <Link href="/dashboard/financeiro/despesas" className="group block">
              <div className="rounded-2xl p-6 shadow-2xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-3xl"
                   style={{ 
                     backgroundColor: 'rgba(20, 20, 20, 0.8)',
                     border: '1px solid rgba(176, 130, 90, 0.2)',
                     backdropFilter: 'blur(8px)',
                     boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                   }}>
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-xl mr-3" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}>
                    <FileText className="w-6 h-6" style={{ color: '#d4d4d4' }} />
                  </div>
                  <h3 className="text-lg font-bold text-white">Despesas</h3>
                </div>
                <p className="text-sm mb-4 text-[#d4d4d4]">
                  Controle todas as despesas operacionais do escritório
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#6e6d6b]">
                    Clique para gerenciar →
                  </span>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></div>
                </div>
              </div>
            </Link>

            {/* Recibos */}
            <Link href="/dashboard/financeiro/recibos" className="group block sm:col-span-2 lg:col-span-1">
              <div className="rounded-2xl p-6 shadow-2xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-3xl"
                   style={{ 
                     backgroundColor: 'rgba(20, 20, 20, 0.8)',
                     border: '1px solid rgba(176, 130, 90, 0.2)',
                     backdropFilter: 'blur(8px)',
                     boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                   }}>
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-xl mr-3" style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}>
                    <Receipt className="w-6 h-6" style={{ color: '#d4d4d4' }} />
                  </div>
                  <h3 className="text-lg font-bold text-white">Recibos</h3>
                </div>
                <p className="text-sm mb-4 text-[#d4d4d4]">
                  Emita e gerencie recibos profissionais automaticamente
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#6e6d6b]">
                    Clique para emitir →
                  </span>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></div>
                </div>
              </div>
            </Link>
          </div>

          {/* 🏢 Seção Footer IAJURIS */}
          <div className="mt-12">
            <div className="rounded-2xl p-8 shadow-2xl text-center"
                 style={{ 
                   backgroundColor: 'rgba(20, 20, 20, 0.6)',
                   border: '1px solid rgba(176, 130, 90, 0.15)',
                   backdropFilter: 'blur(8px)',
                   boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                 }}>
              
              {/* Logo/Nome IAJURIS */}
              <div className="flex items-center justify-center mb-6">
                <Scale className="w-8 h-8 mr-3 text-[#b0825a]" style={{ opacity: 0.7 }} />
                <h2 className="text-3xl font-bold tracking-wider" 
                    style={{ 
                      background: 'linear-gradient(135deg, #b0825a, #d4af37)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>
                  IAJURIS
                </h2>
                <Scale className="w-8 h-8 ml-3 text-[#b0825a]" style={{ opacity: 0.7 }} />
              </div>

              {/* Resumo Rápido */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-lg font-bold text-white mb-1">
                    {isLoading ? '...' : dashboardData.quantidadeHonorarios + dashboardData.quantidadeDespesas}
                  </div>
                  <div className="text-xs text-[#6e6d6b]">
                    Transações Processadas
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold" style={{ color: '#22c55e' }}>
                    {isLoading ? '...' : dashboardData.totalHonorariosPagos > dashboardData.totalDespesasPagas ? '↗️' : '↘️'}
                  </div>
                  <div className="text-xs text-[#6e6d6b]">
                    Tendência Financeira
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold" style={{ color: '#d4d4d4' }}>
                    {new Date().getFullYear()}
                  </div>
                  <div className="text-xs text-[#6e6d6b]">
                    Exercício Fiscal
                  </div>
                </div>
              </div>

              {/* Tagline */}
              <div className="border-t pt-6 border-[#6e6d6b] border-opacity-20">
                <p className="text-sm font-light italic text-[#d4d4d4]">
                  &quot;Inteligência Artificial Jurídica - Transformando a advocacia moderna&quot;
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS para animações customizadas */}
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

        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animate-pulse {
          animation: pulse 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';//eslint-disable-next-line
import { collection, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore'; // Importado Timestamp
import { db } from '@/firebase/firestore';
import { 
  Scale, 
  ArrowLeft, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  AlertTriangle, 
  FileText, 
  Calendar,
  Receipt
} from 'lucide-react';//eslint-disable-next-line
import { FinanceiroRecibos, FinanceiroDashboard, FinanceiroHonorarios, FinanceiroDespesas } from '@/types/financeiro'; // Importa as interfaces necessárias

// Define a interface para o estado do componente, baseada na resposta da API
interface DashboardFinancialState {
  // Resumo Financeiro
  totalReceitasPendentes: number;
  totalReceitasPagas: number;
  totalReceitasAtrasadas: number;
  totalDespesasPendentes: number;
  totalDespesasPagas: number;
  receitaLiquida: number;
  clientesInadimplentes: number;
  
  // Indicadores
  totalHonorarios: number; // Total de honorários (todos)
  totalDespesas: number;   // Total de despesas (todas)
  totalRecibos: number;
  taxaRecebimento: string;

  // Últimos Recibos (virão de uma busca separada ou de um campo específico na API de dashboard se for expandida)
  ultimosRecibos: FinanceiroRecibos[];
}

export default function FinanceiroPage() {
  const [financialData, setFinancialData] = useState<DashboardFinancialState>({
    totalReceitasPendentes: 0,
    totalReceitasPagas: 0,
    totalReceitasAtrasadas: 0,
    totalDespesasPendentes: 0,
    totalDespesasPagas: 0,
    receitaLiquida: 0,
    clientesInadimplentes: 0,
    totalHonorarios: 0,
    totalDespesas: 0,
    totalRecibos: 0,
    taxaRecebimento: '0.0',
    ultimosRecibos: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        // 1. Buscar dados do Dashboard Financeiro (API de agregação)
        const dashboardResponse = await fetch('/api/financeiro/dashboard');
        const dashboardResult = await dashboardResponse.json();

        // 2. Buscar os últimos 5 recibos (API de recibos)
        // Usamos orderBy e limit para pegar os mais recentes
        const recibosQuery = query(
          collection(db, 'financeiro_recibos'), 
          orderBy('dataEmissao', 'desc'), 
          limit(5)
        );
        const recibosSnapshot = await getDocs(recibosQuery);
        const ultimosRecibosData = recibosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as FinanceiroRecibos[];

        if (dashboardResult.sucesso) {
          const apiDashboard = dashboardResult.dashboard;

          setFinancialData({
            totalReceitasPendentes: apiDashboard.resumoFinanceiro.totalReceitasPendentes,
            totalReceitasPagas: apiDashboard.resumoFinanceiro.totalReceitasPagas,
            totalReceitasAtrasadas: apiDashboard.resumoFinanceiro.totalReceitasAtrasadas,
            totalDespesasPendentes: apiDashboard.resumoFinanceiro.totalDespesasPendentes,
            totalDespesasPagas: apiDashboard.resumoFinanceiro.totalDespesasPagas,
            receitaLiquida: apiDashboard.resumoFinanceiro.receitaLiquida,
            clientesInadimplentes: apiDashboard.resumoFinanceiro.clientesInadimplentes,
            totalHonorarios: apiDashboard.indicadores.totalHonorarios,
            totalDespesas: apiDashboard.indicadores.totalDespesas,
            totalRecibos: apiDashboard.indicadores.totalRecibos,
            taxaRecebimento: apiDashboard.indicadores.taxaRecebimento,
            ultimosRecibos: ultimosRecibosData // Atribui os recibos reais
          });
        } else {
          console.error('Erro ao buscar dados do dashboard:', dashboardResult.error);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Erro ao buscar dados financeiros:', error);
        setIsLoading(false);
      }
    };

    fetchFinancialData();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função para formatar Timestamp para string de data
  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleDateString('pt-BR'); // Ex: 29/07/2025
  };

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background Principal */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-amber-900"></div>
      
      {/* Elementos Decorativos */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-amber-800 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-72 h-72 bg-amber-700 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      {/* Container Principal */}
      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="max-w-7xl mx-auto p-6 rounded-2xl backdrop-blur-sm border shadow-2xl mb-8"
          style={{ 
            backgroundColor: 'rgba(20, 20, 20, 0.8)',
            borderColor: 'rgba(176, 130, 90, 0.2)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
          }}>
          
          {/* Navigation Header */}
          <div className="flex items-center justify-between mb-6">
            <Link 
              href="/dashboard" 
              className="group flex items-center px-4 py-2 rounded-xl border transition-all duration-300 hover:scale-105 active:scale-95"
              style={{ 
                backgroundColor: 'rgba(176, 130, 90, 0.2)',
                borderColor: 'rgba(176, 130, 90, 0.3)'
              }}
            >
              <ArrowLeft className="w-5 h-5 text-white mr-2" />
              <span className="text-white font-medium">Voltar ao Dashboard</span>
            </Link>

            <div className="flex items-center">
              <Scale className="w-8 h-8 mr-3" style={{ color: '#b0825a' }} />
              <h1 className="text-2xl sm:text-3xl font-bold text-white">GESTÃO FINANCEIRA</h1>
              <DollarSign className="w-8 h-8 ml-3" style={{ color: '#b0825a' }} />
            </div>

            <div className="flex items-center space-x-2 text-sm" style={{ color: '#d4d4d4' }}>
              <Calendar className="w-4 h-4" />
              <span>Julho 2025</span> {/* Pode ser dinâmico no futuro */}
            </div>
          </div>

          {/* Título */}
          <div className="text-center">
            <div className="h-0.5 w-24 mx-auto mb-4" 
                 style={{ background: 'linear-gradient(to right, transparent, #b0825a, transparent)' }}></div>
            <p className="text-lg font-light opacity-80" style={{ color: '#d4d4d4' }}>
              Controle completo das finanças do seu escritório
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto">
          {/* Cards de Resumo Financeiro */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Honorários Pagos */}
            <div className="p-6 rounded-2xl backdrop-blur-sm border shadow-2xl"
                 style={{ 
                   backgroundColor: 'rgba(20, 20, 20, 0.8)',
                   borderColor: 'rgba(34, 197, 94, 0.2)',
                   boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                 }}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}>
                  <TrendingUp className="w-6 h-6" style={{ color: '#22c55e' }} />
                </div>
                {/* Taxa de recebimento pode ser exibida aqui */}
                <span className="text-xs font-medium px-2 py-1 rounded-full" 
                      style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#22c55e' }}>
                  {financialData.taxaRecebimento}%
                </span>
              </div>
              <h3 className="text-sm font-medium mb-1" style={{ color: '#d4d4d4' }}>Honorários Pagos</h3>
              <p className="text-2xl font-bold" style={{ color: '#22c55e' }}>
                {isLoading ? '...' : formatCurrency(financialData.totalReceitasPagas)}
              </p>
              <p className="text-xs mt-1" style={{ color: '#6e6d6b' }}>Total recebido</p>
            </div>

            {/* Total Despesas Pagas */}
            <div className="p-6 rounded-2xl backdrop-blur-sm border shadow-2xl"
                 style={{ 
                   backgroundColor: 'rgba(20, 20, 20, 0.8)',
                   borderColor: 'rgba(239, 68, 68, 0.2)',
                   boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                 }}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}>
                  <TrendingDown className="w-6 h-6" style={{ color: '#ef4444' }} />
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full" 
                      style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>
                  {/* Poderia ser uma % de variação das despesas */}
                  -X.X%
                </span>
              </div>
              <h3 className="text-sm font-medium mb-1" style={{ color: '#d4d4d4' }}>Despesas Pagas</h3>
              <p className="text-2xl font-bold" style={{ color: '#ef4444' }}>
                {isLoading ? '...' : formatCurrency(financialData.totalDespesasPagas)}
              </p>
              <p className="text-xs mt-1" style={{ color: '#6e6d6b' }}>Total de despesas</p>
            </div>

            {/* Saldo Líquido */}
            <div className="p-6 rounded-2xl backdrop-blur-sm border shadow-2xl"
                 style={{ 
                   backgroundColor: 'rgba(20, 20, 20, 0.8)',
                   borderColor: 'rgba(176, 130, 90, 0.2)',
                   boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                 }}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(176, 130, 90, 0.2)' }}>
                  <DollarSign className="w-6 h-6" style={{ color: '#b0825a' }} />
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full" 
                      style={{ backgroundColor: 'rgba(176, 130, 90, 0.2)', color: '#b0825a' }}>
                  Líquido
                </span>
              </div>
              <h3 className="text-sm font-medium mb-1" style={{ color: '#d4d4d4' }}>Saldo Líquido</h3>
              <p className="text-2xl font-bold" style={{ color: '#b0825a' }}>
                {isLoading ? '...' : formatCurrency(financialData.receitaLiquida)}
              </p>
              <p className="text-xs mt-1" style={{ color: '#6e6d6b' }}>Receita - Despesa</p>
            </div>

            {/* Inadimplentes */}
            <div className="p-6 rounded-2xl backdrop-blur-sm border shadow-2xl"
                 style={{ 
                   backgroundColor: 'rgba(20, 20, 20, 0.8)',
                   borderColor: 'rgba(245, 158, 11, 0.2)',
                   boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                 }}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)' }}>
                  <AlertTriangle className="w-6 h-6" style={{ color: '#f59e0b' }} />
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full" 
                      style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }}>
                  Atenção
                </span>
              </div>
              <h3 className="text-sm font-medium mb-1" style={{ color: '#d4d4d4' }}>Inadimplentes</h3>
              <p className="text-2xl font-bold" style={{ color: '#f59e0b' }}>
                {isLoading ? '...' : financialData.clientesInadimplentes}
              </p>
              <p className="text-xs mt-1" style={{ color: '#6e6d6b' }}>Clientes em atraso</p>
            </div>
          </div>

          {/* Cards de Navegação para Subpáginas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Honorários */}
            <Link href="/dashboard/financeiro/honorarios" className="group block">
              <div className="p-6 rounded-2xl backdrop-blur-sm border shadow-2xl transition-all duration-300 hover:scale-105"
                   style={{ 
                     backgroundColor: 'rgba(20, 20, 20, 0.8)',
                     borderColor: 'rgba(176, 130, 90, 0.2)',
                     boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                   }}>
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-xl mr-3" style={{ backgroundColor: 'rgba(176, 130, 90, 0.2)' }}>
                    <CreditCard className="w-6 h-6" style={{ color: '#b0825a' }} />
                  </div>
                  <h3 className="text-lg font-bold text-white">Honorários</h3>
                </div>
                <p className="text-sm mb-4" style={{ color: '#d4d4d4' }}>
                  Gerencie contratos e valores de honorários por cliente
                </p>
                <div className="text-xs" style={{ color: '#6e6d6b' }}>
                  Clique para gerenciar →
                </div>
              </div>
            </Link>

            {/* Despesas */}
            <Link href="/dashboard/financeiro/despesas" className="group block">
              <div className="p-6 rounded-2xl backdrop-blur-sm border shadow-2xl transition-all duration-300 hover:scale-105"
                   style={{ 
                     backgroundColor: 'rgba(20, 20, 20, 0.8)',
                     borderColor: 'rgba(176, 130, 90, 0.2)',
                     boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                   }}>
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-xl mr-3" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}>
                    <FileText className="w-6 h-6" style={{ color: '#ef4444' }} />
                  </div>
                  <h3 className="text-lg font-bold text-white">Despesas</h3>
                </div>
                <p className="text-sm mb-4" style={{ color: '#d4d4d4' }}>
                  Controle todas as despesas operacionais do escritório
                </p>
                <div className="text-xs" style={{ color: '#6e6d6b' }}>
                  Clique para gerenciar →
                </div>
              </div>
            </Link>

            {/* Recibos */}
            <Link href="/dashboard/financeiro/recibos" className="group block">
              <div className="p-6 rounded-2xl backdrop-blur-sm border shadow-2xl transition-all duration-300 hover:scale-105"
                   style={{ 
                     backgroundColor: 'rgba(20, 20, 20, 0.8)',
                     borderColor: 'rgba(176, 130, 90, 0.2)',
                     boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                   }}>
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-xl mr-3" style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}>
                    <Receipt className="w-6 h-6" style={{ color: '#22c55e' }} />
                  </div>
                  <h3 className="text-lg font-bold text-white">Recibos</h3>
                </div>
                <p className="text-sm mb-4" style={{ color: '#d4d4d4' }}>
                  Emita e gerencie recibos profissionais automaticamente
                </p>
                <div className="text-xs" style={{ color: '#6e6d6b' }}>
                  Clique para emitir →
                </div>
              </div>
            </Link>

            {/* Inadimplência */}
            <Link href="/dashboard/financeiro/inadimplencia" className="group block">
              <div className="p-6 rounded-2xl backdrop-blur-sm border shadow-2xl transition-all duration-300 hover:scale-105"
                   style={{ 
                     backgroundColor: 'rgba(20, 20, 20, 0.8)',
                     borderColor: 'rgba(176, 130, 90, 0.2)',
                     boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                   }}>
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-xl mr-3" style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)' }}>
                    <AlertTriangle className="w-6 h-6" style={{ color: '#f59e0b' }} />
                  </div>
                  <h3 className="text-lg font-bold text-white">Inadimplência</h3>
                </div>
                <p className="text-sm mb-4" style={{ color: '#d4d4d4' }}>
                  Monitore e gerencie clientes com pagamentos em atraso
                </p>
                <div className="text-xs" style={{ color: '#6e6d6b' }}>
                  Clique para monitorar →
                </div>
              </div>
            </Link>
          </div>

          {/* Últimos Recibos */}
          <div className="p-6 rounded-2xl backdrop-blur-sm border shadow-2xl"
               style={{ 
                 backgroundColor: 'rgba(20, 20, 20, 0.8)',
                 borderColor: 'rgba(176, 130, 90, 0.2)',
                 boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
               }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Últimos Recibos Emitidos</h3>
              <Link href="/dashboard/financeiro/recibos" 
                    className="text-sm px-4 py-2 rounded-lg transition-colors"
                    style={{ backgroundColor: 'rgba(176, 130, 90, 0.2)', color: '#b0825a' }}>
                Ver Todos
              </Link>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'rgba(176, 130, 90, 0.2)' }}>
                    <th className="text-left py-3 px-4 font-medium" style={{ color: '#d4d4d4' }}>Cliente</th>
                    <th className="text-left py-3 px-4 font-medium" style={{ color: '#d4d4d4' }}>Valor</th>
                    <th className="text-left py-3 px-4 font-medium" style={{ color: '#d4d4d4' }}>Data</th>
                    <th className="text-left py-3 px-4 font-medium" style={{ color: '#d4d4d4' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="py-3 px-4 text-center text-gray-500">Carregando dados...</td>
                    </tr>
                  ) : financialData.ultimosRecibos.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-3 px-4 text-center text-gray-500">Nenhum recibo encontrado.</td>
                    </tr>
                  ) : (
                    financialData.ultimosRecibos.map((recibo) => (
                      <tr key={recibo.id} className="border-b hover:bg-opacity-50" 
                          style={{ borderColor: 'rgba(176, 130, 90, 0.1)' }}>
                        <td className="py-3 px-4 text-white">{recibo.clienteNome}</td>
                        <td className="py-3 px-4" style={{ color: '#22c55e' }}>
                          {formatCurrency(recibo.valorTotal)}
                        </td>
                        <td className="py-3 px-4" style={{ color: '#d4d4d4' }}>{formatDate(recibo.dataEmissao)}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            recibo.status === 'emitido' 
                              ? 'bg-green-900 text-green-300' 
                              : 'bg-yellow-900 text-yellow-300' // Ou outra cor para 'cancelado'
                          }`}>
                            {recibo.status === 'emitido' ? 'Emitido' : 'Cancelado'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Trash2, LogOut, User, Calculator, DollarSign, FileText, Search, Clock, Users, Briefcase, FileSearch, User2, Scale, Gavel } from 'lucide-react';

// Importações Firebase
import { collection, query, where, orderBy, getDocs, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/firestore';

// Interface para Lead SaaS (adaptada para collection leads-saas)
interface LeadSaas {
  id?: string;
  advogadoId: string;
  nome: string;
  telefone: string;
  motivo: string;
  categoria?: string;
  dataRegistro: string | Timestamp;
  dataUltimaInteracao?: string | Timestamp;
  statusAtendimento: 'novo' | 'contatado' | 'agendado' | 'finalizado' | 'cancelado';
  tipoSolicitacaoCliente?: 'agendamento' | 'contato_advogado';
  preferenciaAgendamentoCliente?: string;
  historico?: unknown[];
}

// Função para buscar leads do advogado (Firebase Real)
const getLeadsByAdvogado = async (advogadoId: string): Promise<LeadSaas[]> => {
  try {
    console.log('Buscando leads para advogado:', advogadoId);

    // Query Firebase para buscar leads do advogado - CORRIGIDO: orderBy dataRegistro
    const leadsRef = collection(db, 'leads-saas');
    const q = query(
      leadsRef,
      where('advogadoId', '==', advogadoId),
      orderBy('dataRegistro', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const leads: LeadSaas[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      leads.push({
        id: doc.id,
        advogadoId: data.advogadoId,
        nome: data.nome,
        telefone: data.telefone,
        motivo: data.motivo,
        categoria: data.categoria || 'geral',
        dataRegistro: data.dataRegistro,
        dataUltimaInteracao: data.dataUltimaInteracao || data.dataRegistro,
        statusAtendimento: data.statusAtendimento || 'novo',
        tipoSolicitacaoCliente: data.tipoSolicitacaoCliente,
        preferenciaAgendamentoCliente: data.preferenciaAgendamentoCliente,
        historico: data.historico || []
      });
    });

    console.log('Leads encontrados:', leads.length);
    return leads;
  } catch (error) {
    console.error('Erro ao buscar leads:', error);
    return [];
  }
};

// Função para deletar lead (Firebase Real)
const deleteLead = async (leadId: string): Promise<void> => {
  try {
    console.log('Deletando lead:', leadId);
    await deleteDoc(doc(db, 'leads-saas', leadId));
    console.log('Lead deletado com sucesso');
  } catch (error) {
    console.error('Erro ao deletar lead:', error);
    throw error;
  }
};

export default function AdvogadoDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [leads, setLeads] = useState<LeadSaas[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  // Redirect se não autenticado
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/advogado/signin');
      return;
    }
    fetchLeads(); // eslint-disable-next-line
  }, [session, status, router]);

  // CORRIGIDO: Removido onSnapshot - usando apenas fetchLeads()

  const fetchLeads = async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      console.log('Buscando leads para advogado:', session.user.id);
      const leadsData = await getLeadsByAdvogado(session.user.id);
      console.log('Leads encontrados:', leadsData.length);
      setLeads(leadsData);
    } catch (error) {
      console.error('Erro ao buscar leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.telefone.includes(searchTerm) ||
      lead.motivo.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'todos' || lead.statusAtendimento === statusFilter;

    return matchesSearch && matchesStatus;
  });

  //eslint-disable-next-line
  const formatDate = (dateValue: string | Timestamp | any) => {
    if (!dateValue) return 'Data não disponível';
    try {
      let date: Date;

      // Se for timestamp do Firebase
      if (dateValue && typeof dateValue.toDate === 'function') {
        date = dateValue.toDate();
      }
      // Se for string
      else if (typeof dateValue === 'string') {
        date = new Date(dateValue);
      }
      // Se for objeto com seconds (Firebase timestamp)
      else if (dateValue && dateValue.seconds) {
        date = new Date(dateValue.seconds * 1000);
      }
      // Se já for Date
      else if (dateValue instanceof Date) {
        date = dateValue;
      } else {
        return 'Data inválida';
      }

      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'Data inválida';
    }
  };

  const handleDeleteLead = async (e: React.MouseEvent, leadId: string) => {
    e.stopPropagation();
    e.preventDefault();

    const confirmDelete = window.confirm(`Tem certeza de que deseja deletar este lead? Esta ação é irreversível.`);
    if (confirmDelete) {
      setLoading(true);
      try {
        await deleteLead(leadId);
        console.log(`Lead com ID ${leadId} deletado com sucesso.`);
        // Atualizar lista após deletar
        await fetchLeads();
      } catch (error) {
        console.error('Erro ao deletar lead:', error);
        alert('Erro ao deletar lead. Por favor, tente novamente.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleLogout = () => {
    signOut({ callbackUrl: '/auth/advogado/signin' });
  };

  const getStatusBadge = (status: LeadSaas['statusAtendimento']) => {
    const statusConfig = {
      novo: {
        color: '#22c55e',
        bg: 'linear-gradient(135deg, #22c55e20 0%, #22c55e30 100%)',
        text: 'Novo',
        icon: '✨'
      },
      contatado: {
        color: '#b0825a',
        bg: 'linear-gradient(135deg, #b0825a20 0%, #b0825a30 100%)',
        text: 'Contatado',
        icon: '📞'
      },
      agendado: {
        color: '#3b82f6',
        bg: 'linear-gradient(135deg, #3b82f620 0%, #3b82f630 100%)',
        text: 'Agendado',
        icon: '📅'
      },
      finalizado: {
        color: '#6e6d6b',
        bg: 'linear-gradient(135deg, #6e6d6b20 0%, #6e6d6b30 100%)',
        text: 'Finalizado',
        icon: '✅'
      },
      cancelado: {
        color: '#ef4444',
        bg: 'linear-gradient(135deg, #ef444420 0%, #ef444430 100%)',
        text: 'Cancelado',
        icon: '❌'
      }
    };

    const config = statusConfig[status] || statusConfig.novo;

    return (
      <div
        className="flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-2 rounded-full text-xs font-semibold border shadow-sm backdrop-blur-sm"
        style={{
          color: config.color,
          background: config.bg,
          borderColor: config.color + '40'
        }}
      >
        <span className="text-sm">{config.icon}</span>
        {config.text}
      </div>
    );
  };

  const getAgendamentoStatus = (lead: LeadSaas) => {
    if (lead.tipoSolicitacaoCliente === 'agendamento') {
      return lead.preferenciaAgendamentoCliente
        ? `Agendou: Sim (${lead.preferenciaAgendamentoCliente})`
        : 'Agendou: Sim (Preferência pendente)';
    } else if (lead.tipoSolicitacaoCliente === 'contato_advogado') {
      return 'Solicitou Contato Advogado';
    }
    return 'Agendou: Não';
  };
//eslint-disable-next-line
  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const getStatusStats = () => {
    return {
      total: leads.length,
      novo: leads.filter(l => l.statusAtendimento === 'novo').length,
      contatado: leads.filter(l => l.statusAtendimento === 'contatado').length,
      agendado: leads.filter(l => l.statusAtendimento === 'agendado').length,
      finalizado: leads.filter(l => l.statusAtendimento === 'finalizado').length,
      cancelado: leads.filter(l => l.statusAtendimento === 'cancelado').length
    };
  };

  const stats = getStatusStats();

  // Loading state - Aplicando cores do DS
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#000000] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#b0825a] mx-auto mb-4"></div>
          <p className="text-[#d4d4d4]">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    // Background Principal com gradiente
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#000000] via-[#1a1a1a] to-[#2a2a2a]">
      {/* Elementos decorativos - Background Orbs */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-[#b0825a] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
      <div className="absolute bottom-20 right-20 w-72 h-72 bg-[#b0825a] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000" />

      {/* Header - LAYOUT CORRIGIDO: Logo centralizada */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-4 border-b border-[#6e6d6b] border-opacity-20 backdrop-blur-sm"
           style={{ backgroundColor: 'rgba(20, 20, 20, 0.8)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-6">
            
            {/* ESQUERDA: Informações do usuário */}
            <div className="flex items-center gap-3 sm:gap-4 order-2 lg:order-1 lg:flex-1 justify-start">
              <div 
                className="flex items-center gap-2 sm:gap-3 px-3 py-2 sm:px-4 sm:py-3 rounded-xl border border-[#6e6d6b] border-opacity-20"
                style={{ backgroundColor: 'rgba(40, 40, 40, 0.8)' }}
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-[#b0825a] via-[#8b6942] to-[#6d532a]">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
                </div>
                <div className="text-xs sm:text-sm">
                  <p className="text-white font-semibold">{session?.user?.name}</p>
                  <p className="text-[#d4d4d4] text-xs">{session?.user?.email}</p>
                </div>
              </div>
            </div>

            {/* CENTRO: Logo IAJURIS - CORRIGIDO: Agora realmente centralizada */}
            <div className="flex items-center justify-center order-1 lg:order-2 lg:flex-1">
              <Scale className="w-6 h-6 text-[#b0825a] mr-2" style={{ opacity: 0.7, fontSize: '1.4rem' }} />
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#b0825a] text-shadow-lg">
                IAJURIS
              </h1>
              <Gavel className="w-6 h-6 text-[#b0825a] ml-2" style={{ opacity: 0.7, fontSize: '1.2rem' }} />
            </div>

            {/* DIREITA: Botão logout */}
            <div className="order-3 lg:order-3 lg:flex-1 flex justify-end">
              <button
                onClick={handleLogout}
                className="group flex items-center gap-2 sm:gap-3 px-4 py-3 sm:px-6 sm:py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg bg-gradient-to-br from-[#ef4444] via-[#dc2626] to-[#b91c1c] text-white"
                style={{ boxShadow: '0 10px 25px rgba(239, 68, 68, 0.3)' }}
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-1" />
                <span className="text-sm sm:text-base">Sair</span>
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Título da Página - Ajustando cores do DS */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-6 border-b border-[#6e6d6b] border-opacity-20"
           style={{ backgroundColor: 'rgba(20, 20, 20, 0.8)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center">
            <Briefcase className="w-6 sm:w-8 h-6 sm:h-8 text-[#b0825a] mr-3" style={{ opacity: 0.7, fontSize: '1.2rem' }} />
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">Painel de Gestão</h2>
          </div>
          {/* Separador - Linha dourada sutil */}
          <div className="mx-auto mt-4 h-0.5 w-24 bg-gradient-to-r from-transparent via-[#b0825a] to-transparent" />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Filtros - Aplicando Container Principal e Inputs */}
        <div 
          className="mb-8 rounded-2xl p-4 sm:p-6 shadow-2xl transition-all duration-300"
          style={{ 
            backgroundColor: 'rgba(20, 20, 20, 0.8)',
            border: '1px solid rgba(176, 130, 90, 0.2)',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
          }}
        >
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
            {/* Campo de busca */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#b0825a] opacity-70" />
                <input
                  type="text"
                  placeholder="Buscar por nome, telefone ou motivo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 sm:py-4 rounded-xl bg-[rgba(40,40,40,0.8)] border border-[#6e6d6b] text-white placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#b0825a] transform transition-all duration-300 focus:scale-[1.02] text-sm sm:text-base"
                />
              </div>
            </div>

            {/* Filtro de status */}
            <div className="lg:w-64">
              <div className="relative">
                <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#b0825a] opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
                </svg>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 sm:py-4 rounded-xl bg-[rgba(40,40,40,0.8)] border border-[#6e6d6b] text-white focus:outline-none focus:ring-2 focus:ring-[#b0825a] transform transition-all duration-300 focus:scale-[1.02] appearance-none text-sm sm:text-base"
                >
                  <option value="todos">Todos os Status</option>
                  <option value="novo">✨ Novo</option>
                  <option value="contatado">📞 Contatado</option>
                  <option value="agendado">📅 Agendado</option>
                  <option value="finalizado">✅ Finalizado</option>
                  <option value="cancelado">❌ Cancelado</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 sm:gap-6 mb-8">
          <div 
            className="p-4 sm:p-6 rounded-2xl shadow-2xl text-center transition-all duration-300 transform hover:scale-105"
            style={{ 
              backgroundColor: 'rgba(20, 20, 20, 0.8)',
              border: '1px solid rgba(176, 130, 90, 0.2)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
            }}
          >
            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
              {stats.total}
            </div>
            <div className="text-[#d4d4d4] text-xs sm:text-sm font-medium">Total</div>
          </div>

          <div 
            className="p-4 sm:p-6 rounded-2xl shadow-2xl text-center transition-all duration-300 transform hover:scale-105"
            style={{ 
              backgroundColor: 'rgba(20, 20, 20, 0.8)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
            }}
          >
            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#6e6d6b] mb-2">
              {stats.novo}
            </div>
            <div className="text-[#d4d4d4] text-xs sm:text-sm font-medium">Novos</div>
          </div>

          <div 
            className="p-4 sm:p-6 rounded-2xl shadow-2xl text-center transition-all duration-300 transform hover:scale-105"
            style={{ 
              backgroundColor: 'rgba(20, 20, 20, 0.8)',
              border: '1px solid rgba(176, 130, 90, 0.2)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
            }}
          >
            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#6e6d6b] mb-2">
              {stats.contatado}
            </div>
            <div className="text-[#d4d4d4] text-xs sm:text-sm font-medium">Contatados</div>
          </div>

          <div 
            className="p-4 sm:p-6 rounded-2xl shadow-2xl text-center transition-all duration-300 transform hover:scale-105"
            style={{ 
              backgroundColor: 'rgba(20, 20, 20, 0.8)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
            }}
          >
            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#6e6d6b] mb-2">
              {stats.agendado}
            </div>
            <div className="text-[#d4d4d4] text-xs sm:text-sm font-medium">Agendados</div>
          </div>

          <div 
            className="p-4 sm:p-6 rounded-2xl shadow-2xl text-center transition-all duration-300 transform hover:scale-105"
            style={{ 
              backgroundColor: 'rgba(20, 20, 20, 0.8)',
              border: '1px solid rgba(110, 109, 107, 0.2)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
            }}
          >
            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#6e6d6b] mb-2">
              {stats.finalizado}
            </div>
            <div className="text-[#d4d4d4] text-xs sm:text-sm font-medium">Finalizados</div>
          </div>
        </div>

        {/* Cards de Navegação */}
        <div className="mb-8">
          <div 
            className="p-4 sm:p-6 rounded-2xl shadow-2xl mb-6"
            style={{ 
              backgroundColor: 'rgba(20, 20, 20, 0.8)',
              border: '1px solid rgba(176, 130, 90, 0.2)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
            }}
          >
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-[#b0825a] via-[#8b6942] to-[#6d532a]">
                <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
              </div>
              Ferramentas Jurídicas
            </h3>
            <p className="text-[#d4d4d4] text-sm sm:text-base">
              Acesse todas as funcionalidades do sistema para otimizar seu trabalho
            </p>
          </div>

          {/* Grid de ferramentas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Card Calculadora Jurídica */}
            <Link href="/dashboard/calculadora" className="group block">
              <div 
                className="p-4 sm:p-6 rounded-2xl shadow-2xl transition-all duration-300 transform hover:scale-105 h-full"
                style={{ 
                  backgroundColor: 'rgba(20, 20, 20, 0.8)',
                  border: '1px solid rgba(176, 130, 90, 0.2)',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div 
                      className="p-2 sm:p-3 rounded-xl mr-3 sm:mr-4 transition-all duration-300 group-hover:scale-110"
                      style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)' }}
                    >
                      <Calculator className="w-5 h-5 sm:w-6 sm:h-6 text-[#6e6d6b]" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-[#b0825a] transition-colors duration-300">
                      Calculadora
                    </h3>
                  </div>
                </div>
                <p className="mb-4 sm:mb-6 text-sm text-[#d4d4d4] flex-grow">
                  Calculadoras especializadas para cálculos jurídicos, trabalhistas e previdenciários.
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <span className="text-xl sm:text-2xl font-bold text-blue-400">🧮</span>
                    <span className="text-xs text-[#d4d4d4]">Cálculos precisos</span>
                  </div>
                  <div className="text-xs text-[#6e6d6b] group-hover:text-[#b0825a] transition-colors">
                    Clique para acessar →
                  </div>
                </div>
              </div>
            </Link>

            {/* Card Gestão Financeira */}
            <Link href="/dashboard/financeiro" className="group block">
              <div 
                className="p-4 sm:p-6 rounded-2xl shadow-2xl transition-all duration-300 transform hover:scale-105 h-full"
                style={{ 
                  backgroundColor: 'rgba(20, 20, 20, 0.8)',
                  border: '1px solid rgba(176, 130, 90, 0.2)',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div 
                      className="p-2 sm:p-3 rounded-xl mr-3 sm:mr-4 transition-all duration-300 group-hover:scale-110"
                      style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}
                    >
                      <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-[#6e6d6b]" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-[#b0825a] transition-colors duration-300">
                      Gestão Financeira
                    </h3>
                  </div>
                </div>
                <p className="mb-4 sm:mb-6 text-sm text-[#d4d4d4]">
                  Controle completo de honorários, despesas e fluxo de caixa do escritório.
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <span className="text-xl sm:text-2xl font-bold text-[#6e6d6b]">💰</span>
                    <span className="text-xs text-[#d4d4d4]">Fluxo de caixa</span>
                  </div>
                  <div className="text-xs text-[#6e6d6b] group-hover:text-[#b0825a] transition-colors">
                    Clique para gerenciar →
                  </div>
                </div>
              </div>
            </Link>

            {/* Card Criação de Petições */}
            <Link href="/dashboard/peticoes" className="group block">
              <div 
                className="p-4 sm:p-6 rounded-2xl shadow-2xl transition-all duration-300 transform hover:scale-105 h-full"
                style={{ 
                  backgroundColor: 'rgba(20, 20, 20, 0.8)',
                  border: '1px solid rgba(176, 130, 90, 0.2)',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div 
                      className="p-2 sm:p-3 rounded-xl mr-3 sm:mr-4 transition-all duration-300 group-hover:scale-110"
                      style={{ backgroundColor: 'rgba(176, 130, 90, 0.2)' }}
                    >
                      <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-[#6e6d6b]" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-[#b0825a] transition-colors duration-300">
                      Criação de Petições
                    </h3>
                  </div>
                </div>
                <p className="mb-4 sm:mb-6 text-sm text-[#d4d4d4]">
                  Gere petições jurídicas profissionais com IA avançada especializada em documentos legais.
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <span className="text-xl sm:text-2xl font-bold text-[#6e6d6b]">📄</span>
                    <span className="text-xs text-[#d4d4d4]">IA profissional</span>
                  </div>
                  <div className="text-xs text-[#6e6d6b] group-hover:text-[#b0825a] transition-colors">
                    Clique para criar →
                  </div>
                </div>
              </div>
            </Link>

            {/* Card Prazos Processuais */}
            <Link href="/dashboard/prazos" className="group block">
              <div 
                className="p-4 sm:p-6 rounded-2xl shadow-2xl transition-all duration-300 transform hover:scale-105 h-full"
                style={{ 
                  backgroundColor: 'rgba(20, 20, 20, 0.8)',
                  border: '1px solid rgba(176, 130, 90, 0.2)',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div 
                      className="p-2 sm:p-3 rounded-xl mr-3 sm:mr-4 transition-all duration-300 group-hover:scale-110"
                      style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)' }}
                    >
                      <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-[#6e6d6b]" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-[#b0825a] transition-colors duration-300">
                      Prazos Processuais
                    </h3>
                  </div>
                </div>
                <p className="mb-4 sm:mb-6 text-sm text-[#d4d4d4]">
                  Gerencie e monitore todos os prazos processuais dos seus casos em andamento.
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <span className="text-xl sm:text-2xl font-bold text-[#6e6d6b]">⏰</span>
                    <span className="text-xs text-[#d4d4d4]">Controle total</span>
                  </div>
                  <div className="text-xs text-[#6e6d6b] group-hover:text-[#6e6d6b] transition-colors">
                    Clique para gerenciar →
                  </div>
                </div>
              </div>
            </Link>

            {/* Card Análise de PDF */}
            <Link href="/dashboard/pdfAnalysis" className="group block">
              <div 
                className="p-4 sm:p-6 rounded-2xl shadow-2xl transition-all duration-300 transform hover:scale-105 h-full"
                style={{ 
                  backgroundColor: 'rgba(20, 20, 20, 0.8)',
                  border: '1px solid rgba(176, 130, 90, 0.2)',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div 
                      className="p-2 sm:p-3 rounded-xl mr-3 sm:mr-4 transition-all duration-300 group-hover:scale-110"
                      style={{ backgroundColor: 'rgba(107, 114, 128, 0.2)' }}
                    >
                      <FileSearch className="w-5 h-5 sm:w-6 sm:h-6 text-[#b0825a]" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-[#b0825a] transition-colors duration-300">
                      Análise de PDF com IA
                    </h3>
                  </div>
                </div>
                <p className="mb-4 sm:mb-6 text-sm text-[#d4d4d4]">
                  Interaja com documentos PDF complexos e extraia informações relevantes de forma inteligente.
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <span className="text-xl sm:text-2xl font-bold text-[#6e6d6b]">🤖</span>
                    <span className="text-xs text-[#d4d4d4]">IA em documentos</span>
                  </div>
                  <div className="text-xs text-[#6e6d6b] group-hover:text-[#6e6d6b] transition-colors">
                    Clique para analisar →
                  </div>
                </div>
              </div>
            </Link>

            {/* Card Gestão de Clientes */}
            <Link href="/dashboard/clientes" className="group block">
              <div 
                className="p-4 sm:p-6 rounded-2xl shadow-2xl transition-all duration-300 transform hover:scale-105 h-full"
                style={{ 
                  backgroundColor: 'rgba(20, 20, 20, 0.8)',
                  border: '1px solid rgba(176, 130, 90, 0.2)',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div 
                      className="p-2 sm:p-3 rounded-xl mr-3 sm:mr-4 transition-all duration-300 group-hover:scale-110"
                      style={{ backgroundColor: 'rgba(17, 94, 254, 0.2)' }}
                    >
                      <User2 className="w-5 h-5 sm:w-6 sm:h-6 text-[#6e6d6b]" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-[#b0825a] transition-colors duration-300">
                      Gestão de Clientes
                    </h3>
                  </div>
                </div>
                <p className="mb-4 sm:mb-6 text-sm text-[#d4d4d4]">
                  Centralize o histórico, dados e notas de todos os seus clientes em um único lugar.
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <span className="text-xl sm:text-2xl font-bold text-[#6e6d6b]">🤝</span>
                    <span className="text-xs text-[#d4d4d4]">Organize seus casos</span>
                  </div>
                  <div className="text-xs text-[#6e6d6b] group-hover:text-[#6e6d6b] transition-colors">
                    Clique para gerenciar →
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Lista de Leads */}
        <div 
          className="rounded-2xl p-4 sm:p-6 shadow-2xl transition-all duration-300"
          style={{ 
            backgroundColor: 'rgba(20, 20, 20, 0.8)',
            border: '1px solid rgba(176, 130, 90, 0.2)',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
          }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-[#b0825a] via-[#8b6942] to-[#6d532a]">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                  Seus Leads Recebidos
                </h2>
                <p className="text-[#d4d4d4] text-xs sm:text-sm">
                  Total de {filteredLeads.length} lead(s) encontrado(s) de {leads.length}
                </p>
              </div>
            </div>

            {filteredLeads.length > 0 && (
              <div className="text-xs sm:text-sm text-[#d4d4d4]">
                Última atualização: agora
              </div>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-[#b0825a] mx-auto mb-4"></div>
              <p className="text-[#d4d4d4]">Carregando seus leads...</p>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(176, 130, 90, 0.2)' }}>
                <Search className="w-8 h-8 sm:w-10 sm:h-10 text-[#b0825a]" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                {searchTerm || statusFilter !== 'todos' ? 'Nenhum lead encontrado' : 'Nenhum lead ainda'}
              </h3>
              <p className="text-[#d4d4d4] max-w-md mx-auto text-sm">
                {searchTerm || statusFilter !== 'todos'
                  ? 'Tente ajustar os filtros de busca para encontrar o que procura.'
                  : 'Quando você receber leads do sistema IAJuris, eles aparecerão aqui.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {filteredLeads.map((lead) => (
                <div 
                  key={lead.id} 
                  className="p-4 sm:p-6 rounded-xl shadow-2xl transition-all duration-300 transform hover:scale-[1.02]" 
                  style={{ 
                    backgroundColor: 'rgba(40, 40, 40, 0.8)',
                    border: '1px solid rgba(110, 109, 107, 0.5)',
                    backdropFilter: 'blur(8px)'
                  }}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
                    {/* Informações principais do lead */}
                    <div className="flex-1 space-y-3 sm:space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 flex items-center gap-2 sm:gap-3">
                            <span className="text-xl sm:text-2xl">👤</span>
                            {lead.nome}
                          </h3>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                            <p className="text-[#b0825a] font-medium flex items-center gap-2">
                              <span className="text-base sm:text-lg">📞</span>
                              <span className="text-sm sm:text-base">{lead.telefone}</span>
                            </p>
                            {lead.categoria && (
                              <div className="flex items-center gap-1 text-xs text-[#d4d4d4]">
                                <span className="text-sm">🏷️</span>
                                <span className="capitalize">{lead.categoria}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap">
                          {getStatusBadge(lead.statusAtendimento)}
                          <button
                            onClick={(e) => handleDeleteLead(e, lead.id!)}
                            className="p-2 sm:p-3 rounded-xl bg-red-600/20 border border-red-600/30 text-red-400 hover:bg-red-600/30 hover:text-red-300 transition-all duration-300 transform hover:scale-110 group"
                            title="Deletar lead"
                          >
                            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-[#d4d4d4] mb-2 flex items-center gap-2">
                            <span className="text-base">💬</span>
                            Motivo do contato:
                          </p>
                          <p className="text-[#d4d4d4] leading-relaxed pl-4 sm:pl-6 text-sm sm:text-base">
                            {lead.motivo}
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-xs sm:text-sm">
                          <div className="flex items-center gap-2 text-[#d4d4d4]">
                            <span className="text-base">📅</span>
                            <span>Recebido em: {formatDate(lead.dataRegistro)}</span>
                          </div>

                          <div className="flex items-center gap-2 text-[#d4d4d4]">
                            <span className="text-base">{lead.tipoSolicitacaoCliente === 'agendamento' ? '⏰' : '📞'}</span>
                            <span>{getAgendamentoStatus(lead)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer com informações do sistema */}
        <div className="mt-8 sm:mt-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-center">
            <div 
              className="p-4 sm:p-6 rounded-xl shadow-2xl transition-all duration-300 transform hover:scale-105"
              style={{ 
                backgroundColor: 'rgba(20, 20, 20, 0.8)',
                border: '1px solid rgba(176, 130, 90, 0.2)',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
              }}
            >
              <div className="text-2xl sm:text-3xl font-bold mb-2 text-[#b0825a]">24/7</div>
              <div className="text-xs sm:text-sm text-[#d4d4d4] mb-1">Sistema Ativo</div>
              <div className="text-xs text-[#6e6d6b]">Sempre disponível</div>
            </div>
            
            <div 
              className="p-4 sm:p-6 rounded-xl shadow-2xl transition-all duration-300 transform hover:scale-105"
              style={{ 
                backgroundColor: 'rgba(20, 20, 20, 0.8)',
                border: '1px solid rgba(176, 130, 90, 0.2)',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
              }}
            >
              <div className="text-2xl sm:text-3xl font-bold mb-2 text-[#b0825a]">IA</div>
              <div className="text-xs sm:text-sm text-[#d4d4d4] mb-1">Tecnologia Avançada</div>
              <div className="text-xs text-[#6e6d6b]">Automação inteligente</div>
            </div>
            
            <div 
              className="p-4 sm:p-6 rounded-xl shadow-2xl transition-all duration-300 transform hover:scale-105"
              style={{ 
                backgroundColor: 'rgba(20, 20, 20, 0.8)',
                border: '1px solid rgba(176, 130, 90, 0.2)',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
              }}
            >
              <div className="text-2xl sm:text-3xl font-bold mb-2 text-[#b0825a]">⚖️</div>
              <div className="text-xs sm:text-sm text-[#d4d4d4] mb-1">Foco Jurídico</div>
              <div className="text-xs text-[#6e6d6b]">Especializado em direito</div>
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
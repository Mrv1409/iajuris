'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import { 
  Scale, 
  ArrowLeft, 
  DollarSign, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2,
  AlertTriangle,
  Calendar,
  Clock
} from 'lucide-react';

// Interface para honorários (baseada na sua API)
export interface FinanceiroHonorarios {
  id: string;
  clienteId: string;
  clienteNome: string;
  valor: number;
  dataVencimento: string; // String para compatibilidade com frontend
  dataPagamento?: string | null;
  tipoHonorario: string;
  descricao: string;
  status: 'pendente' | 'pago' | 'cancelado';
  observacoes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface HonorarioApiData {
  clienteId: string;
  clienteNome: string;
  valor: number;
  dataVencimento: string;
  dataPagamento?: string | null;
  tipoHonorario: string;
  descricao: string;
  status: 'pendente' | 'pago' | 'cancelado';
  observacoes?: string;
}

// Interface para o estado do formulário
interface HonorarioFormState {
  clienteNome: string;
  tipoHonorario: string;
  descricao: string;
  valor: string;
  dataVencimento: string;
  dataPagamento: string;
  status: 'pendente' | 'pago' | 'cancelado';
  observacoes: string;
}

export default function HonorariosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [honorarios, setHonorarios] = useState<FinanceiroHonorarios[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [honorarioToDelete, setHonorarioToDelete] = useState<string | null>(null);
  const [editingHonorario, setEditingHonorario] = useState<FinanceiroHonorarios | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos'); // 'todos', 'pendente', 'pago', 'cancelado'

  // Form state
  const [formData, setFormData] = useState<HonorarioFormState>({
    clienteNome: '',
    tipoHonorario: '',
    descricao: '',
    valor: '',
    dataVencimento: new Date().toISOString().split('T')[0],
    dataPagamento: '',
    status: 'pendente',
    observacoes: ''
  });

  // 🔒 ISOLAMENTO HÍBRIDO MVP/SaaS - Guard de Segurança
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user?.email || !session?.user?.id) {
      router.push('/auth/signin');
      return;
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session?.user?.email && session?.user?.id) {
      fetchHonorarios();
    } else {
      setIsLoading(false);
    }//eslint-disable-next-line
  }, [session]);

  const fetchHonorarios = async () => {
    if (!session?.user?.email || !session?.user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // ✅ ISOLAMENTO HÍBRIDO MVP/SaaS - Fórmula de Sucesso
      const OWNER_EMAIL = 'marvincosta321@gmail.com';
      const isOwnerMVP = session?.user?.email === OWNER_EMAIL;
      const clientId = isOwnerMVP ? OWNER_EMAIL : session?.user?.id;

      const response = await fetch(`/api/financeiro/honorarios?clientId=${encodeURIComponent(clientId)}`);
      const result = await response.json();

      if (result.sucesso) {
        //eslint-disable-next-line
        const honorariosFormatados = result.honorarios.map((honorario: any) => ({
          ...honorario,
          dataVencimento: honorario.dataVencimento?.toDate ? 
            honorario.dataVencimento.toDate().toISOString().split('T')[0] : 
            honorario.dataVencimento,
          dataPagamento: honorario.dataPagamento?.toDate ? 
            honorario.dataPagamento.toDate().toISOString().split('T')[0] : 
            honorario.dataPagamento,
          createdAt: honorario.createdAt?.toDate ? 
            honorario.createdAt.toDate().toISOString() : 
            honorario.createdAt,
          updatedAt: honorario.updatedAt?.toDate ? 
            honorario.updatedAt.toDate().toISOString() : 
            honorario.updatedAt
        }));
        setHonorarios(honorariosFormatados);
      } else {
        console.error('Erro ao buscar honorários:', result.error);
      }
    } catch (error) {
      console.error('Erro ao buscar honorários:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.email || !session?.user?.id) return;

    setIsLoading(true);

    try {
      const valorNumerico = parseFloat(formData.valor);
      if (isNaN(valorNumerico)) {
        console.error('Valor inválido.');
        setIsLoading(false);
        return;
      }

      // ✅ ISOLAMENTO HÍBRIDO MVP/SaaS - Fórmula de Sucesso
      const OWNER_EMAIL = 'marvincosta321@gmail.com';
      const isOwnerMVP = session?.user?.email === OWNER_EMAIL;
      const clientId = isOwnerMVP ? OWNER_EMAIL : session?.user?.id;

      const honorarioData: HonorarioApiData = {
        clienteId: clientId, // 🔒 Usa o clientId híbrido seguro
        clienteNome: formData.clienteNome,
        valor: valorNumerico,
        dataVencimento: formData.dataVencimento,
        dataPagamento: formData.dataPagamento || null,
        tipoHonorario: formData.tipoHonorario,
        descricao: formData.descricao,
        status: formData.status,
        observacoes: formData.observacoes,
      };

      let response;
      if (editingHonorario) {
        // Atualizar honorário existente
        response = await fetch(`/api/financeiro/honorarios?id=${editingHonorario.id}&clientId=${encodeURIComponent(clientId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingHonorario.id, ...honorarioData })
        });
      } else {
        // Adicionar novo honorário
        response = await fetch(`/api/financeiro/honorarios?clientId=${encodeURIComponent(clientId)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(honorarioData)
        });
      }

      const result = await response.json();

      if (result.sucesso) {
        fetchHonorarios();
        setShowModal(false);
        setEditingHonorario(null);
        resetForm();
      } else {
        console.error('Erro ao salvar honorário:', result.error);
      }
    } catch (error) {
      console.error('Erro ao salvar honorário:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      clienteNome: '',
      tipoHonorario: '',
      descricao: '',
      valor: '',
      dataVencimento: new Date().toISOString().split('T')[0],
      dataPagamento: '',
      status: 'pendente',
      observacoes: ''
    });
  };

  const handleEdit = (honorario: FinanceiroHonorarios) => {
    setEditingHonorario(honorario);
    setFormData({
      clienteNome: honorario.clienteNome,
      tipoHonorario: honorario.tipoHonorario,
      descricao: honorario.descricao,
      valor: honorario.valor.toString(),
      dataVencimento: honorario.dataVencimento,
      dataPagamento: honorario.dataPagamento || '',
      status: honorario.status,
      observacoes: honorario.observacoes || ''
    });
    setShowModal(true);
  };

  const confirmDelete = (id: string) => {
    setHonorarioToDelete(id);
    setShowConfirmModal(true);
  };

  const handleDelete = async () => {
    if (!honorarioToDelete || !session?.user?.email || !session?.user?.id) return;

    setIsLoading(true);
    try {
      // ✅ ISOLAMENTO HÍBRIDO MVP/SaaS - Fórmula de Sucesso
      const OWNER_EMAIL = 'marvincosta321@gmail.com';
      const isOwnerMVP = session?.user?.email === OWNER_EMAIL;
      const clientId = isOwnerMVP ? OWNER_EMAIL : session?.user?.id;

      const response = await fetch(`/api/financeiro/honorarios?id=${honorarioToDelete}&clientId=${encodeURIComponent(clientId)}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.sucesso) {
        fetchHonorarios();
        setShowConfirmModal(false);
        setHonorarioToDelete(null);
      } else {
        console.error('Erro ao excluir honorário:', result.error);
      }
    } catch (error) {
      console.error('Erro ao excluir honorário:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'pendente' | 'pago' | 'cancelado') => {
    if (!session?.user?.email || !session?.user?.id) return;

    setIsLoading(true);
    try {
      // ✅ ISOLAMENTO HÍBRIDO MVP/SaaS - Fórmula de Sucesso
      const OWNER_EMAIL = 'marvincosta321@gmail.com';
      const isOwnerMVP = session?.user?.email === OWNER_EMAIL;
      const clientId = isOwnerMVP ? OWNER_EMAIL : session?.user?.id;

      const response = await fetch(`/api/financeiro/honorarios?id=${id}&clientId=${encodeURIComponent(clientId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      const result = await response.json();

      if (result.sucesso) {
        fetchHonorarios();
      } else {
        console.error('Erro ao atualizar status:', result.error);
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  //eslint-disable-next-line
  const formatDate = (dateValue: string | null | undefined | any) => {
    if (!dateValue) return '-';
    
    try {
      let date;
      
      // Se for um timestamp do Firebase (objeto com .toDate())
      if (dateValue && typeof dateValue === 'object' && typeof dateValue.toDate === 'function') {
        date = dateValue.toDate();
      }
      // Se for um timestamp (objeto com seconds e nanoseconds)
      else if (dateValue && typeof dateValue === 'object' && dateValue.seconds) {
        date = new Date(dateValue.seconds * 1000);
      }
      // Se for uma string ou número
      else {
        date = new Date(dateValue);
      }
      
      // Verifica se a data é válida
      if (isNaN(date.getTime())) {
        return '-';
      }
      
      // Retorna formatação pt-BR
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric'
      });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return '-';
    }
  };

  // 🔒 Proteção de acesso - só renderiza se estiver autenticado
  if (status === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #2a2a2a 100%)' }}>
        <div className="text-center text-white">
          <Scale className="w-12 h-12 mx-auto mb-4 animate-spin opacity-70" style={{ color: '#b0825a' }} />
          <h2 className="text-xl font-bold mb-2">Carregando...</h2>
          <p style={{ color: '#d4d4d4' }}>Verificando autenticação</p>
        </div>
      </main>
    );
  }

  if (!session?.user?.email || !session?.user?.id) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #2a2a2a 100%)' }}>
        <div className="text-center text-white">
          <Scale className="w-12 h-12 mx-auto mb-4 opacity-70" style={{ color: '#b0825a' }} />
          <h2 className="text-xl font-bold mb-2">Acesso Restrito</h2>
          <p style={{ color: '#d4d4d4' }}>Faça login para acessar a Gestão de Honorários</p>
        </div>
      </main>
    );
  }

  const filteredHonorarios = honorarios.filter(honorario => {
    const matchesSearch = honorario.clienteNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          honorario.tipoHonorario.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          honorario.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'todos' || honorario.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalHonorarios = honorarios.length;
  const totalPendentes = honorarios.filter(h => h.status === 'pendente').length;
  const totalPagos = honorarios.filter(h => h.status === 'pago').length;
  const totalCancelados = honorarios.filter(h => h.status === 'cancelado').length;
  const valorTotal = honorarios.reduce((sum, h) => sum + h.valor, 0);
  const valorPago = honorarios.filter(h => h.status === 'pago').reduce((sum, h) => sum + h.valor, 0);
  const valorPendente = honorarios.filter(h => h.status === 'pendente').reduce((sum, h) => sum + h.valor, 0);

  return (
    <main className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #2a2a2a 100%)' }}>
      
      {/* Elementos Decorativos com Glassmorphism */}
      <div className="absolute top-20 left-20 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" 
           style={{ backgroundColor: '#b0825a' }}></div>
      <div className="absolute bottom-20 right-20 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-pulse" 
           style={{ backgroundColor: '#b0825a', animationDelay: '1s' }}></div>
      
      {/* Container Principal */}
      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        {/* Header com Glassmorphism */}
        <div className="max-w-7xl mx-auto p-4 sm:p-6 rounded-2xl backdrop-blur-sm border mb-6 sm:mb-8"
          style={{ 
            backgroundColor: 'rgba(26, 26, 26, 0.8)',
            borderColor: '#6e6d6b',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
          }}>
          
          {/* Navigation Header - RESPONSIVO */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <Link 
              href="/dashboard/financeiro" 
              className="group flex items-center px-4 py-2 rounded-xl border transition-all duration-300 hover:scale-105 active:scale-95 order-1 sm:order-none"
              style={{ 
                backgroundColor: 'rgba(176, 130, 90, 0.2)',
                borderColor: '#6e6d6b'
              }}
            >
              <ArrowLeft className="w-5 h-5 text-white mr-2 opacity-70" />
              <span className="text-white font-medium">Voltar</span>
            </Link>

            {/* Título Central - RESPONSIVO */}
            <div className="flex items-center order-3 sm:order-none w-full sm:w-auto justify-center">
              <Scale className="w-6 sm:w-8 h-6 sm:h-8 mr-2 sm:mr-3 opacity-70" style={{ color: '#b0825a' }} />
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-white text-center">GESTÃO DE HONORÁRIOS</h1>
              <DollarSign className="w-6 sm:w-8 h-6 sm:h-8 ml-2 sm:ml-3 opacity-70" style={{ color: '#22c55e' }} />
            </div>

            <button
              onClick={() => {
                setEditingHonorario(null);
                resetForm();
                setShowModal(true);
              }}
              className="group flex items-center px-3 sm:px-4 py-2 rounded-xl border transition-all duration-300 hover:scale-105 active:scale-95 order-2 sm:order-none"
              style={{ 
                background: 'linear-gradient(135deg, #b0825a 0%, #8b6444 50%, #6b4e2f 100%)',
                borderColor: '#6e6d6b'
              }}
            >
              <Plus className="w-4 sm:w-5 h-4 sm:h-5 mr-1 sm:mr-2 opacity-70" />
              <span className="text-white font-medium text-sm sm:text-base">Novo</span>
            </button>
          </div>

          {/* Título */}
          <div className="text-center">
            <div className="h-0.5 w-16 sm:w-24 mx-auto mb-4" 
                 style={{ background: 'linear-gradient(to right, transparent, #b0825a, transparent)' }}></div>
            <p className="text-sm sm:text-lg font-light opacity-80 px-4" style={{ color: '#d4d4d4' }}>
              Controle e gerencie honorários advocatícios
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto">
          {/* Cards de Estatísticas - RESPONSIVO MELHORADO */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
            <div className="p-3 sm:p-4 rounded-2xl backdrop-blur-sm border"
                 style={{ 
                   backgroundColor: 'rgba(26, 26, 26, 0.8)',
                   borderColor: '#6e6d6b',
                   boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
                 }}>
              <h3 className="text-xs sm:text-sm font-medium mb-1" style={{ color: '#d4d4d4' }}>Total</h3>
              <p className="text-lg sm:text-2xl font-bold" style={{ color: '#d4d4d4' }}>{totalHonorarios}</p>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl backdrop-blur-sm border"
                 style={{ 
                   backgroundColor: 'rgba(26, 26, 26, 0.8)',
                   borderColor: '#6e6d6b',
                   boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
                 }}>
              <h3 className="text-xs sm:text-sm font-medium mb-1" style={{ color: '#d4d4d4' }}>Pendentes</h3>
              <p className="text-lg sm:text-2xl font-bold" style={{ color: '#d4d4d4' }}>{totalPendentes}</p>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl backdrop-blur-sm border"
                 style={{ 
                   backgroundColor: 'rgba(26, 26, 26, 0.8)',
                   borderColor: '#6e6d6b',
                   boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
                 }}>
              <h3 className="text-xs sm:text-sm font-medium mb-1" style={{ color: '#d4d4d4' }}>Pagos</h3>
              <p className="text-lg sm:text-2xl font-bold" style={{ color: '#d4d4d4' }}>{totalPagos}</p>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl backdrop-blur-sm border"
                 style={{ 
                   backgroundColor: 'rgba(26, 26, 26, 0.8)',
                   borderColor: '#6e6d6b',
                   boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
                 }}>
              <h3 className="text-xs sm:text-sm font-medium mb-1" style={{ color: '#d4d4d4' }}>Cancelados</h3>
              <p className="text-lg sm:text-2xl font-bold" style={{ color: '#d4d4d4' }}>{totalCancelados}</p>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl backdrop-blur-sm border col-span-2 sm:col-span-1"
                 style={{ 
                   backgroundColor: 'rgba(26, 26, 26, 0.8)',
                   borderColor: '#6e6d6b',
                   boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
                 }}>
              <h3 className="text-xs sm:text-sm font-medium mb-1" style={{ color: '#d4d4d4' }}>Valor Total</h3>
              <p className="text-sm sm:text-xl font-bold" style={{ color: '#b0825a' }}>
                {formatCurrency(valorTotal)}
              </p>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl backdrop-blur-sm border"
                 style={{ 
                   backgroundColor: 'rgba(26, 26, 26, 0.8)',
                   borderColor: '#6e6d6b',
                   boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
                 }}>
              <h3 className="text-xs sm:text-sm font-medium mb-1" style={{ color: '#d4d4d4' }}>Recebido</h3>
              <p className="text-sm sm:text-xl font-bold" style={{ color: '#22c55e' }}>
                {formatCurrency(valorPago)}
              </p>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl backdrop-blur-sm border"
                 style={{ 
                   backgroundColor: 'rgba(26, 26, 26, 0.8)',
                   borderColor: '#6e6d6b',
                   boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
                 }}>
              <h3 className="text-xs sm:text-sm font-medium mb-1" style={{ color: '#d4d4d4' }}>A Receber</h3>
              <p className="text-sm sm:text-xl font-bold" style={{ color: '#d4d4d4' }}>
                {formatCurrency(valorPendente)}
              </p>
            </div>
          </div>

          {/* Filtros e Busca - RESPONSIVO */}
          <div className="p-4 sm:p-6 rounded-2xl backdrop-blur-sm border mb-6 sm:mb-8"
               style={{ 
                 backgroundColor: 'rgba(26, 26, 26, 0.8)',
                 borderColor: '#6e6d6b',
                 boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
               }}>
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Busca */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 opacity-70" 
                        style={{ color: '#6e6d6b' }} />
                <input
                  type="text"
                  placeholder="Buscar por cliente, tipo ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 sm:pl-10 pr-4 py-2 sm:py-3 rounded-xl border bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 text-sm sm:text-base"
                  style={{ 
                    backgroundColor: 'rgba(42, 42, 42, 0.6)',
                    borderColor: '#6e6d6b',
                  }}
                />
              </div>

              {/* Filtro por Status */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 opacity-70" 
                        style={{ color: '#6e6d6b' }} />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-8 sm:pl-10 pr-8 py-2 sm:py-3 rounded-xl border bg-transparent text-white focus:outline-none focus:ring-2 text-sm sm:text-base"
                  style={{ 
                    backgroundColor: 'rgba(42, 42, 42, 0.6)',
                    borderColor: '#6e6d6b'
                  }}
                >
                  <option value="todos" style={{ backgroundColor: '#2a2a2a' }}>Todos</option>
                  <option value="pendente" style={{ backgroundColor: '#2a2a2a' }}>Pendente</option>
                  <option value="pago" style={{ backgroundColor: '#2a2a2a' }}>Pago</option>
                  <option value="cancelado" style={{ backgroundColor: '#2a2a2a' }}>Cancelado</option>
                </select>
              </div>
            </div>
          </div>

          {/* Lista de Honorários - TABELA RESPONSIVA MELHORADA */}
          <div className="p-4 sm:p-6 rounded-2xl backdrop-blur-sm border"
               style={{ 
                 backgroundColor: 'rgba(26, 26, 26, 0.8)',
                 borderColor: '#6e6d6b',
                 boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
               }}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-white">
                Honorários ({filteredHonorarios.length})
              </h3>
            </div>
            
            {/* Tabela Responsiva */}
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <div className="min-w-full inline-block align-middle">
                <div className="overflow-hidden">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b" style={{ borderColor: '#6e6d6b' }}>
                        <th className="text-left py-3 px-2 sm:px-4 font-medium text-xs sm:text-sm" style={{ color: '#d4d4d4' }}>Tipo</th>
                        <th className="text-left py-3 px-2 sm:px-4 font-medium text-xs sm:text-sm hidden lg:table-cell" style={{ color: '#d4d4d4' }}>Descrição</th>
                        <th className="text-left py-3 px-2 sm:px-4 font-medium text-xs sm:text-sm" style={{ color: '#d4d4d4' }}>Valor</th>
                        <th className="text-left py-3 px-2 sm:px-4 font-medium text-xs sm:text-sm hidden md:table-cell" style={{ color: '#d4d4d4' }}>Vencimento</th>
                        <th className="text-left py-3 px-2 sm:px-4 font-medium text-xs sm:text-sm hidden lg:table-cell" style={{ color: '#d4d4d4' }}>Pagamento</th>
                        <th className="text-left py-3 px-2 sm:px-4 font-medium text-xs sm:text-sm" style={{ color: '#d4d4d4' }}>Status</th>
                        <th className="text-left py-3 px-2 sm:px-4 font-medium text-xs sm:text-sm" style={{ color: '#d4d4d4' }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr>
                          <td colSpan={7} className="py-6 px-2 sm:px-4 text-center" style={{ color: '#6e6d6b' }}>Carregando honorários...</td>
                        </tr>
                      ) : filteredHonorarios.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-6 px-2 sm:px-4 text-center" style={{ color: '#6e6d6b' }}>Nenhum honorário encontrado.</td>
                        </tr>
                      ) : (
                        filteredHonorarios.map((honorario) => (
                          <tr key={honorario.id} className="border-b hover:bg-opacity-50 transition-all duration-200" 
                              style={{ borderColor: 'rgba(110, 109, 107, 0.3)' }}>
                            {/* CORREÇÃO: Primeiro campo - Tipo */}
                            <td className="py-3 px-2 sm:px-4">
                              <div className="text-white font-medium text-xs sm:text-sm">
                                <div className="truncate max-w-[120px] sm:max-w-none">{honorario.clienteNome}</div>
                                <div className="text-xs sm:text-sm px-2 py-1 rounded-lg mt-1" 
                                     style={{ backgroundColor: 'rgba(176, 130, 90, 0.2)', color: '#b0825a' }}>
                                  {honorario.tipoHonorario}
                                </div>
                              </div>
                            </td>
                            
                            {/* CORREÇÃO: Segundo campo - Descrição */}
                            <td className="py-3 px-2 sm:px-4 max-w-xs hidden lg:table-cell">
                              <div className="text-white text-sm truncate" title={honorario.descricao}>
                                {honorario.descricao}
                              </div>
                            </td>
                            
                            {/* CORREÇÃO: Terceiro campo - Valor */}
                            <td className="py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm" style={{ color: '#22c55e' }}>
                              <div className="truncate max-w-[80px] sm:max-w-none">
                                {formatCurrency(honorario.valor)}
                              </div>
                            </td>
                            
                            {/* CORREÇÃO: Quarto campo - Vencimento */}
                            <td className="py-3 px-2 sm:px-4 hidden md:table-cell">
                              <div className="flex items-center text-xs sm:text-sm" style={{ color: '#d4d4d4' }}>
                                <Calendar className="w-3 sm:w-4 h-3 sm:h-4 mr-1 opacity-70" />
                                <span className="truncate">{formatDate(honorario.dataVencimento)}</span>
                              </div>
                            </td>
                            
                            {/* CORREÇÃO: Quinto campo - Pagamento */}
                            <td className="py-3 px-2 sm:px-4 hidden lg:table-cell">
                              <div className="flex items-center text-xs sm:text-sm" 
                                   style={{ color: honorario.dataPagamento ? '#22c55e' : '#6e6d6b' }}>
                                <Clock className="w-3 sm:w-4 h-3 sm:h-4 mr-1 opacity-70" />
                                <span className="truncate">{formatDate(honorario.dataPagamento || '')}</span>
                              </div>
                            </td>
                            
                            {/* CORREÇÃO: Sexto campo - Status */}
                            <td className="py-3 px-2 sm:px-4">
                              <select
                                value={honorario.status}
                                onChange={(e) => handleStatusChange(honorario.id, e.target.value as 'pendente' | 'pago' | 'cancelado')}
                                className={`px-1 sm:px-2 py-1 rounded-full text-xs font-medium border-0 w-full max-w-[90px] transition-all duration-200 ${
                                  honorario.status === 'pago' 
                                    ? 'bg-green-900 text-green-300' 
                                    : honorario.status === 'pendente'
                                    ? 'bg-yellow-900 text-yellow-300'
                                    : 'bg-red-900 text-red-300'
                                }`}
                                style={{ backgroundColor: 'rgba(42, 42, 42, 0.8)' }}
                              >
                                <option value="pendente" style={{ backgroundColor: '#2a2a2a' }}>Pendente</option>
                                <option value="pago" style={{ backgroundColor: '#2a2a2a' }}>Pago</option>
                                <option value="cancelado" style={{ backgroundColor: '#2a2a2a' }}>Cancelado</option>
                              </select>
                            </td>
                            
                            {/* CORREÇÃO: Sétimo campo - Ações */}
                            <td className="py-3 px-2 sm:px-4">
                              <div className="flex items-center space-x-1 sm:space-x-2">
                                <button
                                  onClick={() => handleEdit(honorario)}
                                  className="p-1 sm:p-2 rounded-lg transition-all duration-200 hover:scale-105"
                                  style={{ backgroundColor: 'rgba(176, 130, 90, 0.2)' }}
                                  title="Editar"
                                >
                                  <Edit className="w-3 sm:w-4 h-3 sm:h-4 opacity-70" style={{ color: '#b0825a' }} />
                                </button>
                                <button
                                  onClick={() => confirmDelete(honorario.id)}
                                  className="p-1 sm:p-2 rounded-lg transition-all duration-200 hover:scale-105"
                                  style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
                                  title="Excluir"
                                >
                                  <Trash2 className="w-3 sm:w-4 h-3 sm:h-4 opacity-70" style={{ color: '#ef4444' }} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Informações Mobile - Cards abaixo da tabela para mobile */}
            <div className="block sm:hidden mt-4 space-y-3">
              {filteredHonorarios.map((honorario) => (
                <div key={`mobile-${honorario.id}`} 
                     className="p-3 rounded-xl border transition-all duration-200"
                     style={{ 
                       backgroundColor: 'rgba(42, 42, 42, 0.6)',
                       borderColor: '#6e6d6b'
                     }}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-white font-medium text-sm">{honorario.clienteNome}</div>
                      <div className="text-xs" style={{ color: '#b0825a' }}>{honorario.tipoHonorario}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold" style={{ color: '#22c55e' }}>
                        {formatCurrency(honorario.valor)}
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                        honorario.status === 'pago' 
                          ? 'bg-green-900 text-green-300' 
                          : honorario.status === 'pendente'
                          ? 'bg-yellow-900 text-yellow-300'
                          : 'bg-red-900 text-red-300'
                      }`}>
                        {honorario.status}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs mb-2 line-clamp-2" style={{ color: '#d4d4d4' }}>
                    {honorario.descricao}
                  </div>
                  <div className="flex justify-between items-center text-xs" style={{ color: '#d4d4d4' }}>
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1 opacity-70" />
                      {formatDate(honorario.dataVencimento)}
                    </div>
                    {honorario.dataPagamento && (
                      <div className="flex items-center" style={{ color: '#22c55e' }}>
                        <Clock className="w-3 h-3 mr-1 opacity-70" />
                        {formatDate(honorario.dataPagamento)}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end space-x-2 mt-3">
                    <button
                      onClick={() => handleEdit(honorario)}
                      className="p-2 rounded-lg transition-all duration-200 hover:scale-105"
                      style={{ backgroundColor: 'rgba(176, 130, 90, 0.2)' }}
                    >
                      <Edit className="w-4 h-4 opacity-70" style={{ color: '#b0825a' }} />
                    </button>
                    <button
                      onClick={() => confirmDelete(honorario.id)}
                      className="p-2 rounded-lg transition-all duration-200 hover:scale-105"
                      style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
                    >
                      <Trash2 className="w-4 h-4 opacity-70" style={{ color: '#ef4444' }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Novo/Editar Honorário - RESPONSIVO */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 backdrop-blur-sm">
          <div className="max-w-2xl w-full max-h-[95vh] overflow-y-auto rounded-2xl backdrop-blur-sm border"
               style={{ 
                 backgroundColor: 'rgba(26, 26, 26, 0.95)',
                 borderColor: '#6e6d6b',
                 boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
               }}>
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  {editingHonorario ? 'Editar Honorário' : 'Novo Honorário'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingHonorario(null);
                    resetForm();
                  }}
                  className="text-white hover:opacity-70 transition-all duration-200 p-2"
                >
                  <span className="text-xl">✕</span>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#d4d4d4' }}>
                      Nome do Cliente *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.clienteNome}
                      onChange={(e) => setFormData({...formData, clienteNome: e.target.value})}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 text-sm sm:text-base transition-all duration-200"
                      style={{ 
                        backgroundColor: 'rgba(42, 42, 42, 0.6)',
                        borderColor: '#6e6d6b',
                      }}
                      placeholder="Nome completo do cliente"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#d4d4d4' }}>
                      Tipo de Honorário *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.tipoHonorario}
                      onChange={(e) => setFormData({...formData, tipoHonorario: e.target.value})}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 text-sm sm:text-base transition-all duration-200"
                      style={{ 
                        backgroundColor: 'rgba(42, 42, 42, 0.6)',
                        borderColor: '#6e6d6b'
                      }}
                      placeholder="Ex: Contrato, Audiência, Consultoria..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#d4d4d4' }}>
                    Descrição do Serviço *
                  </label>
                  <textarea
                    required
                    value={formData.descricao}
                    onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                    rows={3}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 resize-none text-sm sm:text-base transition-all duration-200"
                    style={{ 
                      backgroundColor: 'rgba(42, 42, 42, 0.6)',
                      borderColor: '#6e6d6b'
                    }}
                    placeholder="Descreva detalhadamente o serviço que gerou o honorário..."
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#d4d4d4' }}>
                      Valor (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.valor}
                      onChange={(e) => setFormData({...formData, valor: e.target.value})}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 text-sm sm:text-base transition-all duration-200"
                      style={{ 
                        backgroundColor: 'rgba(42, 42, 42, 0.6)',
                        borderColor: '#6e6d6b'
                      }}
                      placeholder="0,00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#d4d4d4' }}>
                      Data de Vencimento *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.dataVencimento}
                      onChange={(e) => setFormData({...formData, dataVencimento: e.target.value})}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border bg-transparent text-white focus:outline-none focus:ring-2 text-sm sm:text-base transition-all duration-200"
                      style={{ 
                        backgroundColor: 'rgba(42, 42, 42, 0.6)',
                        borderColor: '#6e6d6b'
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#d4d4d4' }}>
                      Data de Pagamento
                    </label>
                    <input
                      type="date"
                      value={formData.dataPagamento}
                      onChange={(e) => setFormData({...formData, dataPagamento: e.target.value})}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border bg-transparent text-white focus:outline-none focus:ring-2 text-sm sm:text-base transition-all duration-200"
                      style={{ 
                        backgroundColor: 'rgba(42, 42, 42, 0.6)',
                        borderColor: '#6e6d6b'
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#d4d4d4' }}>
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as 'pendente' | 'pago' | 'cancelado'})}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border bg-transparent text-white focus:outline-none focus:ring-2 text-sm sm:text-base transition-all duration-200"
                      style={{ 
                        backgroundColor: 'rgba(42, 42, 42, 0.6)',
                        borderColor: '#6e6d6b'
                      }}
                    >
                      <option value="pendente" style={{ backgroundColor: '#2a2a2a' }}>Pendente</option>
                      <option value="pago" style={{ backgroundColor: '#2a2a2a' }}>Pago</option>
                      <option value="cancelado" style={{ backgroundColor: '#2a2a2a' }}>Cancelado</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#d4d4d4' }}>
                    Observações
                  </label>
                  <textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                    rows={3}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 resize-none text-sm sm:text-base transition-all duration-200"
                    style={{ 
                      backgroundColor: 'rgba(42, 42, 42, 0.6)',
                      borderColor: '#6e6d6b'
                    }}
                    placeholder="Observações adicionais sobre o honorário..."
                  ></textarea>
                </div>

                <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-4 sm:pt-6 border-t" 
                     style={{ borderColor: '#6e6d6b' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingHonorario(null);
                      resetForm();
                    }}
                    className="w-full sm:w-auto px-4 sm:px-6 py-3 rounded-xl border text-white font-medium transition-all duration-300 hover:scale-105 active:scale-95 hover:opacity-80"
                    style={{ 
                      backgroundColor: 'rgba(110, 109, 107, 0.3)',
                      borderColor: '#6e6d6b'
                    }}
                  >
                    Cancelar
                  </button>
                  
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full sm:w-auto px-4 sm:px-6 py-3 rounded-xl border text-white font-medium transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ 
                      background: 'linear-gradient(135deg, #b0825a 0%, #8b6444 50%, #6b4e2f 100%)',
                      borderColor: '#6e6d6b'
                    }}
                  >
                    {isLoading 
                      ? 'Salvando...' 
                      : editingHonorario 
                      ? 'Atualizar Honorário' 
                      : 'Criar Honorário'
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão - RESPONSIVO */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="max-w-md w-full rounded-2xl backdrop-blur-sm border mx-4"
               style={{ 
                 backgroundColor: 'rgba(26, 26, 26, 0.95)',
                 borderColor: '#6e6d6b',
                 boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
               }}>
            <div className="p-4 sm:p-6 text-center">
              <AlertTriangle className="w-12 sm:w-16 h-12 sm:h-16 text-red-500 mx-auto mb-4 opacity-70" />
              <h2 className="text-lg sm:text-xl font-bold text-white mb-4">Confirmar Exclusão</h2>
              <p className="text-sm sm:text-base mb-6" style={{ color: '#d4d4d4' }}>
                Tem certeza que deseja excluir este honorário? Esta ação não pode ser desfeita.
              </p>
              <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setHonorarioToDelete(null);
                  }}
                  className="w-full sm:w-auto px-4 sm:px-6 py-3 rounded-xl border text-white font-medium transition-all duration-300 hover:scale-105 active:scale-95 hover:opacity-80"
                  style={{ 
                    backgroundColor: 'rgba(110, 109, 107, 0.3)',
                    borderColor: '#6e6d6b'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="w-full sm:w-auto px-4 sm:px-6 py-3 rounded-xl border text-white font-medium transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)',
                    borderColor: '#6e6d6b'
                  }}
                >
                  {isLoading ? 'Excluindo...' : 'Excluir'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State Global - RESPONSIVO */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="text-center p-4">
            <div className="w-12 sm:w-16 h-12 sm:h-16 border-4 border-t-4 rounded-full animate-spin mx-auto mb-4" 
                 style={{ 
                   borderColor: 'rgba(110, 109, 107, 0.3)',
                   borderTopColor: '#b0825a'
                 }}></div>
            <p className="text-white text-sm sm:text-lg">Processando...</p>
          </div>
        </div>
      )}
    </main>
  );
}
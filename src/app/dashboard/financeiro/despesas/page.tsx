'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Trash2, 
  ArrowLeft,//eslint-disable-next-line
  DollarSign, 
  Search, 
  Calendar, 
  Tag,
  Clock,
  Plus,
  Edit,
  Filter,
  TrendingDown,//eslint-disable-next-line
  CreditCard,
  Receipt,
  AlertTriangle
} from 'lucide-react';

// Interface para Despesa
export interface FinanceiroDespesas {
  id: string;
  clienteId: string;
  categoria: string;
  descricao: string;
  valor: number;
  dataVencimento: string; // String para compatibilidade com frontend
  dataPagamento?: string | null;
  status: 'pendente' | 'pago' | 'vencido';
  observacoes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DespesaApiData {
  clienteId: string;
  categoria: string;
  descricao: string;
  valor: number;
  dataVencimento: string;
  dataPagamento?: string | null;
  status: 'pendente' | 'pago' | 'vencido';
  observacoes?: string;
}

// Interface para o estado do formulário
interface DespesaFormState {
  categoria: string;
  descricao: string;
  valor: string;
  dataVencimento: string;
  dataPagamento: string;
  status: 'pendente' | 'pago' | 'vencido';
  observacoes: string;
}

export default function DespesasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [despesas, setDespesas] = useState<FinanceiroDespesas[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [despesaToDelete, setDespesaToDelete] = useState<string | null>(null);
  const [editingDespesa, setEditingDespesa] = useState<FinanceiroDespesas | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('todas');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  // Form state
  const [formData, setFormData] = useState<DespesaFormState>({
    categoria: '',
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
      fetchDespesas();
    } else {
      setIsLoading(false);
    }//eslint-disable-next-line
  }, [session]);

  const fetchDespesas = async () => {
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

      const response = await fetch(`/api/financeiro/despesas?clientId=${encodeURIComponent(clientId)}`);
      const result = await response.json();

      if (result.sucesso) {
        //eslint-disable-next-line
        const despesasFormatadas = result.despesas.map((despesa: any) => ({
          ...despesa,
          dataVencimento: despesa.dataVencimento?.toDate ? 
            despesa.dataVencimento.toDate().toISOString().split('T')[0] : 
            despesa.dataVencimento,
          dataPagamento: despesa.dataPagamento?.toDate ? 
            despesa.dataPagamento.toDate().toISOString().split('T')[0] : 
            despesa.dataPagamento,
          createdAt: despesa.createdAt?.toDate ? 
            despesa.createdAt.toDate().toISOString() : 
            despesa.createdAt,
          updatedAt: despesa.updatedAt?.toDate ? 
            despesa.updatedAt.toDate().toISOString() : 
            despesa.updatedAt
        }));
        setDespesas(despesasFormatadas);
      } else {
        console.error('Erro ao buscar despesas:', result.error);
      }
    } catch (error) {
      console.error('Erro ao buscar despesas:', error);
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

      const despesaData: DespesaApiData = {
        clienteId: clientId, // 🔒 Usa o clientId híbrido seguro
        categoria: formData.categoria,
        descricao: formData.descricao,
        valor: valorNumerico,
        dataVencimento: formData.dataVencimento,
        dataPagamento: formData.dataPagamento || null,
        status: formData.status,
        observacoes: formData.observacoes,
      };

      let response;
      if (editingDespesa) {
        // Atualizar despesa existente
        response = await fetch(`/api/financeiro/despesas?id=${editingDespesa.id}&clientId=${encodeURIComponent(clientId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingDespesa.id, ...despesaData })
        });
      } else {
        // Adicionar nova despesa
        response = await fetch(`/api/financeiro/despesas?clientId=${encodeURIComponent(clientId)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(despesaData)
        });
      }

      const result = await response.json();

      if (result.sucesso) {
        fetchDespesas();
        setShowModal(false);
        setEditingDespesa(null);
        resetForm();
      } else {
        console.error('Erro ao salvar despesa:', result.error);
      }
    } catch (error) {
      console.error('Erro ao salvar despesa:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      categoria: '',
      descricao: '',
      valor: '',
      dataVencimento: new Date().toISOString().split('T')[0],
      dataPagamento: '',
      status: 'pendente',
      observacoes: ''
    });
  };

  const handleEdit = (despesa: FinanceiroDespesas) => {
    setEditingDespesa(despesa);
    setFormData({
      categoria: despesa.categoria,
      descricao: despesa.descricao,
      valor: despesa.valor.toString(),
      dataVencimento: despesa.dataVencimento,
      dataPagamento: despesa.dataPagamento || '',
      status: despesa.status,
      observacoes: despesa.observacoes || ''
    });
    setShowModal(true);
  };

  const confirmDelete = (id: string) => {
    setDespesaToDelete(id);
    setShowConfirmModal(true);
  };

  const handleDelete = async () => {
    if (!despesaToDelete || !session?.user?.email || !session?.user?.id) return;

    setIsLoading(true);
    try {
      // ✅ ISOLAMENTO HÍBRIDO MVP/SaaS - Fórmula de Sucesso
      const OWNER_EMAIL = 'marvincosta321@gmail.com';
      const isOwnerMVP = session?.user?.email === OWNER_EMAIL;
      const clientId = isOwnerMVP ? OWNER_EMAIL : session?.user?.id;

      const response = await fetch(`/api/financeiro/despesas?id=${despesaToDelete}&clientId=${encodeURIComponent(clientId)}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.sucesso) {
        fetchDespesas();
        setShowConfirmModal(false);
        setDespesaToDelete(null);
      } else {
        console.error('Erro ao excluir despesa:', result.error);
      }
    } catch (error) {
      console.error('Erro ao excluir despesa:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'pendente' | 'pago' | 'vencido') => {
    if (!session?.user?.email || !session?.user?.id) return;

    setIsLoading(true);
    try {
      // ✅ ISOLAMENTO HÍBRIDO MVP/SaaS - Fórmula de Sucesso
      const OWNER_EMAIL = 'marvincosta321@gmail.com';
      const isOwnerMVP = session?.user?.email === OWNER_EMAIL;
      const clientId = isOwnerMVP ? OWNER_EMAIL : session?.user?.id;

      const response = await fetch(`/api/financeiro/despesas?id=${id}&clientId=${encodeURIComponent(clientId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      const result = await response.json();

      if (result.sucesso) {
        fetchDespesas();
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

  // ✅ CORREÇÃO: Função formatDate melhorada - igual ao padrão oficial
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

  // Obter categorias únicas
  const getCategorias = () => {
    const categoriasUnicas = Array.from(new Set(despesas.map(d => d.categoria)));
    return categoriasUnicas.sort();
  };

  // 🔒 Proteção de acesso - só renderiza se estiver autenticado
  if (status === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #2a2a2a 100%)' }}>
        <div className="text-center text-white">
          <TrendingDown className="w-12 h-12 mx-auto mb-4 animate-spin opacity-70" style={{ color: '#b0825a' }} />
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
          <TrendingDown className="w-12 h-12 mx-auto mb-4 opacity-70" style={{ color: '#b0825a' }} />
          <h2 className="text-xl font-bold mb-2">Acesso Restrito</h2>
          <p style={{ color: '#d4d4d4' }}>Faça login para acessar a Gestão de Despesas</p>
        </div>
      </main>
    );
  }

  const filteredDespesas = despesas.filter(despesa => {
    const matchesSearch = despesa.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          despesa.categoria.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategoria = categoriaFilter === 'todas' || despesa.categoria === categoriaFilter;
    const matchesStatus = statusFilter === 'todos' || despesa.status === statusFilter;
    
    return matchesSearch && matchesCategoria && matchesStatus;
  });

  const totalDespesas = despesas.length;
  const totalPendentes = despesas.filter(d => d.status === 'pendente').length;
  const totalPagas = despesas.filter(d => d.status === 'pago').length;
  const totalVencidas = despesas.filter(d => d.status === 'vencido').length;
  const valorTotal = despesas.reduce((sum, d) => sum + d.valor, 0);
  const valorPago = despesas.filter(d => d.status === 'pago').reduce((sum, d) => sum + d.valor, 0);
  const valorPendente = despesas.filter(d => d.status === 'pendente').reduce((sum, d) => sum + d.valor, 0);

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
              <TrendingDown className="w-6 sm:w-8 h-6 sm:h-8 mr-2 sm:mr-3 opacity-70" style={{ color: '#FF1A1A' }} />
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-white text-center">GESTÃO DE DESPESAS</h1>
              <Receipt className="w-6 sm:w-8 h-6 sm:h-8 ml-2 sm:ml-3 opacity-70" style={{ color: '#FF1A1A' }} />
            </div>

            <button
              onClick={() => {
                setEditingDespesa(null);
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
              <span className="text-white font-medium text-sm sm:text-base">Nova</span>
            </button>
          </div>

          {/* Título */}
          <div className="text-center">
            <div className="h-0.5 w-16 sm:w-24 mx-auto mb-4" 
                 style={{ background: 'linear-gradient(to right, transparent, #b0825a, transparent)' }}></div>
            <p className="text-sm sm:text-lg font-light opacity-80 px-4" style={{ color: '#d4d4d4' }}>
              Controle e gerencie suas despesas operacionais
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
              <p className="text-lg sm:text-2xl font-bold" style={{ color: '#d4d4d4' }}>{totalDespesas}</p>
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
              <h3 className="text-xs sm:text-sm font-medium mb-1" style={{ color: '#d4d4d4' }}>Pagas</h3>
              <p className="text-lg sm:text-2xl font-bold" style={{ color: '#d4d4d4' }}>{totalPagas}</p>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl backdrop-blur-sm border"
                 style={{ 
                   backgroundColor: 'rgba(26, 26, 26, 0.8)',
                   borderColor: '#6e6d6b',
                   boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
                 }}>
              <h3 className="text-xs sm:text-sm font-medium mb-1" style={{ color: '#d4d4d4' }}>Vencidas</h3>
              <p className="text-lg sm:text-2xl font-bold" style={{ color: '#d4d4d4' }}>{totalVencidas}</p>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl backdrop-blur-sm border col-span-2 sm:col-span-1"
                 style={{ 
                   backgroundColor: 'rgba(26, 26, 26, 0.8)',
                   borderColor: '#6e6d6b',
                   boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
                 }}>
              <h3 className="text-xs sm:text-sm font-medium mb-1" style={{ color: '#d4d4d4' }}>Valor Total</h3>
              <p className="text-sm sm:text-xl font-bold" style={{ color: '#9D0505' }}>
                {formatCurrency(valorTotal)}
              </p>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl backdrop-blur-sm border"
                 style={{ 
                   backgroundColor: 'rgba(26, 26, 26, 0.8)',
                   borderColor: '#6e6d6b',
                   boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
                 }}>
              <h3 className="text-xs sm:text-sm font-medium mb-1" style={{ color: '#d4d4d4' }}>Pago</h3>
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
              <h3 className="text-xs sm:text-sm font-medium mb-1" style={{ color: '#d4d4d4' }}>A Pagar</h3>
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
                  placeholder="Buscar por descrição ou categoria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 sm:pl-10 pr-4 py-2 sm:py-3 rounded-xl border bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 text-sm sm:text-base"
                  style={{ 
                    backgroundColor: 'rgba(42, 42, 42, 0.6)',
                    borderColor: '#6e6d6b',
                  }}
                />
              </div>

              {/* Filtro por Categoria */}
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 opacity-70" 
                      style={{ color: '#6e6d6b' }} />
                <select
                  value={categoriaFilter}
                  onChange={(e) => setCategoriaFilter(e.target.value)}
                  className="pl-8 sm:pl-10 pr-8 py-2 sm:py-3 rounded-xl border bg-transparent text-white focus:outline-none focus:ring-2 text-sm sm:text-base"
                  style={{ 
                    backgroundColor: 'rgba(42, 42, 42, 0.6)',
                    borderColor: '#6e6d6b'
                  }}
                >
                  <option value="todas" style={{ backgroundColor: '#2a2a2a' }}>Todas as Categorias</option>
                  {getCategorias().map(categoria => (
                    <option key={categoria} value={categoria} style={{ backgroundColor: '#2a2a2a' }}>{categoria}</option>
                  ))}
                </select>
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
                  <option value="todos" style={{ backgroundColor: '#2a2a2a' }}>Todos os Status</option>
                  <option value="pendente" style={{ backgroundColor: '#2a2a2a' }}>Pendente</option>
                  <option value="pago" style={{ backgroundColor: '#2a2a2a' }}>Pago</option>
                  <option value="vencido" style={{ backgroundColor: '#2a2a2a' }}>Vencido</option>
                </select>
              </div>
            </div>
          </div>

          {/* Lista de Despesas - TABELA RESPONSIVA MELHORADA */}
          <div className="p-4 sm:p-6 rounded-2xl backdrop-blur-sm border"
               style={{ 
                 backgroundColor: 'rgba(26, 26, 26, 0.8)',
                 borderColor: '#6e6d6b',
                 boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
               }}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-white">
                Despesas ({filteredDespesas.length})
              </h3>
            </div>
            
            {/* Tabela Responsiva */}
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <div className="min-w-full inline-block align-middle">
                <div className="overflow-hidden">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b" style={{ borderColor: '#6e6d6b' }}>
                        <th className="text-left py-3 px-2 sm:px-4 font-medium text-xs sm:text-sm" style={{ color: '#d4d4d4' }}>Descrição</th>
                        <th className="text-left py-3 px-2 sm:px-4 font-medium text-xs sm:text-sm hidden sm:table-cell" style={{ color: '#d4d4d4' }}>Categoria</th>
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
                          <td colSpan={8} className="py-6 px-2 sm:px-4 text-center text-gray-500">Carregando despesas...</td>
                        </tr>
                      ) : filteredDespesas.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-6 px-2 sm:px-4 text-center text-gray-500">Nenhuma despesa encontrada.</td>
                        </tr>
                      ) : (
                        filteredDespesas.map((despesa) => (
                          <tr key={despesa.id} className="border-b hover:bg-opacity-50" 
                              style={{ borderColor: '#6e6d6b' }}>
                            <td className="py-3 px-2 sm:px-4">
                              <div className="text-white font-medium text-xs sm:text-sm">
                                <div className="truncate max-w-[120px] sm:max-w-none">{despesa.descricao}</div>
                                <div className="text-xs text-gray-400 sm:hidden mt-1">
                                  {despesa.categoria}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-2 sm:px-4 hidden sm:table-cell">
                              <div className="text-xs sm:text-sm px-2 py-1 rounded-lg" style={{ backgroundColor: 'rgba(176, 130, 90, 0.2)', color: '#b0825a' }}>
                                {despesa.categoria}
                              </div>
                            </td>
                            <td className="py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm" style={{ color: '#d4d4d4' }}>
                              <div className="truncate max-w-[80px] sm:max-w-none">
                                {formatCurrency(despesa.valor)}
                              </div>
                            </td>
                            <td className="py-3 px-2 sm:px-4 hidden md:table-cell">
                              <div className="flex items-center text-xs sm:text-sm" style={{ color: '#FF3A3A' }}>
                                <Calendar className="w-3 sm:w-4 h-3 sm:h-4 mr-1 opacity-70" />
                                <span className="truncate">{formatDate(despesa.dataVencimento)}</span>
                              </div>
                            </td>
                            <td className="py-3 px-2 sm:px-4 hidden lg:table-cell">
                              <div className="flex items-center text-xs sm:text-sm" style={{ color: despesa.dataPagamento ? '#d4d4d4' : '#6e6d6b' }}>
                                <Clock className="w-3 sm:w-4 h-3 sm:h-4 mr-1 opacity-70" />
                                <span className="truncate">{formatDate(despesa.dataPagamento || '')}</span>
                              </div>
                            </td>
                            <td className="py-3 px-2 sm:px-4">
                              <select
                                value={despesa.status}
                                onChange={(e) => handleStatusChange(despesa.id, e.target.value as 'pendente' | 'pago' | 'vencido')}
                                className={`px-1 sm:px-2 py-1 rounded-full text-xs font-medium border-0 w-full max-w-[90px] ${
                                  despesa.status === 'pago' 
                                    ? 'bg-green-900 text-green-300' 
                                    : despesa.status === 'pendente'
                                    ? 'bg-yellow-900 text-yellow-300'
                                    : 'bg-red-900 text-red-300'
                                }`}
                                style={{ backgroundColor: 'rgba(42, 42, 42, 0.6)' }}
                              >
                                <option value="pendente" style={{ backgroundColor: '#2a2a2a' }}>Pendente</option>
                                <option value="pago" style={{ backgroundColor: '#2a2a2a' }}>Pago</option>
                                <option value="vencido" style={{ backgroundColor: '#2a2a2a' }}>Vencido</option>
                              </select>
                            </td>
                            <td className="py-3 px-2 sm:px-4">
                              <div className="flex items-center space-x-1 sm:space-x-2">
                                <button
                                  onClick={() => handleEdit(despesa)}
                                  className="p-1 sm:p-2 rounded-lg transition-colors hover:bg-opacity-20"
                                  style={{ backgroundColor: 'rgba(176, 130, 90, 0.1)' }}
                                  title="Editar"
                                >
                                  <Edit className="w-3 sm:w-4 h-3 sm:h-4" style={{ color: '#b0825a' }} />
                                </button>
                                <button
                                  onClick={() => confirmDelete(despesa.id)}
                                  className="p-1 sm:p-2 rounded-lg transition-colors hover:bg-opacity-20"
                                  style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)' }}
                                  title="Excluir"
                                >
                                  <Trash2 className="w-3 sm:w-4 h-3 sm:h-4" style={{ color: '#dc2626' }} />
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
              {filteredDespesas.map((despesa) => (
                <div key={`mobile-${despesa.id}`} 
                     className="p-3 rounded-xl border"
                     style={{ 
                       backgroundColor: 'rgba(42, 42, 42, 0.6)',
                       borderColor: '#6e6d6b'
                     }}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-white font-medium text-sm">{despesa.descricao}</div>
                      <div className="text-xs" style={{ color: '#b0825a' }}>{despesa.categoria}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold" style={{ color: '#b0825a' }}>
                        {formatCurrency(despesa.valor)}
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                        despesa.status === 'pago' 
                          ? 'bg-green-900 text-green-300' 
                          : despesa.status === 'pendente'
                          ? 'bg-yellow-900 text-yellow-300'
                          : 'bg-red-900 text-red-300'
                      }`}>
                        {despesa.status}
                      </div>
                    </div>
                  </div>
                  {despesa.observacoes && (
                    <div className="text-xs text-gray-400 mb-2 line-clamp-2">
                      {despesa.observacoes}
                    </div>
                  )}
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1 opacity-70" />
                      {formatDate(despesa.dataVencimento)}
                    </div>
                    {despesa.dataPagamento && (
                      <div className="flex items-center" style={{ color: '#22c55e' }}>
                        <Clock className="w-3 h-3 mr-1 opacity-70" />
                        {formatDate(despesa.dataPagamento)}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end space-x-2 mt-3">
                    <button
                      onClick={() => handleEdit(despesa)}
                      className="p-2 rounded-lg transition-colors"
                      style={{ backgroundColor: 'rgba(176, 130, 90, 0.2)' }}
                    >
                      <Edit className="w-4 h-4" style={{ color: '#b0825a' }} />
                    </button>
                    <button
                      onClick={() => confirmDelete(despesa.id)}
                      className="p-2 rounded-lg transition-colors"
                      style={{ backgroundColor: 'rgba(220, 38, 38, 0.2)' }}
                    >
                      <Trash2 className="w-4 h-4" style={{ color: '#dc2626' }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Nova/Editar Despesa - RESPONSIVO */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="max-w-2xl w-full max-h-[95vh] overflow-y-auto rounded-2xl backdrop-blur-sm border"
               style={{ 
                 backgroundColor: 'rgba(26, 26, 26, 0.95)',
                 borderColor: '#6e6d6b',
                 boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
               }}>
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  {editingDespesa ? 'Editar Despesa' : 'Nova Despesa'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingDespesa(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-white transition-colors p-2"
                >
                  <span className="text-xl">✕</span>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#d4d4d4' }}>
                      Descrição da Despesa *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.descricao}
                      onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 text-sm sm:text-base"
                      style={{ 
                        backgroundColor: 'rgba(42, 42, 42, 0.6)',
                        borderColor: '#6e6d6b'
                      }}
                      placeholder="Descreva a despesa"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#d4d4d4' }}>
                      Categoria *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.categoria}
                      onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 text-sm sm:text-base"
                      style={{ 
                        backgroundColor: 'rgba(42, 42, 42, 0.6)',
                        borderColor: '#6e6d6b'
                      }}
                      placeholder="Ex: Escritório, Marketing, Tecnologia..."
                    />
                  </div>
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
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 text-sm sm:text-base"
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
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border bg-transparent text-white focus:outline-none focus:ring-2 text-sm sm:text-base"
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
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border bg-transparent text-white focus:outline-none focus:ring-2 text-sm sm:text-base"
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
                      onChange={(e) => setFormData({...formData, status: e.target.value as 'pendente' | 'pago' | 'vencido'})}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border bg-transparent text-white focus:outline-none focus:ring-2 text-sm sm:text-base"
                      style={{ 
                        backgroundColor: 'rgba(42, 42, 42, 0.6)',
                        borderColor: '#6e6d6b'
                      }}
                    >
                      <option value="pendente" style={{ backgroundColor: '#2a2a2a' }}>Pendente</option>
                      <option value="pago" style={{ backgroundColor: '#2a2a2a' }}>Pago</option>
                      <option value="vencido" style={{ backgroundColor: '#2a2a2a' }}>Vencido</option>
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
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 resize-none text-sm sm:text-base"
                    style={{ 
                      backgroundColor: 'rgba(42, 42, 42, 0.6)',
                      borderColor: '#6e6d6b'
                    }}
                    placeholder="Observações adicionais sobre a despesa..."
                  ></textarea>
                </div>

                <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-4 sm:pt-6 border-t" 
                     style={{ borderColor: '#6e6d6b' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingDespesa(null);
                      resetForm();
                    }}
                    className="w-full sm:w-auto px-4 sm:px-6 py-3 rounded-xl border text-white font-medium transition-all duration-300 hover:scale-105 active:scale-95"
                    style={{ 
                      backgroundColor: 'rgba(107, 114, 128, 0.2)',
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
                      : editingDespesa 
                      ? 'Atualizar Despesa' 
                      : 'Criar Despesa'
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full rounded-2xl backdrop-blur-sm border mx-4"
               style={{ 
                 backgroundColor: 'rgba(26, 26, 26, 0.95)',
                 borderColor: '#6e6d6b',
                 boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
               }}>
            <div className="p-4 sm:p-6 text-center">
              <AlertTriangle className="w-12 sm:w-16 h-12 sm:h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-lg sm:text-xl font-bold text-white mb-4">Confirmar Exclusão</h2>
              <p className="text-sm sm:text-base text-gray-300 mb-6">
                Tem certeza que deseja excluir esta despesa? Esta ação não pode ser desfeita.
              </p>
              <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setDespesaToDelete(null);
                  }}
                  className="w-full sm:w-auto px-4 sm:px-6 py-3 rounded-xl border text-white font-medium transition-all duration-300 hover:scale-105 active:scale-95"
                  style={{ 
                    backgroundColor: 'rgba(107, 114, 128, 0.2)',
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
                    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)',
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="text-center p-4">
            <div className="w-12 sm:w-16 h-12 sm:h-16 border-4 border-t-4 rounded-full animate-spin mx-auto mb-4" 
                 style={{ 
                   borderColor: 'rgba(176, 130, 90, 0.3)',
                   borderTopColor: '#b0825a'
                 }}></div>
            <p className="text-white text-sm sm:text-lg">Processando...</p>
          </div>
        </div>
      )}
    </main>
  );
}
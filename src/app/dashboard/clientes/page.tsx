'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  ArrowLeft,
  User,
  CheckCircle,
  AlertCircle,
  Clock,
  X,
  Loader2,
  Scale,
  Gavel,
  BarChart3
} from 'lucide-react';

// Interfaces
interface Cliente {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  endereco: {
    cep: string;
    rua: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
  };
  dataNascimento: string;
  profissao: string;
  estadoCivil: 'solteiro' | 'casado' | 'divorciado' | 'viuvo' | 'uniao_estavel';
  observacoes?: string;
  status: 'ativo' | 'inativo' | 'pendente';
  dataAtualizacao: string;
  dataCadastro: string;
}

interface Estatisticas {
  total: number;
  ativos: number;
  pendentes: number;
  inativos: number;
}

type FormDataCliente = Omit<Cliente, 'id' | 'dataAtualizacao' | 'dataCadastro'> & {
  endereco: Omit<Cliente['endereco'], 'complemento'> & {
    complemento: string;
  };
};

export default function ClientesPage() {
  // ✅ USANDO NEXT-AUTH SESSION PARA DETECTAR USUÁRIO LOGADO
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // ✅ LÓGICA HÍBRIDA SEGURA: MVP (Owner) + SaaS (Isolamento por ID)
  const OWNER_EMAIL = 'marvincosta321@gmail.com';
  const isOwnerMVP = session?.user?.email === OWNER_EMAIL;
  const clientId = isOwnerMVP 
    ? OWNER_EMAIL                // MVP: Acesso exclusivo do owner
    : session?.user?.id;         // SaaS: Isolamento real por user ID

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [estatisticas, setEstatisticas] = useState<Estatisticas>({
    total: 0,
    ativos: 0,
    pendentes: 0,
    inativos: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'view' | 'edit' | 'create'>('view');
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados do formulário
  const [formData, setFormData] = useState<FormDataCliente>({
    nome: '',
    cpf: '',
    telefone: '',
    email: '',
    endereco: {
      cep: '',
      rua: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: ''
    },
    dataNascimento: '',
    profissao: '',
    estadoCivil: 'solteiro',
    observacoes: '',
    status: 'ativo'
  });

  // ✅ GUARD DE SEGURANÇA - Redireciona se não autorizado
  useEffect(() => {
    if (status === 'loading') return; // Aguarda carregar sessão
    
    if (!session?.user) {
      // Sem sessão = redireciona para login
      router.push('/auth/advogado/signin');
      return;
    }
    
    if (!isOwnerMVP && !session.user.id) {
      // Usuário SaaS sans ID válido = redireciona
      router.push('/auth/advogado/signin');
      return;
    }
  }, [session, status, router, isOwnerMVP]);

  // Carregar clientes com isolamento seguro
  const fetchClientes = useCallback(async () => {
    if (!clientId) return;
    
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      // ✅ ISOLAMENTO: Sempre passa clientId para filtrar dados
      params.append('clientId', clientId);
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'todos') params.append('status', statusFilter);

      const response = await fetch(`/api/clientes?${params}`);
      const data = await response.json();

      if (data.sucesso) {
        setClientes(data.clientes);
        setEstatisticas(data.estatisticas);
      } else {
        toast.error(data.error || 'Erro ao carregar clientes.');
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast.error('Erro de conexão ao carregar clientes.');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, statusFilter, clientId]);

  useEffect(() => {
    if (clientId) {
      fetchClientes();
    }
  }, [searchTerm, statusFilter, fetchClientes, clientId]);

  // Funções de manipulação do Modal
  const handleOpenModal = (type: 'view' | 'edit' | 'create', cliente?: Cliente) => {
    setModalType(type);
    if (cliente) {
      setSelectedCliente(cliente);
      setFormData({
        nome: cliente.nome,
        cpf: cliente.cpf,
        telefone: cliente.telefone,
        email: cliente.email,
        endereco: {
          ...cliente.endereco,
          complemento: cliente.endereco.complemento || '',
        }, 
        dataNascimento: cliente.dataNascimento,
        profissao: cliente.profissao,
        estadoCivil: cliente.estadoCivil, 
        observacoes: cliente.observacoes || '',
        status: cliente.status 
      });
    } else {
      setSelectedCliente(null);
      setFormData({
        nome: '', cpf: '', telefone: '', email: '',
        endereco: { cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' },
        dataNascimento: '', profissao: '', estadoCivil: 'solteiro', observacoes: '', status: 'ativo'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCliente(null);
    setModalType('view');
    setFormData({
      nome: '', cpf: '', telefone: '', email: '',
      endereco: { cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' },
      dataNascimento: '', profissao: '', estadoCivil: 'solteiro', observacoes: '', status: 'ativo'
    });
  };

  // Manipulador de mudança de input do formulário
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('endereco.')) {
      const enderecoField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        endereco: {
          ...prev.endereco,
          [enderecoField]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Funções de formatação de input (máscaras)
  const formatInputCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    let formatted = cleaned;
    if (cleaned.length > 3) formatted = `${cleaned.substring(0, 3)}.${cleaned.substring(3)}`;
    if (cleaned.length > 6) formatted = `${formatted.substring(0, 7)}.${cleaned.substring(6)}`;
    if (cleaned.length > 9) formatted = `${formatted.substring(0, 11)}-${cleaned.substring(9)}`;
    return formatted.substring(0, 14);
  };

  const formatInputPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    let formatted = cleaned;
    if (cleaned.length > 0) formatted = `(${cleaned.substring(0, 2)}`;
    if (cleaned.length > 2) formatted = `${formatted}) ${cleaned.substring(2)}`;
    if (cleaned.length > 7) formatted = `${formatted.substring(0, 10)}-${cleaned.substring(7)}`;
    return formatted.substring(0, 15);
  };

  const formatInputCEP = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    let formatted = cleaned;
    if (cleaned.length > 5) formatted = `${cleaned.substring(0, 5)}-${cleaned.substring(5)}`;
    return formatted.substring(0, 9);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return;
    
    setIsSubmitting(true);

    if (!formData.nome || !formData.cpf || !formData.telefone || !formData.email || !formData.endereco.cep || !formData.endereco.rua || !formData.endereco.numero || !formData.endereco.bairro || !formData.endereco.cidade || !formData.endereco.estado || !formData.dataNascimento || !formData.profissao || !formData.estadoCivil) {
      toast.error('Por favor, preencha todos os campos obrigatórios.');
      setIsSubmitting(false);
      return;
    }

    try {
      const url = '/api/clientes';
      const method = modalType === 'create' ? 'POST' : 'PUT';
      
      const dataToSend = {
        ...formData,
        // ✅ ISOLAMENTO: Sempre inclui clientId nos dados
        clientId,
        cpf: formData.cpf.replace(/\D/g, ''),
        telefone: formData.telefone.replace(/\D/g, ''),
        email: formData.email.toLowerCase().trim(),
        endereco: {
          ...formData.endereco,
          cep: formData.endereco.cep.replace(/\D/g, ''),
          rua: formData.endereco.rua.trim(),
          numero: formData.endereco.numero.trim(),
          complemento: formData.endereco.complemento?.trim() || '',
          bairro: formData.endereco.bairro.trim(),
          cidade: formData.endereco.cidade.trim(),
          estado: formData.endereco.estado.trim()
        },
        profissao: formData.profissao.trim(),
        observacoes: formData.observacoes?.trim() || ''
      };

      const body = modalType === 'edit' 
        ? { id: selectedCliente?.id, ...dataToSend }
        : dataToSend;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (data.sucesso) {
        toast.success(data.mensagem);
        await fetchClientes();
        handleCloseModal();
      } else {
        toast.error(data.error || 'Erro ao salvar cliente');
      }
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      toast.error('Erro de conexão ao salvar cliente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (cliente: Cliente) => {
    if (!clientId) return;
    
    toast.promise(
      fetch(`/api/clientes?id=${cliente.id}&clientId=${clientId}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
          if (data.sucesso) {
            fetchClientes();
            return data.mensagem;
          } else {
            throw new Error(data.error || 'Erro ao excluir cliente');
          }
        }),
      {
        loading: `Excluindo ${cliente.nome}...`,
        success: (message) => message,
        error: (error) => `Falha: ${error.message}`,
      }
    );
  };

  // Utilitários de formatação de exibição
  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatPhone = (phone: string) => {
    if (phone.length === 11) {
      return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return '#22c55e';
      case 'inativo': return '#ef4444';
      case 'pendente': return '#f97316';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ativo': return <CheckCircle className="w-4 h-4" />;
      case 'inativo': return <X className="w-4 h-4" />;
      case 'pendente': return <Clock className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  // ✅ LOADING STATE - Aguarda verificação de sessão
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#000000] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#b0825a] mx-auto mb-4"></div>
          <p className="text-[#d4d4d4]">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  // ✅ GUARD - Se chegou aqui, usuário está autorizado
  if (!session?.user || (!isOwnerMVP && !session.user.id)) {
    return null; // useEffect já está redirecionando
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
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Botão Voltar */}
            <Link 
              href={isOwnerMVP ? "/dashboard" : "/dashboard/leads/advogado"}
              className="flex items-center px-4 py-2 bg-[#2a2a2a] border border-[#6e6d6b] rounded-lg transition-all duration-300 transform hover:scale-105 hover:opacity-90 group"
            >
              <ArrowLeft className="w-4 h-4 mr-2 text-[#d4d4d4] group-hover:text-white transition-colors" style={{ opacity: 0.7 }} />
              <span className="text-[#d4d4d4] group-hover:text-white text-sm font-medium">Dashboard</span>
            </Link>

            {/* ✅ LOGO CENTRALIZADA */}
            <div className="flex items-center justify-center flex-1 mx-4">
              <Scale className="w-6 h-6 text-[#b0825a] mr-2" style={{ opacity: 0.7 }} />
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#b0825a] text-shadow-lg">
                IAJURIS
              </h1>
              <Gavel className="w-6 h-6 text-[#b0825a] ml-2" style={{ opacity: 0.7 }} />
            </div>

            {/* Estatísticas + Indicador de Modo */}
            <div className="hidden lg:flex items-center space-x-4">
              {/* Estatísticas rápidas */}
              <div className="flex items-center space-x-4 px-4 py-2 rounded-xl border"
                   style={{ 
                     backgroundColor: 'rgba(176, 130, 90, 0.1)',
                     borderColor: 'rgba(176, 130, 90, 0.2)'
                   }}>
                <BarChart3 className="h-5 w-5" style={{ color: '#b0825a' }} />
                <div className="text-sm">
                  <span className="text-white font-medium">{estatisticas.total}</span>
                  <span className="text-[#d4d4d4] ml-1">clientes</span>
                </div>
              </div>

              {/* ✅ INDICADOR DE MODO - Apenas para desenvolvimento */}
              {process.env.NODE_ENV === 'development' && (
                <div className="flex items-center space-x-2 px-3 py-2 rounded-lg text-xs"
                     style={{ 
                       backgroundColor: isOwnerMVP ? 'rgba(34, 197, 94, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                       borderColor: isOwnerMVP ? 'rgba(34, 197, 94, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                       border: '1px solid'
                     }}>
                  <User className="h-3 w-3" style={{ color: isOwnerMVP ? '#22c55e' : '#3b82f6' }} />
                  <span className="text-[#d4d4d4]">
                    {isOwnerMVP ? 'MVP Owner' : `SaaS: ${session.user.name || 'User'}`}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Título da Página */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-b border-[#6e6d6b] border-opacity-20"
           style={{ backgroundColor: 'rgba(20, 20, 20, 0.8)' }}>
          <div className="flex items-center justify-center">
            <Users className="w-6 sm:w-8 h-6 sm:h-8 text-[#b0825a] mr-3" style={{ opacity: 0.7 }} />
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">Gestão de Clientes</h2>
          </div>
          <div className="mx-auto mt-4 h-0.5 w-24 bg-gradient-to-r from-transparent via-[#b0825a] to-transparent" />
          <p className="text-center mt-2 text-[#d4d4d4] text-sm">
            Controle completo da sua carteira de clientes
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Card Principal */}
          <div className="rounded-2xl p-6 shadow-2xl mb-8"
               style={{ 
                 backgroundColor: 'rgba(20, 20, 20, 0.8)',
                 border: '1px solid rgba(176, 130, 90, 0.2)',
                 backdropFilter: 'blur(8px)',
                 boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
               }}>
            
            <div className="flex items-center justify-between mb-6">
              {/* Botão Novo Cliente */}
              <button
                onClick={() => handleOpenModal('create')}
                className="flex items-center px-6 py-2 rounded-xl border transition-all duration-300 transform hover:scale-105"
                style={{ 
                  backgroundColor: 'rgba(176, 130, 90, 0.3)',
                  borderColor: 'rgba(176, 130, 90, 0.2)',
                  boxShadow: '0 10px 25px rgba(176, 130, 90, 0.3)'
                }}
              >
                <Plus className="w-5 h-5 text-white mr-2" />
                <span className="text-white font-medium">Novo Cliente</span>
              </button>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-xl backdrop-blur-sm border text-center"
                   style={{ 
                     backgroundColor: 'rgba(20, 20, 20, 0.6)',
                     borderColor: 'rgba(176, 130, 90, 0.2)'
                   }}>
                <div className="text-2xl font-bold mb-1" style={{ color: '#b0825a' }}>
                  {isLoading ? '...' : estatisticas.total}
                </div>
                <div className="text-sm text-[#d4d4d4]">Total</div>
              </div>
              
              <div className="p-4 rounded-xl backdrop-blur-sm border text-center"
                   style={{ 
                     backgroundColor: 'rgba(20, 20, 20, 0.6)',
                     borderColor: 'rgba(34, 197, 94, 0.2)'
                   }}>
                <div className="text-2xl font-bold mb-1 text-green-400">
                  {isLoading ? '...' : estatisticas.ativos}
                </div>
                <div className="text-sm text-[#d4d4d4]">Ativos</div>
              </div>
              
              <div className="p-4 rounded-xl backdrop-blur-sm border text-center"
                   style={{ 
                     backgroundColor: 'rgba(20, 20, 20, 0.6)',
                     borderColor: 'rgba(249, 115, 22, 0.2)'
                   }}>
                <div className="text-2xl font-bold mb-1 text-orange-400">
                  {isLoading ? '...' : estatisticas.pendentes}
                </div>
                <div className="text-sm text-[#d4d4d4]">Pendentes</div>
              </div>
              
              <div className="p-4 rounded-xl backdrop-blur-sm border text-center"
                   style={{ 
                     backgroundColor: 'rgba(20, 20, 20, 0.6)',
                     borderColor: 'rgba(239, 68, 68, 0.2)'
                   }}>
                <div className="text-2xl font-bold mb-1 text-red-400">
                  {isLoading ? '...' : estatisticas.inativos}
                </div>
                <div className="text-sm text-[#d4d4d4]">Inativos</div>
              </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Busca */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#d4d4d4]" style={{ opacity: 0.7 }} />
                <input
                  type="text"
                  placeholder="Buscar por nome, CPF, telefone ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border bg-[#2a2a2a] text-white placeholder-[#d4d4d4] focus:outline-none focus:ring-2 focus:ring-[#b0825a]"
                  style={{ 
                    borderColor: 'rgba(176, 130, 90, 0.3)',
                    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </div>

              {/* Filtro Status */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#d4d4d4]" style={{ opacity: 0.7 }} />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 pr-8 py-3 rounded-xl border bg-[#2a2a2a] text-white focus:outline-none focus:ring-2 focus:ring-[#b0825a] appearance-none cursor-pointer"
                  style={{ 
                    borderColor: 'rgba(176, 130, 90, 0.3)',
                    minWidth: '160px'
                  }}>
                  <option value="todos">Todos Status</option>
                  <option value="ativo">Ativos</option>
                  <option value="pendente">Pendentes</option>
                  <option value="inativo">Inativos</option>
                </select>
              </div>
            </div>
          </div>

          {/* Lista de Clientes */}
          <div className="mt-8">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#b0825a]"></div>
                <p className="mt-4 text-[#d4d4d4]">Carregando clientes...</p>
              </div>
            ) : clientes.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto mb-4 text-[#6e6d6b]" />
                <p className="text-xl text-[#d4d4d4] mb-2">Nenhum cliente encontrado</p>
                <p className="text-[#6e6d6b]">
                  {searchTerm || statusFilter !== 'todos' 
                    ? 'Tente ajustar os filtros de busca'
                    : 'Comece cadastrando seu primeiro cliente'
                  }
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {clientes.map((cliente) => (
                  <div key={cliente.id}
                       className="p-6 rounded-2xl backdrop-blur-sm border shadow-lg transition-all duration-300 hover:scale-[1.02]"
                       style={{ 
                         backgroundColor: 'rgba(20, 20, 20, 0.8)',
                         borderColor: 'rgba(176, 130, 90, 0.2)'
                       }}>
                    
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      {/* Info Principal */}
                      <div className="flex items-center space-x-4 flex-grow min-w-[280px]">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                             style={{ backgroundColor: 'rgba(176, 130, 90, 0.2)' }}>
                          <User className="w-6 h-6" style={{ color: '#b0825a' }} />
                        </div>

                        {/* Dados */}
                        <div className="flex-grow">
                          <h3 className="text-xl font-bold text-white mb-1">{cliente.nome}</h3>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#d4d4d4]">
                            <span>{formatCPF(cliente.cpf)}</span>
                            <span className="flex items-center">
                              <Phone className="w-4 h-4 mr-1" />
                              {formatPhone(cliente.telefone)}
                            </span>
                            <span className="flex items-center">
                              <Mail className="w-4 h-4 mr-1" />
                              {cliente.email}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status e Ações */}
                      <div className="flex items-center space-x-4 flex-shrink-0">
                        {/* Status */}
                        <div className="flex items-center px-3 py-1 rounded-full text-sm font-medium"
                             style={{ 
                               backgroundColor: `${getStatusColor(cliente.status)}20`,
                               color: getStatusColor(cliente.status)
                             }}>
                          {getStatusIcon(cliente.status)}
                          <span className="ml-1 capitalize">{cliente.status}</span>
                        </div>

                        {/* Ações */}
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleOpenModal('view', cliente)}
                            className="p-2 rounded-lg transition-colors duration-200 hover:bg-blue-600/20"
                            title="Visualizar"
                          >
                            <Eye className="w-5 h-5 text-blue-400" />
                          </button>
                          
                          <button
                            onClick={() => handleOpenModal('edit', cliente)}
                            className="p-2 rounded-lg transition-colors duration-200 hover:bg-yellow-600/20"
                            title="Editar"
                          >
                            <Edit className="w-5 h-5 text-yellow-400" />
                          </button>
                          
                          <button
                            onClick={() => handleDelete(cliente)}
                            className="p-2 rounded-lg transition-colors duration-200 hover:bg-red-600/20"
                            title="Excluir"
                          >
                            <Trash2 className="w-5 h-5 text-red-400" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Info Adicional */}
                    <div className="mt-4 pt-4 border-t border-[#6e6d6b] border-opacity-30">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-[#d4d4d4]">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-[#6e6d6b]" />
                          <span>{cliente.endereco.cidade}, {cliente.endereco.estado}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-[#6e6d6b]" />
                          <span>Nascimento: {cliente.dataNascimento ? new Date(cliente.dataNascimento).toLocaleDateString('pt-BR') : 'N/A'}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2 text-[#6e6d6b]" />
                          <span>{cliente.profissao || 'Não informado'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="rounded-2xl border w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar"
               style={{ 
                 backgroundColor: 'rgba(20, 20, 20, 0.95)',
                 borderColor: 'rgba(176, 130, 90, 0.3)'
               }}>
            {/* Header do Modal */}
            <div className="flex items-center justify-between p-6 border-b border-[#6e6d6b] border-opacity-30">
              <h2 className="text-2xl font-bold text-white">
                {modalType === 'create' ? 'Novo Cliente' : 
                 modalType === 'edit' ? 'Editar Cliente' : 'Detalhes do Cliente'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 rounded-lg hover:bg-[#2a2a2a] transition-colors"
              >
                <X className="w-6 h-6 text-[#d4d4d4]" />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-6">
              {modalType === 'view' ? (
                // Visualização de Cliente
                <div className="space-y-6">
                  {/* Dados Pessoais */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <User className="w-5 h-5 mr-2" style={{ color: '#b0825a' }} />
                      Dados Pessoais
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#d4d4d4] mb-1">Nome</label>
                        <p className="text-white bg-[#2a2a2a] px-3 py-2 rounded-lg">{selectedCliente?.nome}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-[#d4d4d4] mb-1">CPF</label>
                        <p className="text-white bg-[#2a2a2a] px-3 py-2 rounded-lg">{formatCPF(selectedCliente?.cpf || '')}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-[#d4d4d4] mb-1">Telefone</label>
                        <p className="text-white bg-[#2a2a2a] px-3 py-2 rounded-lg">{formatPhone(selectedCliente?.telefone || '')}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-[#d4d4d4] mb-1">Email</label>
                        <p className="text-white bg-[#2a2a2a] px-3 py-2 rounded-lg">{selectedCliente?.email}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-[#d4d4d4] mb-1">Data de Nascimento</label>
                        <p className="text-white bg-[#2a2a2a] px-3 py-2 rounded-lg">
                          {selectedCliente?.dataNascimento ? new Date(selectedCliente.dataNascimento).toLocaleDateString('pt-BR') : 'N/A'}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-[#d4d4d4] mb-1">Profissão</label>
                        <p className="text-white bg-[#2a2a2a] px-3 py-2 rounded-lg">{selectedCliente?.profissao || 'Não informado'}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-[#d4d4d4] mb-1">Estado Civil</label>
                        <p className="text-white bg-[#2a2a2a] px-3 py-2 rounded-lg capitalize">
                          {selectedCliente?.estadoCivil?.replace('_', ' ') || 'Não informado'}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-[#d4d4d4] mb-1">Status</label>
                        <div className="flex items-center px-3 py-2 rounded-lg bg-[#2a2a2a]">
                          <span className="flex items-center text-white capitalize">
                            {selectedCliente?.status && getStatusIcon(selectedCliente.status)}
                            <span className="ml-2">{selectedCliente?.status}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Endereço */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <MapPin className="w-5 h-5 mr-2" style={{ color: '#b0825a' }} />
                      Endereço
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#d4d4d4] mb-1">CEP</label>
                        <p className="text-white bg-[#2a2a2a] px-3 py-2 rounded-lg">{selectedCliente?.endereco.cep || 'N/A'}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-[#d4d4d4] mb-1">Rua</label>
                        <p className="text-white bg-[#2a2a2a] px-3 py-2 rounded-lg">{selectedCliente?.endereco.rua || 'N/A'}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-[#d4d4d4] mb-1">Número</label>
                        <p className="text-white bg-[#2a2a2a] px-3 py-2 rounded-lg">{selectedCliente?.endereco.numero || 'N/A'}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-[#d4d4d4] mb-1">Complemento</label>
                        <p className="text-white bg-[#2a2a2a] px-3 py-2 rounded-lg">{selectedCliente?.endereco.complemento || '-'}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-[#d4d4d4] mb-1">Bairro</label>
                        <p className="text-white bg-[#2a2a2a] px-3 py-2 rounded-lg">{selectedCliente?.endereco.bairro || 'N/A'}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-[#d4d4d4] mb-1">Cidade</label>
                        <p className="text-white bg-[#2a2a2a] px-3 py-2 rounded-lg">{selectedCliente?.endereco.cidade || 'N/A'}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-[#d4d4d4] mb-1">Estado</label>
                        <p className="text-white bg-[#2a2a2a] px-3 py-2 rounded-lg">{selectedCliente?.endereco.estado || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Observações */}
                  {selectedCliente?.observacoes && (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Observações</h3>
                      <p className="text-white bg-[#2a2a2a] px-3 py-2 rounded-lg">{selectedCliente.observacoes}</p>
                    </div>
                  )}

                  {/* Datas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-[#d4d4d4]">
                    <div>
                      <label className="block font-medium mb-1">Data de Cadastro</label>
                      <p className="bg-[#2a2a2a] px-3 py-2 rounded-lg">
                        {selectedCliente?.dataCadastro ? new Date(selectedCliente.dataCadastro).toLocaleDateString('pt-BR') : 'N/A'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block font-medium mb-1">Última Atualização</label>
                      <p className="bg-[#2a2a2a] px-3 py-2 rounded-lg">
                        {selectedCliente?.dataAtualizacao ? new Date(selectedCliente.dataAtualizacao).toLocaleString('pt-BR') : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                // Formulário de Criação/Edição
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Dados Pessoais */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <User className="w-5 h-5 mr-2" style={{ color: '#b0825a' }} />
                      Dados Pessoais
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="nome" className="block text-sm font-medium text-[#d4d4d4] mb-1">Nome Completo <span className="text-red-500">*</span></label>
                        <input
                          type="text" id="nome" name="nome"
                          value={formData.nome} onChange={handleInputChange}
                          className="w-full p-3 rounded-xl border bg-[#2a2a2a] text-white placeholder-[#6e6d6b] focus:outline-none focus:ring-2 focus:ring-[#b0825a]"
                          style={{ borderColor: 'rgba(176, 130, 90, 0.3)' }}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="cpf" className="block text-sm font-medium text-[#d4d4d4] mb-1">CPF <span className="text-red-500">*</span></label>
                        <input
                          type="text" id="cpf" name="cpf"
                          value={formatInputCPF(formData.cpf)} onChange={handleInputChange}
                          className="w-full p-3 rounded-xl border bg-[#2a2a2a] text-white placeholder-[#6e6d6b] focus:outline-none focus:ring-2 focus:ring-[#b0825a]"
                          style={{ borderColor: 'rgba(176, 130, 90, 0.3)' }}
                          maxLength={14}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="telefone" className="block text-sm font-medium text-[#d4d4d4] mb-1">Telefone <span className="text-red-500">*</span></label>
                        <input
                          type="text" id="telefone" name="telefone"
                          value={formatInputPhone(formData.telefone)} onChange={handleInputChange}
                          className="w-full p-3 rounded-xl border bg-[#2a2a2a] text-white placeholder-[#6e6d6b] focus:outline-none focus:ring-2 focus:ring-[#b0825a]"
                          style={{ borderColor: 'rgba(176, 130, 90, 0.3)' }}
                          maxLength={15}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-[#d4d4d4] mb-1">Email <span className="text-red-500">*</span></label>
                        <input
                          type="email" id="email" name="email"
                          value={formData.email} onChange={handleInputChange}
                          className="w-full p-3 rounded-xl border bg-[#2a2a2a] text-white placeholder-[#6e6d6b] focus:outline-none focus:ring-2 focus:ring-[#b0825a]"
                          style={{ borderColor: 'rgba(176, 130, 90, 0.3)' }}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="dataNascimento" className="block text-sm font-medium text-[#d4d4d4] mb-1">Data de Nascimento <span className="text-red-500">*</span></label>
                        <input
                          type="date" id="dataNascimento" name="dataNascimento"
                          value={formData.dataNascimento} onChange={handleInputChange}
                          className="w-full p-3 rounded-xl border bg-[#2a2a2a] text-white focus:outline-none focus:ring-2 focus:ring-[#b0825a]"
                          style={{ borderColor: 'rgba(176, 130, 90, 0.3)' }}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="profissao" className="block text-sm font-medium text-[#d4d4d4] mb-1">Profissão <span className="text-red-500">*</span></label>
                        <input
                          type="text" id="profissao" name="profissao"
                          value={formData.profissao} onChange={handleInputChange}
                          className="w-full p-3 rounded-xl border bg-[#2a2a2a] text-white placeholder-[#6e6d6b] focus:outline-none focus:ring-2 focus:ring-[#b0825a]"
                          style={{ borderColor: 'rgba(176, 130, 90, 0.3)' }}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="estadoCivil" className="block text-sm font-medium text-[#d4d4d4] mb-1">Estado Civil <span className="text-red-500">*</span></label>
                        <select
                          id="estadoCivil" name="estadoCivil"
                          value={formData.estadoCivil} onChange={handleInputChange}
                          className="w-full p-3 rounded-xl border bg-[#2a2a2a] text-white focus:outline-none focus:ring-2 focus:ring-[#b0825a] appearance-none cursor-pointer"
                          style={{ borderColor: 'rgba(176, 130, 90, 0.3)' }}
                          required
                        >
                          <option value="solteiro">Solteiro(a)</option>
                          <option value="casado">Casado(a)</option>
                          <option value="divorciado">Divorciado(a)</option>
                          <option value="viuvo">Viúvo(a)</option>
                          <option value="uniao_estavel">União Estável</option>
                        </select>
                      </div>
                      {modalType === 'edit' && (
                        <div>
                          <label htmlFor="status" className="block text-sm font-medium text-[#d4d4d4] mb-1">Status <span className="text-red-500">*</span></label>
                          <select
                            id="status" name="status"
                            value={formData.status} onChange={handleInputChange}
                            className="w-full p-3 rounded-xl border bg-[#2a2a2a] text-white focus:outline-none focus:ring-2 focus:ring-[#b0825a] appearance-none cursor-pointer"
                            style={{ borderColor: 'rgba(176, 130, 90, 0.3)' }}
                            required
                          >
                            <option value="ativo">Ativo</option>
                            <option value="inativo">Inativo</option>
                            <option value="pendente">Pendente</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Endereço */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <MapPin className="w-5 h-5 mr-2" style={{ color: '#b0825a' }} />
                      Endereço
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="endereco.cep" className="block text-sm font-medium text-[#d4d4d4] mb-1">CEP <span className="text-red-500">*</span></label>
                        <input
                          type="text" id="endereco.cep" name="endereco.cep"
                          value={formatInputCEP(formData.endereco.cep)} onChange={handleInputChange}
                          className="w-full p-3 rounded-xl border bg-[#2a2a2a] text-white placeholder-[#6e6d6b] focus:outline-none focus:ring-2 focus:ring-[#b0825a]"
                          style={{ borderColor: 'rgba(176, 130, 90, 0.3)' }}
                          maxLength={9}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="endereco.rua" className="block text-sm font-medium text-[#d4d4d4] mb-1">Rua <span className="text-red-500">*</span></label>
                        <input
                          type="text" id="endereco.rua" name="endereco.rua"
                          value={formData.endereco.rua} onChange={handleInputChange}
                          className="w-full p-3 rounded-xl border bg-[#2a2a2a] text-white placeholder-[#6e6d6b] focus:outline-none focus:ring-2 focus:ring-[#b0825a]"
                          style={{ borderColor: 'rgba(176, 130, 90, 0.3)' }}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="endereco.numero" className="block text-sm font-medium text-[#d4d4d4] mb-1">Número <span className="text-red-500">*</span></label>
                        <input
                          type="text" id="endereco.numero" name="endereco.numero"
                          value={formData.endereco.numero} onChange={handleInputChange}
                          className="w-full p-3 rounded-xl border bg-[#2a2a2a] text-white placeholder-[#6e6d6b] focus:outline-none focus:ring-2 focus:ring-[#b0825a]"
                          style={{ borderColor: 'rgba(176, 130, 90, 0.3)' }}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="endereco.complemento" className="block text-sm font-medium text-[#d4d4d4] mb-1">Complemento</label>
                        <input
                          type="text" id="endereco.complemento" name="endereco.complemento"
                          value={formData.endereco.complemento} onChange={handleInputChange}
                          className="w-full p-3 rounded-xl border bg-[#2a2a2a] text-white placeholder-[#6e6d6b] focus:outline-none focus:ring-2 focus:ring-[#b0825a]"
                          style={{ borderColor: 'rgba(176, 130, 90, 0.3)' }}
                        />
                      </div>
                      <div>
                        <label htmlFor="endereco.bairro" className="block text-sm font-medium text-[#d4d4d4] mb-1">Bairro <span className="text-red-500">*</span></label>
                        <input
                          type="text" id="endereco.bairro" name="endereco.bairro"
                          value={formData.endereco.bairro} onChange={handleInputChange}
                          className="w-full p-3 rounded-xl border bg-[#2a2a2a] text-white placeholder-[#6e6d6b] focus:outline-none focus:ring-2 focus:ring-[#b0825a]"
                          style={{ borderColor: 'rgba(176, 130, 90, 0.3)' }}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="endereco.cidade" className="block text-sm font-medium text-[#d4d4d4] mb-1">Cidade <span className="text-red-500">*</span></label>
                        <input
                          type="text" id="endereco.cidade" name="endereco.cidade"
                          value={formData.endereco.cidade} onChange={handleInputChange}
                          className="w-full p-3 rounded-xl border bg-[#2a2a2a] text-white placeholder-[#6e6d6b] focus:outline-none focus:ring-2 focus:ring-[#b0825a]"
                          style={{ borderColor: 'rgba(176, 130, 90, 0.3)' }}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="endereco.estado" className="block text-sm font-medium text-[#d4d4d4] mb-1">Estado (UF) <span className="text-red-500">*</span></label>
                        <input
                          type="text" id="endereco.estado" name="endereco.estado"
                          value={formData.endereco.estado} onChange={handleInputChange}
                          className="w-full p-3 rounded-xl border bg-[#2a2a2a] text-white placeholder-[#6e6d6b] focus:outline-none focus:ring-2 focus:ring-[#b0825a]"
                          style={{ borderColor: 'rgba(176, 130, 90, 0.3)' }}
                          maxLength={2}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Observações */}
                  <div>
                    <label htmlFor="observacoes" className="block text-sm font-medium text-[#d4d4d4] mb-1">Observações</label>
                    <textarea
                      id="observacoes" name="observacoes"
                      value={formData.observacoes} onChange={handleInputChange}
                      rows={3}
                      className="w-full p-3 rounded-xl border bg-[#2a2a2a] text-white placeholder-[#6e6d6b] focus:outline-none focus:ring-2 focus:ring-[#b0825a] resize-y"
                      style={{ borderColor: 'rgba(176, 130, 90, 0.3)' }}
                    />
                  </div>

                  {/* Botão de Submit */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                    style={{
                      backgroundColor: 'rgba(176, 130, 90, 0.8)',
                      boxShadow: '0 10px 25px rgba(176, 130, 90, 0.3)',
                      color: '#ffffff',
                      borderColor: 'rgba(176, 130, 90, 0.2)',
                      border: '1px solid'
                    }}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Salvando...
                      </div>
                    ) : (
                      modalType === 'create' ? 'Cadastrar Cliente' : 'Atualizar Cliente'
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

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

        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(40, 40, 40, 0.8);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #b0825a;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #8b6942;
        }
      `}</style>
    </div>
  );
}
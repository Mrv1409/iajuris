'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import { 
  Scale, 
  ArrowLeft, 
  Receipt, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Edit, 
  Trash2,
  AlertTriangle,
  Calendar,//eslint-disable-next-line
  Clock,
  User,
  Building
} from 'lucide-react';

// Definições das interfaces (mantidas neste arquivo para compatibilidade)
export interface FinanceiroRecibos {
  id: string;
  clienteId: string;
  clienteNome: string;
  cpfCnpj: string;
  endereco: string;
  numeroRecibo: string;
  servicos: Array<{ descricao: string; valor: number; }>;
  valorTotal: number;
  dataEmissao: string; // Permitindo timestamp do Firebase ou string
  status: 'emitido' | 'cancelado';
  observacoes?: string;
  profissionalNome?: string; // ✅ NOVO CAMPO
  escritorioNome?: string; // ✅ NOVO CAMPO
  createdAt: string; // Permitindo timestamp do Firebase ou string
   // Permitindo timestamp do Firebase ou string
}

export interface ReciboApiData {
  clienteId: string;
  clienteNome: string;
  cpfCnpj: string;
  endereco: string;
  servicos: Array<{ descricao: string; valor: number; }>;
  valorTotal: number;
  dataEmissao: string; // String para envio via API
  status: 'emitido' | 'cancelado';
  observacoes?: string;
  profissionalNome?: string; // ✅ NOVO CAMPO
  escritorioNome?: string; // ✅ NOVO CAMPO
}

// Interface para o estado do formulário
interface ReciboFormState {
  clienteNome: string;
  cpfCnpj: string;
  endereco: string;
  descricaoServico: string;
  valorServico: string;
  dataEmissao: string;
  status: 'emitido' | 'cancelado';
  observacoes: string;
  profissionalNome: string; // ✅ NOVO CAMPO
  escritorioNome: string; // ✅ NOVO CAMPO
}

export default function RecibosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [recibos, setRecibos] = useState<FinanceiroRecibos[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [reciboToDelete, setReciboToDelete] = useState<string | null>(null);
  const [editingRecibo, setEditingRecibo] = useState<FinanceiroRecibos | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos'); // 'todos', 'emitido', 'cancelado'

  // Form state
  const [formData, setFormData] = useState<ReciboFormState>({
    clienteNome: '',
    cpfCnpj: '',
    endereco: '',
    descricaoServico: '',
    valorServico: '',
    dataEmissao: new Date().toISOString().split('T')[0],
    status: 'emitido',
    observacoes: '',
    profissionalNome: '', // ✅ NOVO CAMPO
    escritorioNome: '' // ✅ NOVO CAMPO
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
      fetchRecibos();
    } else {
      setIsLoading(false);
    }//eslint-disable-next-line
  }, [session]);

  const fetchRecibos = async () => {
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

      const response = await fetch(`/api/financeiro/recibos?clientId=${encodeURIComponent(clientId)}`);
      const result = await response.json();

      if (result.sucesso) {
        // ✅ CORREÇÃO DO TIMESTAMP - Formatação correta dos recibos
        //eslint-disable-next-line
        const recibosFormatados = result.recibos.map((recibo: any) => ({
          ...recibo,
          dataEmissao: recibo.dataEmissao?.toDate ? 
            recibo.dataEmissao.toDate().toISOString().split('T')[0] : 
            recibo.dataEmissao,
          createdAt: recibo.createdAt?.toDate ? 
            recibo.createdAt.toDate().toISOString() : 
            recibo.createdAt,
          updatedAt: recibo.updatedAt?.toDate ? 
            recibo.updatedAt.toDate().toISOString() : 
            recibo.updatedAt
        }));
        setRecibos(recibosFormatados);
      } else {
        console.error('Erro ao buscar recibos:', result.error);
      }
    } catch (error) {
      console.error('Erro ao buscar recibos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.email || !session?.user?.id) return;
    
    setIsLoading(true);

    try {
      const valorNumerico = parseFloat(formData.valorServico);
      if (isNaN(valorNumerico)) {
        console.error('Valor do serviço inválido.');
        setIsLoading(false);
        return;
      }

      // ✅ ISOLAMENTO HÍBRIDO MVP/SaaS - Fórmula de Sucesso
      const OWNER_EMAIL = 'marvincosta321@gmail.com';
      const isOwnerMVP = session?.user?.email === OWNER_EMAIL;
      const clientId = isOwnerMVP ? OWNER_EMAIL : session?.user?.id;

      const reciboData: ReciboApiData = {
        clienteId: clientId, // 🔒 Usa o clientId híbrido seguro
        clienteNome: formData.clienteNome,
        cpfCnpj: formData.cpfCnpj,
        endereco: formData.endereco,
        servicos: [{ descricao: formData.descricaoServico, valor: valorNumerico }],
        valorTotal: valorNumerico,
        dataEmissao: formData.dataEmissao,
        status: formData.status,
        observacoes: formData.observacoes,
        profissionalNome: formData.profissionalNome, // ✅ NOVO CAMPO
        escritorioNome: formData.escritorioNome, // ✅ NOVO CAMPO
      };

      let response;
      if (editingRecibo) {
        // Atualizar recibo existente
        response = await fetch(`/api/financeiro/recibos?id=${editingRecibo.id}&clientId=${encodeURIComponent(clientId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingRecibo.id, ...reciboData })
        });
      } else {
        // Adicionar novo recibo
        response = await fetch(`/api/financeiro/recibos?clientId=${encodeURIComponent(clientId)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reciboData)
        });
      }

      const result = await response.json();

      if (result.sucesso) {
        fetchRecibos();
        setShowModal(false);
        setEditingRecibo(null);
        resetForm();
      } else {
        console.error('Erro ao salvar recibo:', result.error);
      }
    } catch (error) {
      console.error('Erro ao salvar recibo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      clienteNome: '',
      cpfCnpj: '',
      endereco: '',
      descricaoServico: '',
      valorServico: '',
      dataEmissao: new Date().toISOString().split('T')[0],
      status: 'emitido',
      observacoes: '',
      profissionalNome: '', // ✅ NOVO CAMPO
      escritorioNome: '' // ✅ NOVO CAMPO
    });
  };

  const handleEdit = (recibo: FinanceiroRecibos) => {
    setEditingRecibo(recibo);
    setFormData({
      clienteNome: recibo.clienteNome,
      cpfCnpj: recibo.cpfCnpj,
      endereco: recibo.endereco,
      descricaoServico: recibo.servicos[0]?.descricao || '',
      valorServico: recibo.servicos[0]?.valor.toString() || '',
      dataEmissao: recibo.dataEmissao,
      status: recibo.status,
      observacoes: recibo.observacoes || '',
      profissionalNome: recibo.profissionalNome || '', // ✅ NOVO CAMPO
      escritorioNome: recibo.escritorioNome || '' // ✅ NOVO CAMPO
    });
    setShowModal(true);
  };

  const confirmDelete = (id: string) => {
    setReciboToDelete(id);
    setShowConfirmModal(true);
  };

  const handleDelete = async () => {
    if (!reciboToDelete || !session?.user?.email || !session?.user?.id) return;

    setIsLoading(true);
    try {
      // ✅ ISOLAMENTO HÍBRIDO MVP/SaaS - Fórmula de Sucesso
      const OWNER_EMAIL = 'marvincosta321@gmail.com';
      const isOwnerMVP = session?.user?.email === OWNER_EMAIL;
      const clientId = isOwnerMVP ? OWNER_EMAIL : session?.user?.id;

      const response = await fetch(`/api/financeiro/recibos?id=${reciboToDelete}&clientId=${encodeURIComponent(clientId)}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.sucesso) {
        fetchRecibos();
        setShowConfirmModal(false);
        setReciboToDelete(null);
      } else {
        console.error('Erro ao excluir recibo:', result.error);
      }
    } catch (error) {
      console.error('Erro ao excluir recibo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'emitido' | 'cancelado') => {
    if (!session?.user?.email || !session?.user?.id) return;

    setIsLoading(true);
    try {
      // ✅ ISOLAMENTO HÍBRIDO MVP/SaaS - Fórmula de Sucesso
      const OWNER_EMAIL = 'marvincosta321@gmail.com';
      const isOwnerMVP = session?.user?.email === OWNER_EMAIL;
      const clientId = isOwnerMVP ? OWNER_EMAIL : session?.user?.id;

      const response = await fetch(`/api/financeiro/recibos?id=${id}&clientId=${encodeURIComponent(clientId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      const result = await response.json();

      if (result.sucesso) {
        fetchRecibos();
      } else {
        console.error('Erro ao atualizar status:', result.error);
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ FUNCIONALIDADE DE DOWNLOAD EM PDF
  const handleDownloadPDF = (recibo: FinanceiroRecibos) => {
    // Criar documento HTML para impressão/PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Recibo ${recibo.numeroRecibo}</title>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            .header { text-align: center; border-bottom: 2px solid #b0825a; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { color: #b0825a; margin: 0; }
            .header h2 { color: #333; margin: 5px 0; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .info-box { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
            .info-box h3 { margin: 0 0 10px 0; color: #b0825a; border-bottom: 1px solid #eee; padding-bottom: 5px; }
            .services { margin: 30px 0; }
            .services table { width: 100%; border-collapse: collapse; }
            .services th, .services td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            .services th { background-color: #f8f9fa; color: #333; }
            .total { font-size: 1.2em; font-weight: bold; text-align: right; margin: 20px 0; color: #b0825a; }
            .footer { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px; text-align: center; color: #666; }
            @media print { body { margin: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>RECIBO DE PRESTAÇÃO DE SERVIÇOS</h1>
            <h2>Número: ${recibo.numeroRecibo}</h2>
            <p><strong>Data de Emissão:</strong> ${formatDate(recibo.dataEmissao)}</p>
          </div>
          
          <div class="info-grid">
            <div class="info-box">
              <h3>💼 Profissional/Escritório</h3>
              <p><strong>Profissional:</strong> ${recibo.profissionalNome || 'Não informado'}</p>
              <p><strong>Escritório:</strong> ${recibo.escritorioNome || 'Não informado'}</p>
            </div>
            
            <div class="info-box">
              <h3>👤 Cliente</h3>
              <p><strong>Nome:</strong> ${recibo.clienteNome}</p>
              <p><strong>CPF/CNPJ:</strong> ${recibo.cpfCnpj}</p>
              <p><strong>Endereço:</strong> ${recibo.endereco}</p>
            </div>
          </div>
          
          <div class="services">
            <h3>📋 Serviços Prestados</h3>
            <table>
              <thead>
                <tr>
                  <th>Descrição do Serviço</th>
                  <th style="width: 150px;">Valor (R$)</th>
                </tr>
              </thead>
              <tbody>
                ${recibo.servicos.map(servico => `
                  <tr>
                    <td>${servico.descricao}</td>
                    <td>${formatCurrency(servico.valor)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="total">
            <p>VALOR TOTAL: ${formatCurrency(recibo.valorTotal)}</p>
          </div>
          
          ${recibo.observacoes ? `
            <div class="info-box">
              <h3>📝 Observações</h3>
              <p>${recibo.observacoes}</p>
            </div>
          ` : ''}
          
          <div class="footer">
            <p>Este é um documento gerado automaticamente pelo sistema de gestão.</p>
            <p>Status: <strong>${recibo.status === 'emitido' ? 'EMITIDO' : 'CANCELADO'}</strong></p>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // ✅ CORREÇÃO DO FORMATDATE - Tratamento correto para timestamps do Firebase
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
          <p style={{ color: '#d4d4d4' }}>Faça login para acessar a Gestão de Recibos</p>
        </div>
      </main>
    );
  }

  const filteredRecibos = recibos.filter(recibo => {
    const matchesSearch = recibo.clienteNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          recibo.numeroRecibo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          recibo.servicos[0]?.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'todos' || recibo.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  
  //eslint-disable-next-line
  const valorTotal = recibos.reduce((sum, r) => sum + r.valorTotal, 0);
  const valorEmitido = recibos.filter(r => r.status === 'emitido').reduce((sum, r) => sum + r.valorTotal, 0);

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
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-white text-center">GESTÃO DE RECIBOS</h1>
              <Receipt className="w-6 sm:w-8 h-6 sm:h-8 ml-2 sm:ml-3 opacity-70" style={{ color: '#b0825a' }} />
            </div>

            <button
              onClick={() => {
                setEditingRecibo(null);
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
              Emita e gerencie recibos profissionais
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto">
          {/* Cards de Estatísticas - RESPONSIVO MELHORADO */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
            <div className="p-3 sm:p-4 rounded-2xl backdrop-blur-sm border"
                 style={{ 
                   backgroundColor: 'rgba(26, 26, 26, 0.8)',
                   borderColor: '#6e6d6b',
                   boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
                 }}>
              <h3 className="text-xs sm:text-sm font-medium mb-1" style={{ color: '#d4d4d4' }}>Valor Emitido</h3>
              <p className="text-sm sm:text-xl font-bold" style={{ color: '#22c55e' }}>
                {formatCurrency(valorEmitido)}
              </p>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl backdrop-blur-sm border"
                 style={{ 
                   backgroundColor: 'rgba(26, 26, 26, 0.8)',
                   borderColor: '#6e6d6b',
                   boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
                 }}>
              <h3 className="text-xs sm:text-sm font-medium mb-1" style={{ color: '#d4d4d4' }}>Último Recibo</h3>
              <p className="text-sm sm:text-lg font-bold" style={{ color: '#d4d4d4' }}>
                {recibos.length > 0 ? recibos[0]?.numeroRecibo : '-'}
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
                  placeholder="Buscar por cliente, número ou serviço..."
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
                  <option value="emitido" style={{ backgroundColor: '#2a2a2a' }}>Emitido</option>
                  <option value="cancelado" style={{ backgroundColor: '#2a2a2a' }}>Cancelado</option>
                </select>
              </div>
            </div>
          </div>

          {/* Lista de Recibos - TABELA RESPONSIVA MELHORADA */}
          <div className="p-4 sm:p-6 rounded-2xl backdrop-blur-sm border"
               style={{ 
                 backgroundColor: 'rgba(26, 26, 26, 0.8)',
                 borderColor: '#6e6d6b',
                 boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
               }}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-white">
                Recibos ({filteredRecibos.length})
              </h3>
            </div>
            
            {/* Tabela Responsiva */}
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <div className="min-w-full inline-block align-middle">
                <div className="overflow-hidden">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b" style={{ borderColor: '#6e6d6b' }}>
                        <th className="text-left py-3 px-2 sm:px-4 font-medium text-xs sm:text-sm" style={{ color: '#d4d4d4' }}>Número</th>
                        <th className="text-left py-3 px-2 sm:px-4 font-medium text-xs sm:text-sm" style={{ color: '#d4d4d4' }}>Cliente</th>
                        <th className="text-left py-3 px-2 sm:px-4 font-medium text-xs sm:text-sm hidden lg:table-cell" style={{ color: '#d4d4d4' }}>Serviço</th>
                        <th className="text-left py-3 px-2 sm:px-4 font-medium text-xs sm:text-sm" style={{ color: '#d4d4d4' }}>Valor</th>
                        <th className="text-left py-3 px-2 sm:px-4 font-medium text-xs sm:text-sm hidden md:table-cell" style={{ color: '#d4d4d4' }}>Emissão</th>
                        <th className="text-left py-3 px-2 sm:px-4 font-medium text-xs sm:text-sm" style={{ color: '#d4d4d4' }}>Status</th>
                        <th className="text-left py-3 px-2 sm:px-4 font-medium text-xs sm:text-sm" style={{ color: '#d4d4d4' }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr>
                          <td colSpan={7} className="py-6 px-2 sm:px-4 text-center" style={{ color: '#6e6d6b' }}>Carregando recibos...</td>
                        </tr>
                      ) : filteredRecibos.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-6 px-2 sm:px-4 text-center" style={{ color: '#6e6d6b' }}>Nenhum recibo encontrado.</td>
                        </tr>
                      ) : (
                        filteredRecibos.map((recibo) => (
                          <tr key={recibo.id} className="border-b hover:bg-opacity-50 transition-all duration-200" 
                              style={{ borderColor: 'rgba(110, 109, 107, 0.3)' }}>
                            {/* Número do Recibo */}
                            <td className="py-3 px-2 sm:px-4">
                              <div className="font-mono text-xs sm:text-sm" style={{ color: '#b0825a' }}>
                                <div className="truncate max-w-[80px] sm:max-w-none">{recibo.numeroRecibo}</div>
                              </div>
                            </td>
                            
                            {/* Cliente */}
                            <td className="py-3 px-2 sm:px-4">
                              <div className="text-white font-medium text-xs sm:text-sm">
                                <div className="truncate max-w-[120px] sm:max-w-none">{recibo.clienteNome}</div>
                                <div className="text-xs" style={{ color: '#6e6d6b' }}>
                                  <div className="truncate max-w-[100px] sm:max-w-none">{recibo.cpfCnpj}</div>
                                </div>
                              </div>
                            </td>
                            
                            {/* Serviço (hidden em mobile) */}
                            <td className="py-3 px-2 sm:px-4 max-w-xs hidden lg:table-cell">
                              <div className="text-white text-sm truncate" title={recibo.servicos[0]?.descricao || ''}>
                                {recibo.servicos[0]?.descricao || 'N/A'}
                              </div>
                            </td>
                            
                            {/* Valor */}
                            <td className="py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm" style={{ color: '#22c55e' }}>
                              <div className="truncate max-w-[80px] sm:max-w-none">
                                {formatCurrency(recibo.valorTotal)}
                              </div>
                            </td>
                            
                            {/* Emissão (hidden em mobile) */}
                            <td className="py-3 px-2 sm:px-4 hidden md:table-cell">
                              <div className="flex items-center text-xs sm:text-sm" style={{ color: '#d4d4d4' }}>
                                <Calendar className="w-3 sm:w-4 h-3 sm:h-4 mr-1 opacity-70" />
                                <span className="truncate">{formatDate(recibo.dataEmissao)}</span>
                              </div>
                            </td>
                            
                            {/* Status */}
                            <td className="py-3 px-2 sm:px-4">
                              <select
                                value={recibo.status}
                                onChange={(e) => handleStatusChange(recibo.id, e.target.value as 'emitido' | 'cancelado')}
                                className={`px-1 sm:px-2 py-1 rounded-full text-xs font-medium border-0 w-full max-w-[90px] transition-all duration-200 ${
                                  recibo.status === 'emitido' 
                                    ? 'bg-green-900 text-green-300' 
                                    : 'bg-red-900 text-red-300'
                                }`}
                                style={{ backgroundColor: 'rgba(42, 42, 42, 0.8)' }}
                              >
                                <option value="emitido" style={{ backgroundColor: '#2a2a2a' }}>Emitido</option>
                                <option value="cancelado" style={{ backgroundColor: '#2a2a2a' }}>Cancelado</option>
                              </select>
                            </td>
                            
                            {/* Ações */}
                            <td className="py-3 px-2 sm:px-4">
                              <div className="flex items-center space-x-1 sm:space-x-2">
                                <button
                                  onClick={() => handleEdit(recibo)}
                                  className="p-1 sm:p-2 rounded-lg transition-all duration-200 hover:scale-105"
                                  style={{ backgroundColor: 'rgba(176, 130, 90, 0.2)' }}
                                  title="Editar"
                                >
                                  <Edit className="w-3 sm:w-4 h-3 sm:h-4 opacity-70" style={{ color: '#b0825a' }} />
                                </button>
                                <button
                                  onClick={() => handleDownloadPDF(recibo)}
                                  className="p-1 sm:p-2 rounded-lg transition-all duration-200 hover:scale-105"
                                  style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}
                                  title="Download PDF"
                                >
                                  <Download className="w-3 sm:w-4 h-3 sm:h-4 opacity-70" style={{ color: '#22c55e' }} />
                                </button>
                                <button
                                  onClick={() => confirmDelete(recibo.id)}
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
              {filteredRecibos.map((recibo) => (
                <div key={`mobile-${recibo.id}`} 
                     className="p-3 rounded-xl border transition-all duration-200"
                     style={{ 
                       backgroundColor: 'rgba(42, 42, 42, 0.6)',
                       borderColor: '#6e6d6b'
                     }}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-white font-medium text-sm">{recibo.clienteNome}</div>
                      <div className="text-xs font-mono" style={{ color: '#b0825a' }}>{recibo.numeroRecibo}</div>
                      <div className="text-xs" style={{ color: '#6e6d6b' }}>{recibo.cpfCnpj}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold" style={{ color: '#22c55e' }}>
                        {formatCurrency(recibo.valorTotal)}
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                        recibo.status === 'emitido' 
                          ? 'bg-green-900 text-green-300' 
                          : 'bg-red-900 text-red-300'
                      }`}>
                        {recibo.status}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs mb-2 line-clamp-2" style={{ color: '#d4d4d4' }}>
                    {recibo.servicos[0]?.descricao || 'N/A'}
                  </div>
                  <div className="flex justify-between items-center text-xs" style={{ color: '#d4d4d4' }}>
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1 opacity-70" />
                      {formatDate(recibo.dataEmissao)}
                    </div>
                    {(recibo.profissionalNome || recibo.escritorioNome) && (
                      <div className="flex items-center" style={{ color: '#b0825a' }}>
                        <Building className="w-3 h-3 mr-1 opacity-70" />
                        <span className="truncate max-w-[100px]">{recibo.profissionalNome || recibo.escritorioNome}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end space-x-2 mt-3">
                    <button
                      onClick={() => handleEdit(recibo)}
                      className="p-2 rounded-lg transition-all duration-200 hover:scale-105"
                      style={{ backgroundColor: 'rgba(176, 130, 90, 0.2)' }}
                    >
                      <Edit className="w-4 h-4 opacity-70" style={{ color: '#b0825a' }} />
                    </button>
                    <button
                      onClick={() => handleDownloadPDF(recibo)}
                      className="p-2 rounded-lg transition-all duration-200 hover:scale-105"
                      style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}
                    >
                      <Download className="w-4 h-4 opacity-70" style={{ color: '#22c55e' }} />
                    </button>
                    <button
                      onClick={() => confirmDelete(recibo.id)}
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

      {/* Modal de Novo/Editar Recibo - RESPONSIVO */}
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
                  {editingRecibo ? 'Editar Recibo' : 'Novo Recibo'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingRecibo(null);
                    resetForm();
                  }}
                  className="text-white hover:opacity-70 transition-all duration-200 p-2"
                >
                  <span className="text-xl">✕</span>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* ✅ NOVOS CAMPOS: Profissional e Escritório */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#d4d4d4' }}>
                      <User className="w-4 h-4 inline mr-2 opacity-70" />
                      Nome do Profissional *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.profissionalNome}
                      onChange={(e) => setFormData({...formData, profissionalNome: e.target.value})}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 text-sm sm:text-base transition-all duration-200"
                      style={{ 
                        backgroundColor: 'rgba(42, 42, 42, 0.6)',
                        borderColor: '#6e6d6b',
                      }}
                      placeholder="Nome completo do profissional"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#d4d4d4' }}>
                      <Building className="w-4 h-4 inline mr-2 opacity-70" />
                      Nome do Escritório
                    </label>
                    <input
                      type="text"
                      value={formData.escritorioNome}
                      onChange={(e) => setFormData({...formData, escritorioNome: e.target.value})}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 text-sm sm:text-base transition-all duration-200"
                      style={{ 
                        backgroundColor: 'rgba(42, 42, 42, 0.6)',
                        borderColor: '#6e6d6b'
                      }}
                      placeholder="Nome do escritório (opcional)"
                    />
                  </div>
                </div>

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
                      CPF/CNPJ do Cliente *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.cpfCnpj}
                      onChange={(e) => setFormData({...formData, cpfCnpj: e.target.value})}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 text-sm sm:text-base transition-all duration-200"
                      style={{ 
                        backgroundColor: 'rgba(42, 42, 42, 0.6)',
                        borderColor: '#6e6d6b'
                      }}
                      placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#d4d4d4' }}>
                    Endereço do Cliente *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.endereco}
                    onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 text-sm sm:text-base transition-all duration-200"
                    style={{ 
                      backgroundColor: 'rgba(42, 42, 42, 0.6)',
                      borderColor: '#6e6d6b'
                    }}
                    placeholder="Rua, número, bairro, cidade, estado"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#d4d4d4' }}>
                    Descrição do Serviço *
                  </label>
                  <textarea
                    required
                    value={formData.descricaoServico}
                    onChange={(e) => setFormData({...formData, descricaoServico: e.target.value})}
                    rows={3}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 resize-none text-sm sm:text-base transition-all duration-200"
                    style={{ 
                      backgroundColor: 'rgba(42, 42, 42, 0.6)',
                      borderColor: '#6e6d6b'
                    }}
                    placeholder="Descreva detalhadamente o serviço prestado..."
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
                      value={formData.valorServico}
                      onChange={(e) => setFormData({...formData, valorServico: e.target.value})}
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
                      Data de Emissão *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.dataEmissao}
                      onChange={(e) => setFormData({...formData, dataEmissao: e.target.value})}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border bg-transparent text-white focus:outline-none focus:ring-2 text-sm sm:text-base transition-all duration-200"
                      style={{ 
                        backgroundColor: 'rgba(42, 42, 42, 0.6)',
                        borderColor: '#6e6d6b'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#d4d4d4' }}>
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as 'emitido' | 'cancelado'})}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl border bg-transparent text-white focus:outline-none focus:ring-2 text-sm sm:text-base transition-all duration-200"
                    style={{ 
                      backgroundColor: 'rgba(42, 42, 42, 0.6)',
                      borderColor: '#6e6d6b'
                    }}
                  >
                    <option value="emitido" style={{ backgroundColor: '#2a2a2a' }}>Emitido</option>
                    <option value="cancelado" style={{ backgroundColor: '#2a2a2a' }}>Cancelado</option>
                  </select>
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
                    placeholder="Observações adicionais sobre o recibo..."
                  ></textarea>
                </div>

                <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-4 sm:pt-6 border-t" 
                     style={{ borderColor: '#6e6d6b' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingRecibo(null);
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
                      : editingRecibo 
                      ? 'Atualizar Recibo' 
                      : 'Criar Recibo'
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
                Tem certeza que deseja excluir este recibo? Esta ação não pode ser desfeita.
              </p>
              <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setReciboToDelete(null);
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

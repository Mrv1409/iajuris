'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
// Removido import de Timestamp do firebase/firestore, pois a API lidará com isso.

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
  AlertTriangle
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
  dataEmissao: string; // Alterado para string, pois a API retornará string e não Timestamp diretamente
  status: 'emitido' | 'cancelado';
  observacoes?: string;
  createdAt: string; // Alterado para string
  updatedAt?: string; // Alterado para string
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
}

export default function RecibosPage() {
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
    dataEmissao: new Date().toISOString().split('T')[0], // Data atual como padrão
    status: 'emitido',
    observacoes: ''
  });

  useEffect(() => {
    fetchRecibos();
  }, []);

  const fetchRecibos = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/financeiro/recibos');
      const result = await response.json();

      if (result.sucesso) {
        // A API já deve retornar as datas como strings no formato ISO (YYYY-MM-DD)
        setRecibos(result.recibos);
      } else {
        console.error('Erro ao buscar recibos:', result.error);
        // Implementar um modal de erro aqui, se necessário
      }
    } catch (error) {
      console.error('Erro ao buscar recibos:', error);
      // Implementar um modal de erro aqui, se necessário
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const valorNumerico = parseFloat(formData.valorServico);
      if (isNaN(valorNumerico)) {
        console.error('Valor do serviço inválido.');
        // Mostrar mensagem de erro para o usuário
        setIsLoading(false);
        return;
      }

      const reciboData: ReciboApiData = {
        clienteId: editingRecibo?.clienteId || 'auto-gerado', // Você pode precisar de uma lógica para obter o clienteId real
        clienteNome: formData.clienteNome,
        cpfCnpj: formData.cpfCnpj,
        endereco: formData.endereco,
        servicos: [{ descricao: formData.descricaoServico, valor: valorNumerico }],
        valorTotal: valorNumerico, // Valor total é o valor do serviço único por enquanto
        dataEmissao: formData.dataEmissao, // Enviando como string para a API
        status: formData.status,
        observacoes: formData.observacoes,
      };

      let response;
      if (editingRecibo) {
        // Atualizar recibo existente
        response = await fetch(`/api/financeiro/recibos?id=${editingRecibo.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingRecibo.id, ...reciboData })
        });
      } else {
        // Adicionar novo recibo
        response = await fetch('/api/financeiro/recibos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reciboData)
        });
      }

      const result = await response.json();

      if (result.sucesso) {
        fetchRecibos(); // Recarrega a lista para mostrar as atualizações
        setShowModal(false);
        setEditingRecibo(null);
        setFormData({ // Reset form
          clienteNome: '',
          cpfCnpj: '',
          endereco: '',
          descricaoServico: '',
          valorServico: '',
          dataEmissao: new Date().toISOString().split('T')[0],
          status: 'emitido',
          observacoes: ''
        });
      } else {
        console.error('Erro ao salvar recibo:', result.error);
        // Mostrar mensagem de erro para o usuário
      }
    } catch (error) {
      console.error('Erro ao salvar recibo:', error);
      // Mostrar mensagem de erro para o usuário
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (recibo: FinanceiroRecibos) => {
    setEditingRecibo(recibo);
    setFormData({
      clienteNome: recibo.clienteNome,
      cpfCnpj: recibo.cpfCnpj,
      endereco: recibo.endereco,
      descricaoServico: recibo.servicos[0]?.descricao || '', // Pega a descrição do primeiro serviço
      valorServico: recibo.servicos[0]?.valor.toString() || '', // Pega o valor do primeiro serviço
      dataEmissao: recibo.dataEmissao, // dataEmissao já é string
      status: recibo.status,
      observacoes: recibo.observacoes || ''
    });
    setShowModal(true);
  };

  const confirmDelete = (id: string) => {
    setReciboToDelete(id);
    setShowConfirmModal(true);
  };

  const handleDelete = async () => {
    if (!reciboToDelete) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/financeiro/recibos?id=${reciboToDelete}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.sucesso) {
        fetchRecibos(); // Recarrega a lista
        setShowConfirmModal(false);
        setReciboToDelete(null);
      } else {
        console.error('Erro ao excluir recibo:', result.error);
        // Mostrar mensagem de erro
      }
    } catch (error) {
      console.error('Erro ao excluir recibo:', error);
      // Mostrar mensagem de erro
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'emitido' | 'cancelado') => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/financeiro/recibos?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      const result = await response.json();

      if (result.sucesso) {
        fetchRecibos(); // Recarrega a lista
      } else {
        console.error('Erro ao atualizar status:', result.error);
        // Mostrar mensagem de erro
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      // Mostrar mensagem de erro
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

  // Ajustado para receber string e formatar
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR'); // Ex: 29/07/2025
  };

  const filteredRecibos = recibos.filter(recibo => {
    const matchesSearch = recibo.clienteNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          recibo.numeroRecibo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          recibo.servicos[0]?.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'todos' || recibo.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalRecibos = recibos.length;
  const totalEmitidos = recibos.filter(r => r.status === 'emitido').length;
  const totalCancelados = recibos.filter(r => r.status === 'cancelado').length;
  const valorTotal = recibos.reduce((sum, r) => sum + r.valorTotal, 0);

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
              href="/dashboard/financeiro" 
              className="group flex items-center px-4 py-2 rounded-xl border transition-all duration-300 hover:scale-105 active:scale-95"
              style={{ 
                backgroundColor: 'rgba(176, 130, 90, 0.2)',
                borderColor: 'rgba(176, 130, 90, 0.3)'
              }}
            >
              <ArrowLeft className="w-5 h-5 text-white mr-2" />
              <span className="text-white font-medium">Voltar ao Financeiro</span>
            </Link>

            <div className="flex items-center">
              <Scale className="w-8 h-8 mr-3" style={{ color: '#b0825a' }} />
              <h1 className="text-2xl sm:text-3xl font-bold text-white">GESTÃO DE RECIBOS</h1>
              <Receipt className="w-8 h-8 ml-3" style={{ color: '#b0825a' }} />
            </div>

            <button
              onClick={() => {
                setEditingRecibo(null); // Garante que é um novo recibo
                setFormData({ // Reset form
                  clienteNome: '',
                  cpfCnpj: '',
                  endereco: '',
                  descricaoServico: '',
                  valorServico: '',
                  dataEmissao: new Date().toISOString().split('T')[0],
                  status: 'emitido',
                  observacoes: ''
                });
                setShowModal(true);
              }}
              className="group flex items-center px-4 py-2 rounded-xl border transition-all duration-300 hover:scale-105 active:scale-95"
              style={{ 
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #15803d 100%)',
                borderColor: 'rgba(34, 197, 94, 0.3)'
              }}
            >
              <Plus className="w-5 h-5 text-white mr-2" />
              <span className="text-white font-medium">Novo Recibo</span>
            </button>
          </div>

          {/* Título */}
          <div className="text-center">
            <div className="h-0.5 w-24 mx-auto mb-4" 
                 style={{ background: 'linear-gradient(to right, transparent, #b0825a, transparent)' }}></div>
            <p className="text-lg font-light opacity-80" style={{ color: '#d4d4d4' }}>
              Emita e gerencie recibos profissionais
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto">
          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="p-4 rounded-2xl backdrop-blur-sm border shadow-2xl"
                 style={{ 
                   backgroundColor: 'rgba(20, 20, 20, 0.8)',
                   borderColor: 'rgba(176, 130, 90, 0.2)'
                 }}>
              <h3 className="text-sm font-medium mb-1" style={{ color: '#d4d4d4' }}>Total</h3>
              <p className="text-2xl font-bold" style={{ color: '#b0825a' }}>{totalRecibos}</p>
            </div>

            <div className="p-4 rounded-2xl backdrop-blur-sm border shadow-2xl"
                 style={{ 
                   backgroundColor: 'rgba(20, 20, 20, 0.8)',
                   borderColor: 'rgba(34, 197, 94, 0.2)'
                 }}>
              <h3 className="text-sm font-medium mb-1" style={{ color: '#d4d4d4' }}>Emitidos</h3>
              <p className="text-2xl font-bold" style={{ color: '#22c55e' }}>{totalEmitidos}</p>
            </div>

            <div className="p-4 rounded-2xl backdrop-blur-sm border shadow-2xl"
                 style={{ 
                   backgroundColor: 'rgba(20, 20, 20, 0.8)',
                   borderColor: 'rgba(239, 68, 68, 0.2)'
                 }}>
              <h3 className="text-sm font-medium mb-1" style={{ color: '#d4d4d4' }}>Cancelados</h3>
              <p className="text-2xl font-bold" style={{ color: '#ef4444' }}>{totalCancelados}</p>
            </div>

            <div className="p-4 rounded-2xl backdrop-blur-sm border shadow-2xl col-span-2"
                 style={{ 
                   backgroundColor: 'rgba(20, 20, 20, 0.8)',
                   borderColor: 'rgba(176, 130, 90, 0.2)'
                 }}>
              <h3 className="text-sm font-medium mb-1" style={{ color: '#d4d4d4' }}>Valor Total dos Recibos</h3>
              <p className="text-2xl font-bold" style={{ color: '#b0825a' }}>
                {formatCurrency(valorTotal)}
              </p>
            </div>
          </div>

          {/* Filtros e Busca */}
          <div className="p-6 rounded-2xl backdrop-blur-sm border shadow-2xl mb-8"
               style={{ 
                 backgroundColor: 'rgba(20, 20, 20, 0.8)',
                 borderColor: 'rgba(176, 130, 90, 0.2)'
               }}>
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Busca */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" 
                        style={{ color: '#6e6d6b' }} />
                <input
                  type="text"
                  placeholder="Buscar por cliente, número do recibo ou serviço..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2"
                  style={{ 
                    backgroundColor: 'rgba(20, 20, 20, 0.6)',
                    borderColor: 'rgba(176, 130, 90, 0.3)',
                  }}
                />
              </div>

              {/* Filtro por Status */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" 
                        style={{ color: '#6e6d6b' }} />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 pr-8 py-3 rounded-xl border bg-transparent text-white focus:outline-none focus:ring-2"
                  style={{ 
                    backgroundColor: 'rgba(20, 20, 20, 0.6)',
                    borderColor: 'rgba(176, 130, 90, 0.3)'
                  }}
                >
                  <option value="todos" className="bg-gray-800">Todos os Status</option>
                  <option value="emitido" className="bg-gray-800">Emitido</option>
                  <option value="cancelado" className="bg-gray-800">Cancelado</option>
                </select>
              </div>
            </div>
          </div>

          {/* Lista de Recibos */}
          <div className="p-6 rounded-2xl backdrop-blur-sm border shadow-2xl"
               style={{ 
                 backgroundColor: 'rgba(20, 20, 20, 0.8)',
                 borderColor: 'rgba(176, 130, 90, 0.2)'
               }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                Recibos ({filteredRecibos.length})
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'rgba(176, 130, 90, 0.2)' }}>
                    <th className="text-left py-3 px-4 font-medium" style={{ color: '#d4d4d4' }}>Número</th>
                    <th className="text-left py-3 px-4 font-medium" style={{ color: '#d4d4d4' }}>Cliente</th>
                    <th className="text-left py-3 px-4 font-medium" style={{ color: '#d4d4d4' }}>Serviço</th>
                    <th className="text-left py-3 px-4 font-medium" style={{ color: '#d4d4d4' }}>Valor Total</th>
                    <th className="text-left py-3 px-4 font-medium" style={{ color: '#d4d4d4' }}>Emissão</th>
                    <th className="text-left py-3 px-4 font-medium" style={{ color: '#d4d4d4' }}>Status</th>
                    <th className="text-left py-3 px-4 font-medium" style={{ color: '#d4d4d4' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="py-3 px-4 text-center text-gray-500">Carregando recibos...</td>
                    </tr>
                  ) : filteredRecibos.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-3 px-4 text-center text-gray-500">Nenhum recibo encontrado.</td>
                    </tr>
                  ) : (
                    filteredRecibos.map((recibo) => (
                      <tr key={recibo.id} className="border-b hover:bg-opacity-50" 
                          style={{ borderColor: 'rgba(176, 130, 90, 0.1)' }}>
                        <td className="py-3 px-4 font-mono text-sm" style={{ color: '#b0825a' }}>
                          {recibo.numeroRecibo}
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <div className="text-white font-medium">{recibo.clienteNome}</div>
                            <div className="text-sm" style={{ color: '#6e6d6b' }}>{recibo.cpfCnpj}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <div className="text-white text-sm truncate" title={recibo.servicos[0]?.descricao || ''}>
                            {recibo.servicos[0]?.descricao || 'N/A'}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-semibold" style={{ color: '#22c55e' }}>
                          {formatCurrency(recibo.valorTotal)}
                        </td>
                        <td className="py-3 px-4" style={{ color: '#d4d4d4' }}>
                          {formatDate(recibo.dataEmissao)}
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={recibo.status}
                            onChange={(e) => handleStatusChange(recibo.id, e.target.value as 'emitido' | 'cancelado')}
                            className={`px-2 py-1 rounded-full text-xs font-medium border-0 ${
                              recibo.status === 'emitido' 
                                ? 'bg-green-900 text-green-300' 
                                : 'bg-red-900 text-red-300'
                            }`}
                            style={{ backgroundColor: 'rgba(20, 20, 20, 0.6)' }}
                          >
                            <option value="emitido" className="bg-gray-800">Emitido</option>
                            <option value="cancelado" className="bg-gray-800">Cancelado</option>
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEdit(recibo)}
                              className="p-2 rounded-lg transition-colors hover:bg-opacity-20"
                              style={{ backgroundColor: 'rgba(176, 130, 90, 0.1)' }}
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" style={{ color: '#b0825a' }} />
                            </button>
                            <button
                              onClick={() => console.log('Funcionalidade de visualização/download em desenvolvimento')}
                              className="p-2 rounded-lg transition-colors hover:bg-opacity-20"
                              style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}
                              title="Visualizar/Download"
                            >
                              <Download className="w-4 h-4" style={{ color: '#22c55e' }} />
                            </button>
                            <button
                              onClick={() => confirmDelete(recibo.id)}
                              className="p-2 rounded-lg transition-colors hover:bg-opacity-20"
                              style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" style={{ color: '#ef4444' }} />
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
      </div>

      {/* Modal de Novo/Editar Recibo */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-2xl w-full rounded-2xl backdrop-blur-sm border shadow-2xl max-h-[90vh] overflow-y-auto"
               style={{ 
                 backgroundColor: 'rgba(20, 20, 20, 0.95)',
                 borderColor: 'rgba(176, 130, 90, 0.2)'
               }}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {editingRecibo ? 'Editar Recibo' : 'Novo Recibo'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingRecibo(null);
                    setFormData({ // Reset form
                      clienteNome: '',
                      cpfCnpj: '',
                      endereco: '',
                      descricaoServico: '',
                      valorServico: '',
                      dataEmissao: new Date().toISOString().split('T')[0],
                      status: 'emitido',
                      observacoes: ''
                    });
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#d4d4d4' }}>
                      Nome do Cliente *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.clienteNome}
                      onChange={(e) => setFormData({...formData, clienteNome: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2"
                      style={{ 
                        backgroundColor: 'rgba(20, 20, 20, 0.6)',
                        borderColor: 'rgba(176, 130, 90, 0.3)'
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
                      className="w-full px-4 py-3 rounded-xl border bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2"
                      style={{ 
                        backgroundColor: 'rgba(20, 20, 20, 0.6)',
                        borderColor: 'rgba(176, 130, 90, 0.3)'
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
                    className="w-full px-4 py-3 rounded-xl border bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2"
                    style={{ 
                      backgroundColor: 'rgba(20, 20, 20, 0.6)',
                      borderColor: 'rgba(176, 130, 90, 0.3)'
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
                    className="w-full px-4 py-3 rounded-xl border bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 resize-none"
                    style={{ 
                      backgroundColor: 'rgba(20, 20, 20, 0.6)',
                      borderColor: 'rgba(176, 130, 90, 0.3)'
                    }}
                    placeholder="Descreva detalhadamente o serviço prestado..."
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      className="w-full px-4 py-3 rounded-xl border bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2"
                      style={{ 
                        backgroundColor: 'rgba(20, 20, 20, 0.6)',
                        borderColor: 'rgba(176, 130, 90, 0.3)'
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
                      className="w-full px-4 py-3 rounded-xl border bg-transparent text-white focus:outline-none focus:ring-2"
                      style={{ 
                        backgroundColor: 'rgba(20, 20, 20, 0.6)',
                        borderColor: 'rgba(176, 130, 90, 0.3)'
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
                    className="w-full px-4 py-3 rounded-xl border bg-transparent text-white focus:outline-none focus:ring-2"
                    style={{ 
                      backgroundColor: 'rgba(20, 20, 20, 0.6)',
                      borderColor: 'rgba(176, 130, 90, 0.3)'
                    }}
                  >
                    <option value="emitido" className="bg-gray-800">Emitido</option>
                    <option value="cancelado" className="bg-gray-800">Cancelado</option>
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
                    className="w-full px-4 py-3 rounded-xl border bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 resize-none"
                    style={{ 
                      backgroundColor: 'rgba(20, 20, 20, 0.6)',
                      borderColor: 'rgba(176, 130, 90, 0.3)'
                    }}
                    placeholder="Observações adicionais sobre o recibo..."
                  ></textarea>
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t" 
                     style={{ borderColor: 'rgba(176, 130, 90, 0.2)' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingRecibo(null);
                      setFormData({ // Reset form
                        clienteNome: '',
                        cpfCnpj: '',
                        endereco: '',
                        descricaoServico: '',
                        valorServico: '',
                        dataEmissao: new Date().toISOString().split('T')[0],
                        status: 'emitido',
                        observacoes: ''
                      });
                    }}
                    className="px-6 py-3 rounded-xl border text-white font-medium transition-all duration-300 hover:scale-105 active:scale-95"
                    style={{ 
                      backgroundColor: 'rgba(107, 114, 128, 0.2)',
                      borderColor: 'rgba(107, 114, 128, 0.3)'
                    }}
                  >
                    Cancelar
                  </button>
                  
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl border text-white font-medium transition-all duration-300 hover:scale-105 active:scale-95"
                    style={{ 
                      background: 'linear-gradient(135deg, #b0825a 0%, #8b6444 50%, #6b4e2f 100%)',
                      borderColor: 'rgba(176, 130, 90, 0.3)'
                    }}
                  >
                    {editingRecibo ? 'Atualizar Recibo' : 'Criar Recibo'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full rounded-2xl backdrop-blur-sm border shadow-2xl"
               style={{ 
                 backgroundColor: 'rgba(20, 20, 20, 0.95)',
                 borderColor: 'rgba(239, 68, 68, 0.2)'
               }}>
            <div className="p-6 text-center">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-4">Confirmar Exclusão</h2>
              <p className="text-gray-300 mb-6">
                Tem certeza que deseja excluir este recibo? Esta ação não pode ser desfeita.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-6 py-3 rounded-xl border text-white font-medium transition-all duration-300 hover:scale-105 active:scale-95"
                  style={{ 
                    backgroundColor: 'rgba(107, 114, 128, 0.2)',
                    borderColor: 'rgba(107, 114, 128, 0.3)'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  className="px-6 py-3 rounded-xl border text-white font-medium transition-all duration-300 hover:scale-105 active:scale-95"
                  style={{ 
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)',
                    borderColor: 'rgba(239, 68, 68, 0.3)'
                  }}
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-t-4 rounded-full animate-spin mx-auto mb-4" 
                 style={{ 
                   borderColor: 'rgba(176, 130, 90, 0.3)',
                   borderTopColor: '#b0825a'
                 }}></div>
            <p className="text-white text-lg">Carregando recibos...</p>
          </div>
        </div>
      )}
    </main>
  );
}
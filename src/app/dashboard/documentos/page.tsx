'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  ArrowLeft, 
  FileText, 
  Search, 
  Trash2, 
  Eye, 
  Filter,
  Loader2,
  FolderOpen,
  Clock
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { listarPeticoesPorAdvogado, excluirPeticao } from '@/lib/firebase-peticoes'; // ✅ CORRIGIDO
import { Timestamp } from 'firebase/firestore';

// ✅ INTERFACE CORRIGIDA - USA advogadoId
interface Peticao {
  id: string;
  tipoDocumento: string;
  conteudo: string;
  titulo: string; // ✅ ADICIONADO
  nomeCliente?: string; // ✅ ADICIONADO
  provedorIA: string;
  criadoEm: Timestamp;
  advogadoId: string; // ✅ CORRIGIDO: advogadoId em vez de profissionalId
}

export default function DocumentosPage() {
  const { data: session } = useSession();
  const [peticoes, setPeticoes] = useState<Peticao[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [peticaoSelecionada, setPeticaoSelecionada] = useState<Peticao | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);

  
  const OWNER_EMAIL = 'marvincosta321@gmail.com';//eslint-disable-next-line
  const isOwnerMVP = session?.user?.email === OWNER_EMAIL;
  const advogadoId = session?.user?.id;

  // Carregar petições ao montar o componente
  useEffect(() => {
    if (advogadoId) { // ✅ CORRIGIDO: Usa advogadoId híbrido
      carregarPeticoes();
    }//eslint-disable-next-line
  }, [advogadoId]); // ✅ CORRIGIDO: Dependência correta

  const carregarPeticoes = async () => {
    try {
      setLoading(true);
      // ✅ CORRIGIDO: Usa função existente e advogadoId híbrido
      const peticoesCarregadas = await listarPeticoesPorAdvogado(String(advogadoId));
      setPeticoes(peticoesCarregadas); // ✅ CORRIGIDO: Bug setPeticoes(peticoes) -> setPeticoes(peticoesCarregadas)
    } catch (error) {
      console.error('Erro ao carregar petições:', error);
      toast.error('Erro ao carregar histórico de documentos');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar petições baseado na busca
  const peticoesFiltradas = peticoes.filter(peticao => {
    const matchSearch = searchTerm === '' || 
      peticao.tipoDocumento.toLowerCase().includes(searchTerm.toLowerCase()) ||
      peticao.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) || // ✅ CORRIGIDO: Usa titulo em vez de descricaoCase
      peticao.nomeCliente?.toLowerCase().includes(searchTerm.toLowerCase()) || // ✅ CORRIGIDO: Usa nomeCliente
      peticao.conteudo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchTipo = filtroTipo === '' || peticao.tipoDocumento === filtroTipo;
    
    return matchSearch && matchTipo;
  });

  // Formatar data
  const formatarData = (timestamp: Timestamp) => {
    if (!timestamp) return 'Data não disponível';
    const date = timestamp.toDate ? timestamp.toDate() : new Date();
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Excluir petição
  const handleExcluir = async (peticaoId: string) => {
    try {
      setExcluindoId(peticaoId);
      await excluirPeticao(peticaoId);
      setPeticoes(prev => prev.filter(p => p.id !== peticaoId));
      toast.success('Documento excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir documento');
    } finally {
      setExcluindoId(null);
    }
  };

  // Visualizar petição
  const handleVisualizar = (peticao: Peticao) => {
    setPeticaoSelecionada(peticao);
    setShowModal(true);
  };

  // Copiar conteúdo
  const copiarConteudo = (conteudo: string) => {
    navigator.clipboard.writeText(conteudo)
      .then(() => {
        toast.success('Documento copiado para a área de transferência!');
      })
      .catch(() => {
        toast.error('Erro ao copiar documento');
      });
  };

  return (
    <main className="min-h-screen relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 30%, #2a2a2a 60%, #3a2a1a 100%)' }}>
      
      {/* Elementos decorativos */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-[#b0825a] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
      <div className="absolute bottom-20 right-20 w-72 h-72 bg-[#b0825a] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-1000" />

      {/* Container principal de conteúdo */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-8">
        {/* Header da Página */}
        <div className="mb-8 max-w-7xl mx-auto p-6 rounded-2xl backdrop-blur-sm border"
          style={{ 
            backgroundColor: 'rgba(20, 20, 20, 0.8)',
            borderColor: 'rgba(176, 130, 90, 0.2)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
          }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-white">
                <FolderOpen className="inline-block w-8 h-8 mr-3 text-[#b0825a]" /> 
                Histórico de Documentos
              </h1>
              <p className="text-lg sm:text-xl font-light opacity-80" style={{ color: '#d4d4d4' }}>
                Gerencie e visualize todos os documentos gerados pela IA
              </p>
            </div>
            <div className="flex gap-3">
              {/* Botão Criar Novo */}
              <Link 
                href="/dashboard/peticoes"
                className="group flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg border"
                style={{ 
                  backgroundColor: 'rgba(176, 130, 90, 0.1)',
                  borderColor: 'rgba(176, 130, 90, 0.3)',
                  color: '#b0825a'
                }}
              >
                <FileText className="w-4 h-4" />
                Criar Novo
              </Link>
              
              {/* Botão Voltar */}
              <Link 
                href="/dashboard/leads/advogado"
                className="group flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg"
                style={{ 
                  background: 'linear-gradient(135deg, #b0825a 0%, #8b6942 50%, #6d532a 100%)',
                  boxShadow: '0 10px 25px rgba(176, 130, 90, 0.3)',
                  color: '#ffffff'
                }}
              >
                <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                Voltar ao Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="mb-6 max-w-7xl mx-auto p-6 rounded-2xl backdrop-blur-sm border"
          style={{ 
            backgroundColor: 'rgba(20, 20, 20, 0.8)',
            borderColor: 'rgba(176, 130, 90, 0.2)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
          }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Campo de Busca */}
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por tipo, título ou cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-[#b0825a] focus:border-transparent"
                style={{ backgroundColor: 'rgba(40, 40, 40, 0.8)', borderColor: '#6e6d6b', color: '#ffffff' }}
              />
            </div>
            
            {/* Filtro por Tipo */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-[#b0825a] focus:border-transparent appearance-none"
                style={{ backgroundColor: 'rgba(40, 40, 40, 0.8)', borderColor: '#6e6d6b', color: '#ffffff' }}
              >
                <option value="">Todos os tipos</option>
                <option value="petição inicial">Petição Inicial</option>
                <option value="contestação">Contestação</option>
                <option value="recurso">Recurso</option>
                <option value="embargos">Embargos de Declaração</option>
                <option value="apelação">Apelação</option>
                <option value="agravo">Agravo de Instrumento</option>
                <option value="mandado de segurança">Mandado de Segurança</option>
                <option value="habeas corpus">Habeas Corpus</option>
                <option value="outros">Outros</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Documentos */}
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#b0825a] mr-3" />
              <span className="text-white text-lg">Carregando documentos...</span>
            </div>
          ) : peticoesFiltradas.length === 0 ? (
            <div className="text-center p-12 rounded-2xl backdrop-blur-sm border"
              style={{ 
                backgroundColor: 'rgba(20, 20, 20, 0.8)',
                borderColor: 'rgba(176, 130, 90, 0.2)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
              }}>
              <FolderOpen className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {searchTerm || filtroTipo ? 'Nenhum documento encontrado' : 'Nenhum documento gerado ainda'}
              </h3>
              <p className="text-gray-400 mb-6">
                {searchTerm || filtroTipo 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece criando sua primeira petição com a IA'
                }
              </p>
              {!searchTerm && !filtroTipo && (
                <Link 
                  href="/dashboard/peticoes"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg"
                  style={{ 
                    background: 'linear-gradient(135deg, #b0825a 0%, #8b6942 50%, #6d532a 100%)',
                    boxShadow: '0 10px 25px rgba(176, 130, 90, 0.3)',
                    color: '#ffffff'
                  }}
                >
                  <FileText className="w-5 h-5" />
                  Criar Primeira Petição
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {peticoesFiltradas.map((peticao) => (
                <div
                  key={peticao.id}
                  className="p-6 rounded-2xl backdrop-blur-sm border transition-all duration-300 hover:scale-105 transform"
                  style={{ 
                    backgroundColor: 'rgba(20, 20, 20, 0.8)',
                    borderColor: 'rgba(176, 130, 90, 0.2)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                  }}
                >
                  {/* Header do Card */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[#b0825a] flex-shrink-0" />
                      <h3 className="font-semibold text-white text-sm capitalize truncate">
                        {peticao.tipoDocumento}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>{formatarData(peticao.criadoEm)}</span>
                    </div>
                  </div>

                  {/* Conteúdo do Card */}
                  <div className="space-y-3 mb-4">
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                        Título do Documento
                      </p>
                      <p className="text-white text-sm line-clamp-3">
                        {peticao.titulo || 'Documento sem título'}
                      </p>
                    </div>
                    
                    {peticao.nomeCliente && (
                      <div>
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                          Cliente
                        </p>
                        <p className="text-white text-sm truncate">
                          {peticao.nomeCliente}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <div className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{ 
                          backgroundColor: 'rgba(176, 130, 90, 0.1)',
                          color: '#b0825a',
                          border: '1px solid rgba(176, 130, 90, 0.3)'
                        }}>
                        {peticao.provedorIA}
                      </div>
                    </div>
                  </div>

                  {/* Ações do Card */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleVisualizar(peticao)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-300 hover:scale-105"
                      style={{ 
                        backgroundColor: 'rgba(176, 130, 90, 0.1)',
                        borderColor: 'rgba(176, 130, 90, 0.3)',
                        color: '#b0825a',
                        border: '1px solid rgba(176, 130, 90, 0.3)'
                      }}
                    >
                      <Eye className="w-4 h-4" />
                      Visualizar
                    </button>
                    
                    <button
                      onClick={() => handleExcluir(peticao.id)}
                      disabled={excluindoId === peticao.id}
                      className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-300 hover:scale-105 bg-red-600/10 border border-red-600/30 text-red-400 hover:bg-red-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {excluindoId === peticao.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Visualização */}
      {showModal && peticaoSelecionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white capitalize">
                    {peticaoSelecionada.tipoDocumento}
                  </h2>
                  <p className="text-gray-400 text-sm">
                    {peticaoSelecionada.titulo && (
                      <span className="block mb-1">{peticaoSelecionada.titulo}</span>
                    )}
                    Gerado em {formatarData(peticaoSelecionada.criadoEm)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => copiarConteudo(peticaoSelecionada.conteudo)}
                    className="px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 hover:scale-105"
                    style={{ 
                      backgroundColor: 'rgba(176, 130, 90, 0.1)',
                      borderColor: 'rgba(176, 130, 90, 0.3)',
                      color: '#b0825a',
                      border: '1px solid rgba(176, 130, 90, 0.3)'
                    }}
                  >
                    Copiar
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 font-medium text-sm"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <pre className="whitespace-pre-wrap text-white text-sm leading-relaxed">
                {peticaoSelecionada.conteudo}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* CSS para animações customizadas */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.1;
            transform: scale(1);
          }
          50% {
            opacity: 0.2;
            transform: scale(1.05);
          }
        }
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        .animate-pulse {
          animation: pulse 3s ease-in-out infinite;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </main>
  );
}
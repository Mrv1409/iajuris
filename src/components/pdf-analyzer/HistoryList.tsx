import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Calendar,
  Trash2,
  Eye,
  Download,
  RefreshCw,
  Search,
  Filter,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp} from 'lucide-react';

// Interface para análise (mesma da API)
interface PdfAnalysisData {
  clientId: string;
  resposta: string;
  sucesso: boolean;
  metadata: {
    documentId: string;
    fileName: string;
    analysisType: string;
    modelo: string;
    timestamp: string;
    fileSize: number;
    textLength: number;
  };
}

// Interface para resposta da API de histórico
interface HistoryResponse {
  sucesso: boolean;
  analyses: PdfAnalysisData[];
  total: number;
  message: string;
}

// Props do componente
interface HistoryListProps {
  clientId: string;
  onViewAnalysis?: (analysis: PdfAnalysisData) => void;
  onRefresh?: () => void;
  autoRefresh?: boolean;
}

const HistoryList: React.FC<HistoryListProps> = ({
  clientId,
  onViewAnalysis,
  onRefresh,
  autoRefresh = false
}) => {
  const [analyses, setAnalyses] = useState<PdfAnalysisData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [deleteLoading, setDeleteLoading] = useState<Set<string>>(new Set());

  // Tipos de análise para filtro
  const analysisTypes = [
    { value: 'all', label: 'Todos os Tipos' },
    { value: 'Resumo Executivo', label: 'Resumo Executivo' },
    { value: 'Cronologia do Processo', label: 'Cronologia' },
    { value: 'Identificação das Partes', label: 'Partes' },
    { value: 'Decisões Principais', label: 'Decisões' },
    { value: 'Análise Estratégica', label: 'Estratégia' },
    { value: 'Análise Completa', label: 'Completa' }
  ];

  // Carregar histórico (wrapped com useCallback)
  const loadHistory = useCallback(async () => {
    if (!clientId) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/pdf-history?clientId=${encodeURIComponent(clientId)}`);
      const data: HistoryResponse = await response.json();

      if (!response.ok || !data.sucesso) {
        throw new Error(data.message || 'Erro ao carregar histórico');
      }

      setAnalyses(data.analyses || []);
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  // Deletar análise
  const deleteAnalysis = async (analysisId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta análise?')) return;

    setDeleteLoading(prev => new Set(prev).add(analysisId));

    try {
      const response = await fetch(`/api/pdf-history?id=${encodeURIComponent(analysisId)}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok || !data.sucesso) {
        throw new Error(data.resposta || 'Erro ao deletar análise');
      }

      // Remove da lista local
      setAnalyses(prev => prev.filter(analysis => analysis.metadata.documentId !== analysisId));
      
      // Remove dos expandidos se estiver lá
      setExpandedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(analysisId);
        return newSet;
      });

    } catch (err) {
      console.error('Erro ao deletar análise:', err);
      const errorMsg = err instanceof Error ? err.message : 'Erro ao deletar';
      alert(`Erro: ${errorMsg}`);
    } finally {
      setDeleteLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(analysisId);
        return newSet;
      });
    }
  };

  // Efeito para carregar histórico inicial
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(loadHistory, 30000); // 30 segundos
    return () => clearInterval(interval);
  }, [autoRefresh, loadHistory]);

  // Filtrar e ordenar análises
  const filteredAndSortedAnalyses = analyses
    .filter(analysis => {
      // Filtro por termo de busca
      const matchesSearch = !searchTerm || 
        analysis.metadata.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        analysis.metadata.analysisType.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro por tipo
      const matchesType = filterType === 'all' || analysis.metadata.analysisType === filterType;

      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          comparison = new Date(a.metadata.timestamp).getTime() - new Date(b.metadata.timestamp).getTime();
          break;
        case 'name':
          comparison = a.metadata.fileName.localeCompare(b.metadata.fileName);
          break;
        case 'type':
          comparison = a.metadata.analysisType.localeCompare(b.metadata.analysisType);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Formatação de data
  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Formatação de tamanho
  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Toggle item expandido
  const toggleExpanded = (documentId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(documentId)) {
        newSet.delete(documentId);
      } else {
        newSet.add(documentId);
      }
      return newSet;
    });
  };

  // Download da análise
  const downloadAnalysis = (analysis: PdfAnalysisData) => {
    const content = `ANÁLISE JURÍDICA
================

Arquivo: ${analysis.metadata.fileName}
Tipo: ${analysis.metadata.analysisType}
Data: ${formatDate(analysis.metadata.timestamp)}
Modelo: ${analysis.metadata.modelo}

RESULTADO
=========

${analysis.resposta}

---
Gerado pelo IAJuris`;

    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `analise_${analysis.metadata.fileName.replace('.pdf', '')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="w-full max-w-6xl mx-auto bg-white rounded-lg shadow-lg">
      {/* Cabeçalho */}
      <div className="p-4 sm:p-6 border-b border-gray-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Histórico de Análises</h2>
            <p className="text-gray-600 text-sm sm:text-base">
              {analyses.length} análise{analyses.length !== 1 ? 's' : ''} encontrada{analyses.length !== 1 ? 's' : ''}
            </p>
          </div>

          <button
            onClick={() => {
              loadHistory();
              onRefresh?.();
            }}
            disabled={loading}
            className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors text-sm sm:text-base min-w-[120px]"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>

        {/* Filtros e busca */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Busca */}
          <div className="relative col-span-1 sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar arquivos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800 placeholder-gray-500"
            />
          </div>

          {/* Filtro por tipo */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none z-10" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full pl-10 pr-8 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-gray-800"
            >
              {analysisTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Ordenação */}
          <div className="flex space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'type')}
              className="flex-1 px-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800"
            >
              <option value="date">Data</option>
              <option value="name">Nome</option>
              <option value="type">Tipo</option>
            </select>
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 border border-gray-400 rounded-lg hover:bg-gray-100 bg-white text-gray-600 transition-colors"
              title={`Ordenar ${sortOrder === 'asc' ? 'decrescente' : 'crescente'}`}
            >
              {sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-4 sm:p-6">
        {loading ? (
          // Loading state
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-3">
              <RefreshCw className="h-6 w-6 text-blue-600 animate-spin" />
              <span className="text-gray-700">Carregando histórico...</span>
            </div>
          </div>
        ) : error ? (
          // Error state
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">Erro ao Carregar</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={loadHistory}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          </div>
        ) : filteredAndSortedAnalyses.length === 0 ? (
          // Empty state
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <FileText className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                {analyses.length === 0 ? 'Nenhuma análise encontrada' : 'Nenhum resultado'}
              </h3>
              <p className="text-gray-600">
                {analyses.length === 0 
                  ? 'Faça sua primeira análise de PDF para ver o histórico aqui.'
                  : 'Tente ajustar os filtros de busca.'
                }
              </p>
            </div>
          </div>
        ) : (
          // Lista de análises
          <div className="space-y-4">
            {filteredAndSortedAnalyses.map((analysis) => {
              const isExpanded = expandedItems.has(analysis.metadata.documentId);
              const isDeleting = deleteLoading.has(analysis.metadata.documentId);

              return (
                <div
                  key={analysis.metadata.documentId}
                  className="border border-gray-300 rounded-lg hover:shadow-md transition-shadow bg-white"
                >
                  {/* Cabeçalho do item */}
                  <div className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                        {/* Ícone e status */}
                        <div className="flex-shrink-0">
                          {analysis.sucesso ? (
                            <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
                          ) : (
                            <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
                          )}
                        </div>

                        {/* Informações principais */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-800 truncate text-sm sm:text-base" title={analysis.metadata.fileName}>
                            {analysis.metadata.fileName}
                          </h3>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-xs sm:text-sm text-gray-600 mt-1 gap-1 sm:gap-0">
                            <span className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span>{formatDate(analysis.metadata.timestamp)}</span>
                            </span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs max-w-fit">
                              {analysis.metadata.analysisType}
                            </span>
                            <span className="hidden sm:inline">{formatFileSize(analysis.metadata.fileSize)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                        <button
                          onClick={() => onViewAnalysis?.(analysis)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Visualizar análise"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => downloadAnalysis(analysis)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Baixar análise"
                        >
                          <Download className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => deleteAnalysis(analysis.metadata.documentId)}
                          disabled={isDeleting}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 transition-colors"
                          title="Excluir análise"
                        >
                          {isDeleting ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>

                        <button
                          onClick={() => toggleExpanded(analysis.metadata.documentId)}
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                          title={isExpanded ? 'Recolher' : 'Expandir'}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Conteúdo expandido */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 p-3 sm:p-4 bg-gray-50">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2">Metadados</h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p><strong>Modelo:</strong> {analysis.metadata.modelo}</p>
                            <p><strong>Caracteres:</strong> {analysis.metadata.textLength.toLocaleString()}</p>
                            <p><strong>Tamanho:</strong> {formatFileSize(analysis.metadata.fileSize)}</p>
                            <p><strong>Status:</strong> 
                              <span className={`ml-1 ${analysis.sucesso ? 'text-green-600' : 'text-red-600'}`}>
                                {analysis.sucesso ? 'Sucesso' : 'Erro'}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Prévia da Análise</h4>
                        <div className="bg-white p-3 sm:p-4 rounded border max-h-40 overflow-y-auto">
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {analysis.resposta.substring(0, 300)}
                            {analysis.resposta.length > 300 && '...'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryList;
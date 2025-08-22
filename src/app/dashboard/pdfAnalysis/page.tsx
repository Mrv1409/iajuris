'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  History, 
  Upload, 
  ArrowLeft, 
  User,
  BarChart3,
  Scale,
  Gavel,
  Shield
} from 'lucide-react';

import { useSession } from 'next-auth/react';

// Importação dos componentes (ajuste os caminhos conforme sua estrutura)
import PdfUploader from '@/components/pdf-analyzer/PdfUploader';
import ProcessingLoader from '@/components/pdf-analyzer/ProcessingLoader';
import AnalysisResults from '@/components/pdf-analyzer/AnalysisResults';
import HistoryList from '@/components/pdf-analyzer/HistoryList';

// Interfaces
interface AnalysisResult {
  resposta: string;
  sucesso: boolean;
  metadata: {
    fileName: string;
    analysisType: string;
    modelo: string;
    timestamp: string;
    fileSize: number;
    textLength: number;
  };
}

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

// Estados da aplicação
type AppState = 'upload' | 'processing' | 'results' | 'history';

const PdfAnalysisPage: React.FC = () => {
  
  // ✅ USANDO NEXT-AUTH SESSION PARA DETECTAR USUÁRIO LOGADO
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // ✅ LÓGICA HÍBRIDA SEGURA: MVP (Owner) + SaaS (Isolamento por ID)
  const OWNER_EMAIL = 'marvincosta321@gmail.com';
  const isOwnerMVP = session?.user?.email === OWNER_EMAIL;
  const clientId = isOwnerMVP 
    ? OWNER_EMAIL                // MVP: Acesso exclusivo do owner
    : session?.user?.id;         // SaaS: Isolamento real por user ID
  
  // Estados principais
  const [currentState, setCurrentState] = useState<AppState>('upload');
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [selectedHistoryAnalysis, setSelectedHistoryAnalysis] = useState<PdfAnalysisData | null>(null);
  const [processingData, setProcessingData] = useState<{
    fileName: string;
    fileSize: number;
    analysisType: string;
  } | null>(null);
  
  // Estados de controle
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');

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

  // Handlers para PdfUploader
  const handleAnalysisStart = () => {
    setIsProcessing(true);
    setError('');
    setCurrentState('processing');
  };

  const handleAnalysisComplete = (result: AnalysisResult) => {
    setCurrentAnalysis(result);
    setIsProcessing(false);
    setCurrentState('results');
    setProcessingData(null);
  };

  const handleAnalysisError = (errorMessage: string) => {
    setError(errorMessage);
    setIsProcessing(false);
    setCurrentState('upload'); // Volta para upload em caso de erro
    setProcessingData(null);
  };

  // Handler para ProcessingLoader
  const handleCancelProcessing = () => {
    setIsProcessing(false);
    setCurrentState('upload');
    setProcessingData(null);
    // Aqui você poderia implementar cancelamento da requisição se necessário
  };

  // Handlers para AnalysisResults
  const handleCloseResults = () => {
    setCurrentAnalysis(null);
    setCurrentState('upload');
  };

  const handleNewAnalysis = () => {
    setCurrentAnalysis(null);
    setCurrentState('upload');
  };

  // Handlers para HistoryList
  const handleViewHistoryAnalysis = (analysis: PdfAnalysisData) => {
    // Converte PdfAnalysisData para AnalysisResult para compatibilidade
    const convertedAnalysis: AnalysisResult = {
      resposta: analysis.resposta,
      sucesso: analysis.sucesso,
      metadata: {
        fileName: analysis.metadata.fileName,
        analysisType: analysis.metadata.analysisType,
        modelo: analysis.metadata.modelo,
        timestamp: analysis.metadata.timestamp,
        fileSize: analysis.metadata.fileSize,
        textLength: analysis.metadata.textLength
      }
    };
    
    setSelectedHistoryAnalysis(analysis);
    setCurrentAnalysis(convertedAnalysis);
    setCurrentState('results');
  };

  const handleHistoryRefresh = () => {
    // Lógica adicional se necessário quando o histórico for atualizado
    console.log('Histórico atualizado');
  };

  // Função para navegar entre telas
  const navigateTo = (state: AppState) => {
    setCurrentState(state);
    setError('');
    
    // Limpa dados específicos baseado no destino
    if (state === 'upload') {
      setCurrentAnalysis(null);
      setSelectedHistoryAnalysis(null);
      setProcessingData(null);
    }
  };

  //eslint-disable-next-line
  const handleUploadStart = (fileName: string, fileSize: number, analysisType: string) => {
    setProcessingData({ fileName, fileSize, analysisType });
  };

  // Estatísticas simples (você pode expandir isso)
  const getStats = () => {
    // Aqui você poderia fazer uma chamada à API para obter estatísticas
    return {
      totalAnalyses: 0, // Implementar se necessário
      successRate: 100,
      averageTime: '2min'
    };
  };

  const stats = getStats();

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

            {/* ✅ LOGO CENTRALIZADA CORRIGIDA */}
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
                  <span className="text-white font-medium">{stats.successRate}%</span>
                  <span className="text-[#d4d4d4] ml-1">sucesso</span>
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
            <FileText className="w-6 sm:w-8 h-6 sm:h-8 text-[#b0825a] mr-3" style={{ opacity: 0.7 }} />
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">Análise Inteligente de Documentos</h2>
          </div>
          <div className="mx-auto mt-4 h-0.5 w-24 bg-gradient-to-r from-transparent via-[#b0825a] to-transparent" />
          <p className="text-center mt-2 text-[#d4d4d4] text-sm">
            Processamento jurídico com IA avançada
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Navegação de Estado */}
          <div className="rounded-2xl p-6 shadow-2xl mb-8"
               style={{ 
                 backgroundColor: 'rgba(20, 20, 20, 0.8)',
                 border: '1px solid rgba(176, 130, 90, 0.2)',
                 backdropFilter: 'blur(8px)',
                 boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
               }}>
            <div className="flex items-center space-x-4 sm:space-x-6">
              <button
                onClick={() => navigateTo('upload')}
                className={`flex items-center space-x-2 px-4 py-3 rounded-xl border transition-all duration-300 transform hover:scale-105 ${
                  currentState === 'upload'
                    ? 'shadow-lg'
                    : 'hover:shadow-md'
                }`}
                style={{
                  backgroundColor: currentState === 'upload' ? 'rgba(176, 130, 90, 0.3)' : 'rgba(176, 130, 90, 0.1)',
                  borderColor: 'rgba(176, 130, 90, 0.2)',
                  boxShadow: currentState === 'upload' ? '0 10px 25px rgba(176, 130, 90, 0.3)' : 'none'
                }}
              >
                <Upload className="h-5 w-5 text-white" />
                <span className="text-white font-medium text-sm sm:text-base">Nova Análise</span>
              </button>

              <button
                onClick={() => navigateTo('history')}
                className={`flex items-center space-x-2 px-4 py-3 rounded-xl border transition-all duration-300 transform hover:scale-105 ${
                  currentState === 'history'
                    ? 'shadow-lg'
                    : 'hover:shadow-md'
                }`}
                style={{
                  backgroundColor: currentState === 'history' ? 'rgba(176, 130, 90, 0.3)' : 'rgba(176, 130, 90, 0.1)',
                  borderColor: 'rgba(176, 130, 90, 0.2)',
                  boxShadow: currentState === 'history' ? '0 10px 25px rgba(176, 130, 90, 0.3)' : 'none'
                }}
              >
                <History className="h-5 w-5 text-white" />
                <span className="text-white font-medium text-sm sm:text-base">Histórico</span>
              </button>

              {/* Breadcrumb para outras telas */}
              {(currentState === 'processing' || currentState === 'results') && (
                <>
                  <div className="h-6 w-px bg-[#6e6d6b]"></div>
                  <div className="flex items-center space-x-2 px-3 py-2 rounded-lg"
                       style={{ backgroundColor: 'rgba(176, 130, 90, 0.1)' }}>
                    <Shield className="h-4 w-4" style={{ color: '#b0825a' }} />
                    <div className="text-sm">
                      {currentState === 'processing' && (
                        <>
                          <span className="text-white font-medium">Processando</span>
                          {processingData && (
                            <span className="text-[#d4d4d4] ml-2">• {processingData.fileName}</span>
                          )}
                        </>
                      )}
                      {currentState === 'results' && (
                        <>
                          <span className="text-white font-medium">Resultado</span>
                          {currentAnalysis && (
                            <span className="text-[#d4d4d4] ml-2">• {currentAnalysis.metadata.fileName}</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Conteúdo Principal */}
          <div>
            {/* Estado: Upload */}
            {currentState === 'upload' && (
              <div className="rounded-2xl p-8 shadow-2xl"
                   style={{ 
                     backgroundColor: 'rgba(20, 20, 20, 0.8)',
                     border: '1px solid rgba(176, 130, 90, 0.2)',
                     backdropFilter: 'blur(8px)',
                     boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                   }}>
                <div className="text-center space-y-6">
                  <div className="flex items-center justify-center mb-6">
                    <div className="p-4 rounded-xl mr-4 animate-pulse"
                         style={{ backgroundColor: 'rgba(176, 130, 90, 0.2)' }}>
                      <FileText className="w-12 h-12" style={{ color: '#b0825a' }} />
                    </div>
                  </div>
                  
                  <h3 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">
                    Análise Inteligente de Documentos Jurídicos
                  </h3>
                  <p className="text-base sm:text-lg leading-relaxed max-w-2xl mx-auto text-[#d4d4d4]">
                    Envie um documento PDF e obtenha análises jurídicas automatizadas com nossa IA especializada em direito.
                  </p>

                  {/* ✅ USANDO CLIENT ID SEGURO - MVP Owner ou SaaS User ID isolado */}
                  <PdfUploader
                    clientId={clientId!} // Garantido que existe pelo guard acima
                    onAnalysisComplete={handleAnalysisComplete}
                    onError={handleAnalysisError}
                    onProcessingStart={() => {
                      handleAnalysisStart();
                      // Captura dados do arquivo para o ProcessingLoader
                      // Nota: você pode modificar o PdfUploader para passar esses dados
                    }}
                  />

                  {error && (
                    <div className="max-w-2xl mx-auto mt-8">
                      <div className="rounded-2xl p-6 shadow-2xl"
                           style={{ 
                             backgroundColor: 'rgba(239, 68, 68, 0.1)',
                             border: '1px solid rgba(239, 68, 68, 0.2)',
                             boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.3)'
                           }}>
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}>
                            <span className="text-red-400 text-lg">⚠️</span>
                          </div>
                          <h4 className="font-medium text-red-300 text-lg">Erro no Processamento</h4>
                        </div>
                        <p className="text-red-400">{error}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Estado: Processing */}
            {currentState === 'processing' && (
              <div className="rounded-2xl p-8 shadow-2xl"
                   style={{ 
                     backgroundColor: 'rgba(20, 20, 20, 0.8)',
                     border: '1px solid rgba(176, 130, 90, 0.2)',
                     backdropFilter: 'blur(8px)',
                     boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                   }}>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => navigateTo('upload')}
                      className="flex items-center space-x-2 px-4 py-2 rounded-xl border transition-all duration-300 transform hover:scale-105"
                      style={{ 
                        backgroundColor: 'rgba(176, 130, 90, 0.1)',
                        borderColor: 'rgba(176, 130, 90, 0.2)'
                      }}
                    >
                      <ArrowLeft className="h-4 w-4 text-white" />
                      <span className="text-white">Voltar</span>
                    </button>
                  </div>

                  <ProcessingLoader
                    fileName={processingData?.fileName}
                    fileSize={processingData?.fileSize}
                    analysisType={processingData?.analysisType}
                    onCancel={handleCancelProcessing}
                    isProcessing={isProcessing}
                    error={error}
                  />
                </div>
              </div>
            )}

            {/* Estado: Results */}
            {currentState === 'results' && currentAnalysis && (
              <div className="rounded-2xl p-8 shadow-2xl"
                   style={{ 
                     backgroundColor: 'rgba(20, 20, 20, 0.8)',
                     border: '1px solid rgba(176, 130, 90, 0.2)',
                     backdropFilter: 'blur(8px)',
                     boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                   }}>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => navigateTo(selectedHistoryAnalysis ? 'history' : 'upload')}
                      className="flex items-center space-x-2 px-4 py-2 rounded-xl border transition-all duration-300 transform hover:scale-105"
                      style={{ 
                        backgroundColor: 'rgba(176, 130, 90, 0.1)',
                        borderColor: 'rgba(176, 130, 90, 0.2)'
                      }}
                    >
                      <ArrowLeft className="h-4 w-4 text-white" />
                      <span className="text-white">Voltar</span>
                    </button>
                  </div>

                  <AnalysisResults
                    result={currentAnalysis}
                    onClose={handleCloseResults}
                    onNewAnalysis={handleNewAnalysis}
                  />
                </div>
              </div>
            )}

            {/* Estado: History */}
            {currentState === 'history' && (
              <div className="rounded-2xl p-8 shadow-2xl"
                   style={{ 
                     backgroundColor: 'rgba(20, 20, 20, 0.8)',
                     border: '1px solid rgba(176, 130, 90, 0.2)',
                     backdropFilter: 'blur(8px)',
                     boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                   }}>
                {/* ✅ HISTÓRICO COM ISOLAMENTO SEGURO - MVP Owner ou SaaS User ID isolado */}
                <HistoryList
                  clientId={clientId!} // Garantido que existe pelo guard acima
                  onViewAnalysis={handleViewHistoryAnalysis}
                  onRefresh={handleHistoryRefresh}
                  autoRefresh={false} // Defina como true se quiser auto-refresh
                />
              </div>
            )}
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
};

export default PdfAnalysisPage;
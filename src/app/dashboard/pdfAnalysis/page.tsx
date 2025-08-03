'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  const [clientId, setClientId] = useState<string>('');

  // Simula obtenção do clientId (adapte conforme sua autenticação)
  useEffect(() => {
    // Exemplo: pegar do localStorage, context, session, etc.
    const getClientId = () => {
      // Aqui você pode implementar sua lógica para obter o clientId
      // Por exemplo: de um contexto de autenticação, localStorage, etc.
      
      // Exemplo simples com localStorage
      let id = localStorage.getItem('clientId');
      if (!id) {
        id = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('clientId', id);
      }
      return id;
    };

    setClientId(getClientId());
  }, []);

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

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background Principal com Gradiente IAJURIS */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-amber-900"></div>
      
      {/* Elementos Decorativos */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-amber-800 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-72 h-72 bg-amber-700 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      {/* Container Principal */}
      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="max-w-7xl mx-auto p-6 rounded-2xl backdrop-blur-sm border shadow-2xl"
          style={{ 
            backgroundColor: 'rgba(20, 20, 20, 0.8)',
            borderColor: 'rgba(176, 130, 90, 0.2)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
          }}>
          {/* Header Row */}
          <div className="flex items-center justify-between mb-8">
            {/* Botão Dashboard */}
            <Link 
              href="/dashboard" 
              className="group flex items-center px-4 py-2 rounded-xl border transition-all duration-300 hover:scale-105 active:scale-95 font-semibold"
              style={{ 
                background: 'linear-gradient(135deg, #b0825a 0%, #8b6942 50%, #6d532a 100%)',
                borderColor: 'rgba(176, 130, 90, 0.2)',
                boxShadow: '0 10px 25px rgba(176, 130, 90, 0.3)'
              }}
            >
              <ArrowLeft className="w-4 h-4 text-white mr-2 transition-colors" />
              <span className="text-white font-medium text-sm sm:text-base">
                Dashboard
              </span>
            </Link>

            {/* Logo Centralizada */}
            <div className="flex-grow flex justify-center"> 
              <div className="flex items-center group cursor-default"> 
                <Scale className="w-8 h-8 sm:w-10 sm:h-10 mr-3" 
                        style={{ color: '#b0825a' }} />
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg">
                  IAJURIS
                </h1>
                <Gavel className="w-8 h-8 sm:w-10 sm:h-10 ml-3" 
                        style={{ color: '#b0825a' }} />
              </div>
            </div>

            {/* Estatísticas rápidas */}
            <div className="hidden lg:flex items-center space-x-4 px-4 py-2 rounded-xl border"
                 style={{ 
                   backgroundColor: 'rgba(176, 130, 90, 0.1)',
                   borderColor: 'rgba(176, 130, 90, 0.2)'
                 }}>
              <BarChart3 className="h-5 w-5" style={{ color: '#b0825a' }} />
              <div className="text-sm">
                <span className="text-white font-medium">{stats.successRate}%</span>
                <span className="text-gray-400 ml-1">sucesso</span>
              </div>
            </div>
          </div>

          {/* Título e Subtítulo */}
          <div className="text-center">
            <div className="h-0.5 w-24 mx-auto mb-4" 
                 style={{ background: 'linear-gradient(to right, transparent, #b0825a, transparent)' }}></div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg mb-2">
              Análise Inteligente de Documentos
            </h2>
            <p className="text-lg sm:text-xl font-light opacity-80" style={{ color: '#d4d4d4' }}>
              Processamento jurídico com IA avançada
            </p>
            <div className="mt-2 text-sm opacity-75" style={{ color: '#d4d4d4' }}>
              ANÁLISE PROFISSIONAL DE CONTRATOS E DOCUMENTOS LEGAIS
            </div>
          </div>
        </div>

        {/* Navegação de Estado */}
        <div className="max-w-7xl mx-auto mt-8">
          <div className="p-6 rounded-2xl backdrop-blur-sm border shadow-2xl"
               style={{ 
                 backgroundColor: 'rgba(20, 20, 20, 0.8)',
                 borderColor: 'rgba(176, 130, 90, 0.2)',
                 boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
               }}>
            <div className="flex items-center space-x-4 sm:space-x-6">
              <button
                onClick={() => navigateTo('upload')}
                className={`flex items-center space-x-2 px-4 py-3 rounded-xl border transition-all duration-300 hover:scale-105 ${
                  currentState === 'upload'
                    ? 'shadow-lg'
                    : 'hover:shadow-md'
                }`}
                style={{
                  backgroundColor: currentState === 'upload' ? '#b0825a' : 'rgba(176, 130, 90, 0.1)',
                  borderColor: 'rgba(176, 130, 90, 0.2)',
                  boxShadow: currentState === 'upload' ? '0 10px 25px rgba(176, 130, 90, 0.3)' : 'none'
                }}
              >
                <Upload className="h-5 w-5 text-white" />
                <span className="text-white font-medium text-sm sm:text-base">Nova Análise</span>
              </button>

              <button
                onClick={() => navigateTo('history')}
                className={`flex items-center space-x-2 px-4 py-3 rounded-xl border transition-all duration-300 hover:scale-105 ${
                  currentState === 'history'
                    ? 'shadow-lg'
                    : 'hover:shadow-md'
                }`}
                style={{
                  backgroundColor: currentState === 'history' ? '#b0825a' : 'rgba(176, 130, 90, 0.1)',
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
                  <div className="h-6 w-px bg-gray-600"></div>
                  <div className="flex items-center space-x-2 px-3 py-2 rounded-lg"
                       style={{ backgroundColor: 'rgba(176, 130, 90, 0.1)' }}>
                    <Shield className="h-4 w-4" style={{ color: '#b0825a' }} />
                    <div className="text-sm">
                      {currentState === 'processing' && (
                        <>
                          <span className="text-white font-medium">Processando</span>
                          {processingData && (
                            <span className="text-gray-400 ml-2">• {processingData.fileName}</span>
                          )}
                        </>
                      )}
                      {currentState === 'results' && (
                        <>
                          <span className="text-white font-medium">Resultado</span>
                          {currentAnalysis && (
                            <span className="text-gray-400 ml-2">• {currentAnalysis.metadata.fileName}</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Cliente ID (apenas para desenvolvimento) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="hidden xl:flex items-center space-x-2 px-3 py-2 rounded-lg text-xs"
                     style={{ backgroundColor: 'rgba(176, 130, 90, 0.1)' }}>
                  <User className="h-3 w-3" style={{ color: '#b0825a' }} />
                  <span className="text-gray-400" title={clientId}>Cliente: {clientId.substring(0, 12)}...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="max-w-7xl mx-auto mt-8">
          {/* Estado: Upload */}
          {currentState === 'upload' && (
            <div className="p-8 rounded-2xl backdrop-blur-sm border shadow-2xl"
                 style={{ 
                   backgroundColor: 'rgba(20, 20, 20, 0.8)',
                   borderColor: 'rgba(176, 130, 90, 0.2)',
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
                <p className="text-base sm:text-lg leading-relaxed max-w-2xl mx-auto" style={{ color: '#d4d4d4' }}>
                  Envie um documento PDF e obtenha análises jurídicas automatizadas com nossa IA especializada em direito.
                </p>

                <PdfUploader
                  clientId={clientId}
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
                    <div className="p-6 rounded-2xl backdrop-blur-sm border shadow-2xl"
                         style={{ 
                           backgroundColor: 'rgba(239, 68, 68, 0.1)',
                           borderColor: 'rgba(239, 68, 68, 0.2)',
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
            <div className="p-8 rounded-2xl backdrop-blur-sm border shadow-2xl"
                 style={{ 
                   backgroundColor: 'rgba(20, 20, 20, 0.8)',
                   borderColor: 'rgba(176, 130, 90, 0.2)',
                   boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                 }}>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => navigateTo('upload')}
                    className="flex items-center space-x-2 px-4 py-2 rounded-xl border transition-all duration-300 hover:scale-105"
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
            <div className="p-8 rounded-2xl backdrop-blur-sm border shadow-2xl"
                 style={{ 
                   backgroundColor: 'rgba(20, 20, 20, 0.8)',
                   borderColor: 'rgba(176, 130, 90, 0.2)',
                   boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                 }}>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => navigateTo(selectedHistoryAnalysis ? 'history' : 'upload')}
                    className="flex items-center space-x-2 px-4 py-2 rounded-xl border transition-all duration-300 hover:scale-105"
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
            <div className="p-8 rounded-2xl backdrop-blur-sm border shadow-2xl"
                 style={{ 
                   backgroundColor: 'rgba(20, 20, 20, 0.8)',
                   borderColor: 'rgba(176, 130, 90, 0.2)',
                   boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                 }}>
              <HistoryList
                clientId={clientId}
                onViewAnalysis={handleViewHistoryAnalysis}
                onRefresh={handleHistoryRefresh}
                autoRefresh={false} // Defina como true se quiser auto-refresh
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default PdfAnalysisPage;
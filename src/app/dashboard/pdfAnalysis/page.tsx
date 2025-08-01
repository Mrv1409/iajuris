'use client';

import { useState, useCallback, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation'; // Adicionado para navegação
import PdfUploader from '@/components/pdf-analyzer/PdfUploader';
import ProcessingLoader from '@/components/pdf-analyzer/ProcessingLoader';
import AnalysisResults from '@/components/pdf-analyzer/AnalysisResults';
import HistoryList from '@/components/pdf-analyzer/HistoryList';

// Definindo os tipos para a aplicação
type PageState = 'uploader' | 'loading' | 'results' | 'history';

interface AnalysisResult {
  resposta: string;
  sucesso: boolean;
  metadata: {
    documentId: string;
    fileName: string;
    analysisType: string;
    fileUrl: string;
    modelo: string;
    timestamp: string;
  };
}

interface AnalysisMetadata {
  documentId: string;
  fileName: string;
  analysisType: string;
  timestamp: string;
  result?: AnalysisResult;
}

export default function PdfAnalysisPage() {
  const router = useRouter(); // Hook para navegação
  const [pageState, setPageState] = useState<PageState>('uploader');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [selectedAnalysisType, setSelectedAnalysisType] = useState('');
  const [historyList, setHistoryList] = useState<AnalysisMetadata[]>([]);
  const [, setSelectedAnalysisId] = useState<string | null>(null);

  // Simulação de dados de histórico
  useEffect(() => {
    // Em um cenário real, você faria uma chamada para o Firebase ou outra API
    // para buscar o histórico de análises do usuário.
    const mockHistory: AnalysisMetadata[] = [
      {
        documentId: 'doc-1',
        fileName: 'Contrato Social da Empresa ABC.pdf',
        analysisType: 'Análise Completa',
        timestamp: '2023-10-27T10:00:00Z',
        result: {
          sucesso: true,
          resposta: `### Análise Completa de Contrato Social\n\nEste documento detalha o contrato social da Empresa ABC. Fundada em 2020-01-15, com um capital social de R$100.000,00, a empresa tem como sócios João da Silva e Maria Souza. A análise jurídica indica que todas as cláusulas estão em conformidade com a legislação vigente.`,
          metadata: {
            documentId: 'doc-1',
            fileName: 'Contrato Social da Empresa ABC.pdf',
            analysisType: 'Análise Completa',
            fileUrl: 'simulated-url',
            modelo: 'IA-Juris-v1',
            timestamp: '2023-10-27T10:00:00Z',
          },
        },
      },
      {
        documentId: 'doc-2',
        fileName: 'Processo Judicial XYZ-123.pdf',
        analysisType: 'Cronologia do Processo',
        timestamp: '2023-10-26T14:30:00Z',
        result: {
          sucesso: true,
          resposta: `### Cronologia do Processo Judicial XYZ-123\n\n- **10/01/2023:** Início do processo.\n- **15/02/2023:** Apresentação da defesa.\n- **20/03/2023:** Audiência de conciliação.\n- **25/04/2023:** Decisão de primeira instância.`,
          metadata: {
            documentId: 'doc-2',
            fileName: 'Processo Judicial XYZ-123.pdf',
            analysisType: 'Cronologia do Processo',
            fileUrl: 'simulated-url',
            modelo: 'IA-Juris-v1',
            timestamp: '2023-10-26T14:30:00Z',
          },
        },
      },
    ];
    setHistoryList(mockHistory);
  }, []);

  const handleAnalysisStart = useCallback((fileName: string, analysisType: string) => {
    setPageState('loading');
    setSelectedFileName(fileName);
    setSelectedAnalysisType(analysisType);
  }, []);

  const handleAnalysisComplete = useCallback((result: AnalysisResult) => {
    setAnalysisResult(result);
    setPageState('results');

    // Adiciona o novo resultado ao histórico
    if (result && result.sucesso) {
      const newAnalysisMetadata = {
        documentId: result.metadata.documentId,
        fileName: result.metadata.fileName,
        analysisType: result.metadata.analysisType,
        timestamp: result.metadata.timestamp,
        result: result
      };
      setHistoryList(prev => [newAnalysisMetadata, ...prev]);
    }
  }, []);

  const handleViewAnalysis = useCallback((documentId: string) => {
    // Simula a busca de um resultado específico no histórico.
    const analysis = historyList.find(a => a.documentId === documentId);
    if (analysis && analysis.result) {
      setAnalysisResult(analysis.result);
      setSelectedFileName(analysis.fileName);
      setSelectedAnalysisType(analysis.analysisType);
      setSelectedAnalysisId(documentId);
      setPageState('results');
    }
  }, [historyList]);

  const handleDeleteAnalysis = useCallback((documentId: string) => {
    // Simula a exclusão de um item do histórico.
    setHistoryList(prev => prev.filter(a => a.documentId !== documentId));
  }, []);

  // Handler corrigido para o botão de voltar para a dashboard
  const handleGoBackToDashboard = () => {
    router.push('/dashboard');
  };

  const renderCurrentPage = () => {
    switch (pageState) {
      case 'uploader':
        return (
          <>
            <div className="flex justify-between items-center mb-4">
              {/* Botão de Voltar para a Dashboard */}
              <button
                onClick={handleGoBackToDashboard}
                className="p-2 rounded-full text-white transition-all duration-300 hover:scale-110"
                style={{ 
                  background: 'rgba(176, 130, 90, 0.2)',
                  color: '#b0825a'
                }}
                title="Voltar à Dashboard"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={() => setPageState('history')}
                className="px-4 py-2 rounded-xl text-white font-medium transition-all duration-300 hover:scale-105 active:scale-95"
                style={{ 
                  background: 'rgba(176, 130, 90, 0.3)',
                  border: '1px solid rgba(176, 130, 90, 0.2)'
                }}
              >
                Ver Histórico
              </button>
            </div>
            <PdfUploader onAnalysisComplete={handleAnalysisComplete} onAnalysisStart={handleAnalysisStart} />
          </>
        );
      case 'loading':
        return <ProcessingLoader fileName={selectedFileName} analysisType={selectedAnalysisType} />;
      case 'results':
        return (
          <>
            <div className="flex items-center mb-4">
              <button
                onClick={() => setPageState('uploader')}
                className="p-2 rounded-full transition-all duration-300 hover:scale-110"
                style={{ 
                  background: 'rgba(176, 130, 90, 0.2)',
                  color: '#b0825a'
                }}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h1 className="ml-4 text-2xl font-bold text-white">Resultados da Análise</h1>
            </div>
            <AnalysisResults result={analysisResult} />
          </>
        );
      case 'history':
        return (
          <>
            <div className="flex items-center mb-4">
              <button
                onClick={() => setPageState('uploader')}
                className="p-2 rounded-full transition-all duration-300 hover:scale-110"
                style={{ 
                  background: 'rgba(176, 130, 90, 0.2)',
                  color: '#b0825a'
                }}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h1 className="ml-4 text-2xl font-bold text-white">Histórico de Análises</h1>
            </div>
            <HistoryList
              analyses={historyList}
              onViewAnalysis={handleViewAnalysis}
              onDeleteAnalysis={handleDeleteAnalysis}
            />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-8 bg-gray-950 text-white font-sans" style={{ background: 'radial-gradient(circle at center, rgba(16, 16, 16, 1) 0%, rgba(5, 5, 5, 1) 100%)' }}>
      <div className="w-full max-w-4xl mx-auto">
        {renderCurrentPage()}
      </div>
    </div>
  );
}
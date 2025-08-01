'use client';

import { FileCheck, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

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

interface AnalysisResultsProps {
  result: AnalysisResult | null;
}

export default function AnalysisResults({ result }: AnalysisResultsProps) {
  if (!result || !result.sucesso) {
    return (
      <div className="space-y-6">
        <div className="p-8 rounded-2xl backdrop-blur-sm border shadow-2xl"
             style={{ 
               backgroundColor: 'rgba(20, 20, 20, 0.8)',
               borderColor: 'rgba(176, 130, 90, 0.2)',
               boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
             }}>
          <p className="text-center text-red-400">
            Não foi possível carregar os resultados da análise.
          </p>
        </div>
      </div>
    );
  }

  const { resposta, metadata } = result;

  const handleDownload = () => {
    // Simulação de download. Em um cenário real, você geraria
    // e baixaria um arquivo real.
    const blob = new Blob([resposta], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `analise-${metadata.fileName}-${metadata.analysisType}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="p-8 rounded-2xl backdrop-blur-sm border shadow-2xl"
           style={{ 
             backgroundColor: 'rgba(20, 20, 20, 0.8)',
             borderColor: 'rgba(176, 130, 90, 0.2)',
             boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
           }}>
        
        <div className="flex items-center justify-between mb-6 border-b pb-4"
             style={{ borderColor: 'rgba(176, 130, 90, 0.2)' }}>
          <div className="flex items-center">
            <div className="p-3 rounded-xl mr-4"
                 style={{ backgroundColor: 'rgba(176, 130, 90, 0.2)' }}>
              <FileCheck className="w-6 h-6" style={{ color: '#b0825a' }} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Análise Concluída</h2>
              <p className="text-sm" style={{ color: '#d4d4d4' }}>
                Documento: <span className="font-semibold">{metadata.fileName}</span>
              </p>
              <p className="text-sm" style={{ color: '#d4d4d4' }}>
                Tipo: <span className="font-semibold">{metadata.analysisType}</span>
              </p>
            </div>
          </div>
          <button
            onClick={handleDownload}
            className="p-3 rounded-xl transition-all duration-300 hover:scale-110 active:scale-95"
            style={{ 
              background: 'rgba(176, 130, 90, 0.3)',
              color: 'white'
            }}
            title="Baixar Análise"
          >
            <Download className="w-6 h-6" />
          </button>
        </div>

        {/* Conteúdo da Análise */}
        <div className="prose prose-invert max-w-none text-white leading-relaxed space-y-4">
          <ReactMarkdown>
            {resposta}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
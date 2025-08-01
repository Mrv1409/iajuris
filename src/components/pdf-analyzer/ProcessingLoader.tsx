'use client';

import { Loader2, FileText } from 'lucide-react';

interface ProcessingLoaderProps {
  fileName: string;
  analysisType: string;
}

const ANALYSIS_ICONS = {
  'Resumo Executivo': FileText,
  'Cronologia do Processo': FileText,
  'Identificação das Partes': FileText,
  'Decisões Principais': FileText,
  'Análise Estratégica': FileText,
  'Análise Completa': FileText
};

export default function ProcessingLoader({ fileName, analysisType }: ProcessingLoaderProps) {
  const IconComponent = ANALYSIS_ICONS[analysisType as keyof typeof ANALYSIS_ICONS] || FileText;

  return (
    <div className="space-y-6">
      <div className="p-8 rounded-2xl backdrop-blur-sm border shadow-2xl animate-pulse"
           style={{ 
             backgroundColor: 'rgba(20, 20, 20, 0.8)',
             borderColor: 'rgba(176, 130, 90, 0.2)',
             boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
           }}>
        
        <div className="flex items-center justify-center mb-6">
          <div className="p-3 rounded-xl mr-4"
               style={{ backgroundColor: 'rgba(176, 130, 90, 0.2)' }}>
            <IconComponent className="w-6 h-6" style={{ color: '#b0825a' }} />
          </div>
          <h2 className="text-2xl font-bold text-white">
            Análise em Andamento
          </h2>
        </div>

        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin" style={{ color: '#b0825a' }} />
          <p className="text-white text-lg text-center font-medium">
            Aguarde, a IA está analisando o seu documento...
          </p>
          <div className="text-sm text-center" style={{ color: '#d4d4d4' }}>
            <p>
              <span className="font-semibold">Documento:</span> {fileName}
            </p>
            <p>
              <span className="font-semibold">Tipo de Análise:</span> {analysisType}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { FileText, Calendar, Users, Gavel, Target, FileCheck, Eye, Trash2, Search, XCircle } from 'lucide-react';

interface AnalysisMetadata {
  documentId: string;
  fileName: string;
  analysisType: string;
  timestamp: string;
}

interface HistoryListProps {
  analyses: AnalysisMetadata[];
  onViewAnalysis: (documentId: string) => void;
  onDeleteAnalysis: (documentId: string) => void;
}

const ANALYSIS_ICONS = {
  'Resumo Executivo': FileCheck,
  'Cronologia do Processo': Calendar,
  'Identificação das Partes': Users,
  'Decisões Principais': Gavel,
  'Análise Estratégica': Target,
  'Análise Completa': FileText
};

export default function HistoryList({ analyses, onViewAnalysis, onDeleteAnalysis }: HistoryListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const filteredAnalyses = analyses.filter(analysis =>
    analysis.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    analysis.analysisType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="p-8 rounded-2xl backdrop-blur-sm border shadow-2xl"
           style={{ 
             backgroundColor: 'rgba(20, 20, 20, 0.8)',
             borderColor: 'rgba(176, 130, 90, 0.2)',
             boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
           }}>
        
        <div className="flex items-center mb-6">
          <div className="p-3 rounded-xl mr-4"
               style={{ backgroundColor: 'rgba(176, 130, 90, 0.2)' }}>
            <FileText className="w-6 h-6" style={{ color: '#b0825a' }} />
          </div>
          <h2 className="text-2xl font-bold text-white">
            Histórico de Análises
          </h2>
        </div>

        {/* Barra de Pesquisa */}
        <div className="relative mb-6">
          <input
            type="text"
            placeholder="Buscar por nome do arquivo ou tipo de análise..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 pl-10 rounded-xl text-white border"
            style={{ 
              backgroundColor: 'rgba(20, 20, 20, 0.8)',
              borderColor: 'rgba(176, 130, 90, 0.3)'
            }}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#b0825a' }} />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-700 transition-colors"
            >
              <XCircle className="w-5 h-5" style={{ color: '#b0825a' }} />
            </button>
          )}
        </div>

        {/* Lista de Análises */}
        <div className="space-y-4 max-h-[50vh] overflow-y-auto">
          {filteredAnalyses.length > 0 ? (
            filteredAnalyses.map((analysis) => {
              const IconComponent = ANALYSIS_ICONS[analysis.analysisType as keyof typeof ANALYSIS_ICONS] || FileText;
              return (
                <div
                  key={analysis.documentId}
                  className="p-4 rounded-xl flex items-center justify-between transition-all duration-300 hover:scale-[1.02]"
                  style={{ 
                    backgroundColor: 'rgba(176, 130, 90, 0.1)',
                    border: '1px solid rgba(176, 130, 90, 0.2)'
                  }}
                >
                  <div className="flex items-center flex-1 min-w-0 mr-4">
                    <div className="p-2 rounded-lg mr-3 flex-shrink-0"
                         style={{ backgroundColor: 'rgba(176, 130, 90, 0.2)' }}>
                      <IconComponent className="w-5 h-5" style={{ color: '#b0825a' }} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">{analysis.fileName}</p>
                      <p className="text-sm" style={{ color: '#d4d4d4' }}>
                        {analysis.analysisType} • {formatDate(analysis.timestamp)}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2 flex-shrink-0">
                    <button
                      onClick={() => onViewAnalysis(analysis.documentId)}
                      className="p-2 rounded-xl transition-all duration-300 hover:scale-110"
                      style={{ backgroundColor: 'rgba(176, 130, 90, 0.3)' }}
                      title="Visualizar Análise"
                    >
                      <Eye className="w-5 h-5" style={{ color: 'white' }} />
                    </button>
                    <button
                      onClick={() => onDeleteAnalysis(analysis.documentId)}
                      className="p-2 rounded-xl transition-all duration-300 hover:scale-110"
                      style={{ backgroundColor: 'rgba(239, 68, 68, 0.3)' }}
                      title="Excluir Análise"
                    >
                      <Trash2 className="w-5 h-5 text-red-400" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center text-gray-400">Nenhuma análise encontrada.</p>
          )}
        </div>
      </div>
    </div>
  );
}
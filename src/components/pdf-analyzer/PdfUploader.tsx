'use client';

import { useState, useRef, useCallback, ChangeEvent, MouseEvent } from 'react';
import { Upload, FileText, XCircle, ChevronRight, AlertCircle } from 'lucide-react';

// Tipos definidos para as props
interface PdfUploaderProps {
  onAnalysisStart: (fileName: string, analysisType: string) => void;
  onAnalysisComplete: (result: AnalysisResult) => void;
}

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

// Função para estimar número de páginas baseado no tamanho do arquivo
const estimatePages = (fileSizeBytes: number): number => {
  // Estimativa: ~1.3MB por página (considerando PDFs com texto e imagens)
  const averageBytesPerPage = 1.3 * 1024 * 1024;
  return Math.ceil(fileSizeBytes / averageBytesPerPage);
};

// Função para validar o arquivo
const validateFile = (file: File, maxPages: number, maxSizeMB: number): { isValid: boolean; error: string } => {
  // Verificar tipo de arquivo
  if (file.type !== 'application/pdf') {
    return { isValid: false, error: 'Por favor, selecione apenas arquivos PDF.' };
  }

  // Verificar tamanho máximo do arquivo
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > maxSizeMB) {
    return { 
      isValid: false, 
      error: `Arquivo muito grande (${fileSizeMB.toFixed(1)}MB). Limite máximo: ${maxSizeMB}MB.` 
    };
  }

  // Estimar e verificar número de páginas
  const estimatedPages = estimatePages(file.size);
  if (estimatedPages > maxPages) {
    return { 
      isValid: false, 
      error: `Documento muito extenso (estimado: ${estimatedPages} páginas). Limite atual: ${maxPages} páginas para análise otimizada.` 
    };
  }

  return { isValid: true, error: '' };
};

export default function PdfUploader({ onAnalysisStart, onAnalysisComplete }: PdfUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisType, setAnalysisType] = useState('Análise Completa');
  const [fileError, setFileError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Configurações de limite
  const MAX_PAGES = 15; // Limite de páginas
  const MAX_FILE_SIZE_MB = 20; // Limite de tamanho em MB

  const analysisOptions = [
    'Análise Completa',
    'Resumo Executivo',
    'Cronologia do Processo',
    'Identificação das Partes',
    'Decisões Principais',
    'Análise Estratégica',
  ];



  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError('');
    
    if (file) {
      const validation = validateFile(file, MAX_PAGES, MAX_FILE_SIZE_MB);
      if (validation.isValid) {
        setSelectedFile(file);
      } else {
        setSelectedFile(null);
        setFileError(validation.error);
      }
    } else {
      setSelectedFile(null);
    }
  }, []);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    setFileError('');
    
    if (file) {
      const validation = validateFile(file, MAX_PAGES, MAX_FILE_SIZE_MB);
      if (validation.isValid) {
        setSelectedFile(file);
      } else {
        setSelectedFile(null);
        setFileError(validation.error);
      }
    }
  };

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setFileError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleAnalysisClick = useCallback(async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!selectedFile) {
      setFileError('Por favor, selecione um arquivo PDF primeiro.');
      return;
    }

    // Validação final antes do processamento
    const validation = validateFile(selectedFile, MAX_PAGES, MAX_FILE_SIZE_MB);
    if (!validation.isValid) {
      setFileError(validation.error);
      return;
    }

    onAnalysisStart(selectedFile.name, analysisType);

    // Simulação de processamento da IA
    // Em um cenário real, o arquivo seria enviado para um servidor e a resposta da IA
    // seria retornada aqui.
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Simulação do resultado da análise da IA
    const mockResult: AnalysisResult = {
      sucesso: true,
      resposta: `Análise de **${selectedFile.name}** concluída com sucesso.`,
      metadata: {
        documentId: 'doc-' + Math.random().toString(36).substr(2, 9),
        fileName: selectedFile.name,
        analysisType: analysisType,
        fileUrl: 'simulated-url',
        modelo: 'IA-Juris-v1',
        timestamp: new Date().toISOString(),
      },
    };

    onAnalysisComplete(mockResult);

  }, [selectedFile, analysisType, onAnalysisStart, onAnalysisComplete]);

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
            Análise Inteligente de Documentos
          </h2>
        </div>

        {/* Informações sobre limites */}
        <div className="mb-4 p-3 rounded-lg"
             style={{ backgroundColor: 'rgba(176, 130, 90, 0.1)', border: '1px solid rgba(176, 130, 90, 0.2)' }}>
          <p className="text-sm" style={{ color: '#d4d4d4' }}>
            📄 <strong>Limites atuais:</strong> Documentos de até {MAX_PAGES} páginas e {MAX_FILE_SIZE_MB}MB para análise otimizada
          </p>
        </div>

        {/* Área de Drag and Drop */}
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="relative p-8 border-2 border-dashed rounded-xl text-center transition-colors duration-300 cursor-pointer"
          style={{
            borderColor: fileError ? 'rgba(239, 68, 68, 0.5)' : 'rgba(176, 130, 90, 0.5)',
            backgroundColor: fileError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(176, 130, 90, 0.1)',
            minHeight: '200px'
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
          {selectedFile ? (
            <div className="flex items-center justify-center p-4 rounded-xl"
                 style={{ backgroundColor: 'rgba(176, 130, 90, 0.2)' }}>
              <FileText className="w-6 h-6 mr-2" style={{ color: '#b0825a' }} />
              <div className="flex flex-col items-start">
                <span className="text-white font-medium">{selectedFile.name}</span>
                <span className="text-xs" style={{ color: '#d4d4d4' }}>
                  {(selectedFile.size / (1024 * 1024)).toFixed(1)}MB • ~{estimatePages(selectedFile.size)} páginas estimadas
                </span>
              </div>
              <button onClick={(e) => { e.stopPropagation(); handleRemoveFile(); }}
                      className="ml-auto p-1 rounded-full hover:bg-gray-700 transition-colors"
                      title="Remover arquivo">
                <XCircle className="w-5 h-5" style={{ color: '#d4d4d4' }} />
              </button>
            </div>
          ) : (
            <>
              <div className="flex justify-center mb-2">
                <Upload className="w-12 h-12" style={{ color: fileError ? '#ef4444' : '#b0825a' }} />
              </div>
              <p className="font-semibold text-white">Arraste e solte um arquivo PDF aqui</p>
              <p className="text-sm" style={{ color: '#d4d4d4' }}>ou clique para selecionar</p>
            </>
          )}
        </div>

        {/* Mensagem de erro */}
        {fileError && (
          <div className="mt-4 p-3 rounded-lg flex items-center"
               style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <AlertCircle className="w-5 h-5 mr-2" style={{ color: '#ef4444' }} />
            <span className="text-sm" style={{ color: '#ef4444' }}>{fileError}</span>
          </div>
        )}

        {/* Opções de Análise */}
        <div className="mt-6">
          <label className="block text-sm font-medium mb-2" style={{ color: '#d4d4d4' }}>
            Tipo de Análise
          </label>
          <select
            value={analysisType}
            onChange={(e) => setAnalysisType(e.target.value)}
            className="w-full p-3 rounded-xl border appearance-none text-white"
            style={{
              backgroundColor: 'rgba(20, 20, 20, 0.8)',
              borderColor: 'rgba(176, 130, 90, 0.3)',
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%23b0825a'%3e%3cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd' /%3e%3c/svg%3e")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.75rem center',
              backgroundSize: '1.5em 1.5em',
            }}
          >
            {analysisOptions.map(option => (
              <option key={option} value={option} className="bg-gray-800 text-white">
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Botão de Análise */}
      <div className="flex justify-center">
        <button
          onClick={handleAnalysisClick}
          disabled={!selectedFile || !!fileError}
          className="px-8 py-3 rounded-xl flex items-center font-bold text-white transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          style={{
            background: (!selectedFile || fileError) 
              ? 'rgba(107, 114, 128, 0.8)' 
              : 'linear-gradient(90deg, rgba(176,130,90,1) 0%, rgba(200,160,120,1) 100%)',
            boxShadow: (!selectedFile || fileError) 
              ? 'none' 
              : '0 4px 15px rgba(176, 130, 90, 0.4)'
          }}
        >
          Analisar Documento
          <ChevronRight className="ml-2 w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
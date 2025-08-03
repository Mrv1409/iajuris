'use client';

import React, { useState, useRef } from 'react';//eslint-disable-next-line
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';

// Interface para os tipos de análise disponíveis
const ANALYSIS_TYPES = {
    'resumo': 'Resumo Executivo',
    'timeline': 'Cronologia do Processo',
    'partes': 'Identificação das Partes',
    'decisoes': 'Decisões Principais',
    'estrategia': 'Análise Estratégica',
    'completa': 'Análise Completa'
};

// Interface para o resultado da análise (supondo que a estrutura venha da sua API)
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

// Props do componente
interface PdfUploaderProps {
    clientId: string;
    onAnalysisComplete?: (result: AnalysisResult) => void;
    onError?: (error: string) => void;
    onProcessingStart?: (fileName: string, analysisType: string) => void;
}

const PdfUploader: React.FC<PdfUploaderProps> = ({ 
    clientId, 
    onAnalysisComplete, 
    onError,
    onProcessingStart 
}) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [analysisType, setAnalysisType] = useState<string>('completa');
    const [isProcessing, setIsProcessing] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [statusMessage, setStatusMessage] = useState<string>('');
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Validação de arquivo
    const validateFile = (file: File): string | null => {
        // Verifica tipo
        if (file.type !== 'application/pdf') {
            return 'Apenas arquivos PDF são aceitos.';
        }

        // Verifica tamanho (máximo 50MB)
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
            return 'O arquivo deve ter no máximo 50MB.';
        }

        // Verifica se o nome do arquivo é válido
        if (!file.name || file.name.trim() === '') {
            return 'Nome do arquivo inválido.';
        }

        return null;
    };

    // Handler para seleção de arquivo
    const handleFileSelect = (file: File) => {
        const validationError = validateFile(file);
        
        if (validationError) {
            setErrorMessage(validationError);
            onError?.(validationError);
            return;
        }

        setSelectedFile(file);
        setErrorMessage('');
    };

    // Handler para input de arquivo
    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    // Handlers para drag and drop
    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const files = e.dataTransfer.files;
        if (files?.[0]) {
            handleFileSelect(files[0]);
        }
    };

    // Função para processar análise com retry e backoff exponencial
    const handleAnalysis = async () => {
        if (!selectedFile || !clientId) {
            const error = 'Arquivo ou ID do cliente não fornecido.';
            setErrorMessage(error);
            onError?.(error);
            return;
        }

        setIsProcessing(true);
        setErrorMessage('');
        onProcessingStart?.(selectedFile.name, ANALYSIS_TYPES[analysisType as keyof typeof ANALYSIS_TYPES]);

        const maxRetries = 3;
        let retryCount = 0;
        let success = false;

        while (retryCount < maxRetries && !success) {
            try {
                setStatusMessage(`Processando... (tentativa ${retryCount + 1} de ${maxRetries})`);
                const formData = new FormData();
                formData.append('file', selectedFile);
                formData.append('analysisType', analysisType);
                formData.append('clientId', clientId);

                const response = await fetch('/api/pdf-analysis', {
                    method: 'POST',
                    body: formData,
                });

                const result = await response.json();

                if (!response.ok || !result.sucesso) {
                    throw new Error(result.resposta || result.error || 'Erro ao processar análise');
                }

                // Sucesso
                onAnalysisComplete?.(result);
                success = true;
                setStatusMessage('Análise concluída com sucesso!');
            } catch (error) {
                console.error(`Erro na tentativa ${retryCount + 1}:`, error);
                retryCount++;
                if (retryCount < maxRetries) {
                    const delay = Math.pow(2, retryCount) * 1000; // Backoff exponencial (1s, 2s, 4s)
                    setStatusMessage(`Erro. Tentando novamente em ${delay / 1000} segundos...`);
                    await new Promise(res => setTimeout(res, delay));
                } else {
                    const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido ao processar arquivo';
                    setErrorMessage(errorMsg);
                    onError?.(errorMsg);
                    setStatusMessage('');
                }
            }
        }
        setIsProcessing(false);
    };

    // Função para remover arquivo selecionado
    const removeSelectedFile = () => {
        setSelectedFile(null);
        setErrorMessage('');
        setStatusMessage('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Função para abrir seletor de arquivo
    const openFileSelector = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="w-full max-w-2xl mx-auto p-8 bg-gray-900 rounded-3xl shadow-xl border border-gray-800">
            <div className="mb-8 text-center">
                <h2 className="text-3xl font-extrabold text-white mb-2">
                    Análise de Documento Jurídico
                </h2>
                <p className="text-gray-400">
                    Envie um documento PDF para análise automatizada e inteligente.
                </p>
            </div>

            {/* Área de Upload */}
            <div
                className={`relative border-2 rounded-2xl p-8 text-center transition-all duration-300 ${
                    dragActive
                        ? 'border-[#b0825a] bg-gray-800 scale-[1.01]'
                        : selectedFile
                        ? 'border-gray-700 bg-gray-800'
                        : 'border-gray-700 hover:border-[#b0825a] hover:bg-gray-800'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileInputChange}
                    className="hidden"
                />

                {selectedFile ? (
                    // Arquivo selecionado
                    <div className="flex flex-col items-center justify-between p-4 bg-gray-700 rounded-xl">
                        <div className="flex items-center space-x-3 mb-4">
                            <FileText className="h-10 w-10 text-[#b0825a]" />
                            <div className="text-left">
                                <p className="font-medium text-white break-words w-full">{selectedFile.name}</p>
                                <p className="text-sm text-gray-400">
                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={removeSelectedFile}
                            className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
                            disabled={isProcessing}
                        >
                            Remover Arquivo
                        </button>
                    </div>
                ) : (
                    // Área de upload vazia
                    <div>
                        <Upload className="mx-auto h-16 w-16 text-gray-500 mb-4" />
                        <p className="text-xl font-bold text-gray-300 mb-2">
                            Arraste e solte seu PDF aqui
                        </p>
                        <p className="text-gray-500 mb-4">ou</p>
                        <button
                            onClick={openFileSelector}
                            className="bg-[#b0825a] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#a17752] transition-colors shadow-lg"
                            disabled={isProcessing}
                        >
                            Selecionar Arquivo
                        </button>
                        <p className="text-xs text-gray-500 mt-4">
                            Máximo: 50MB • Formato: PDF
                        </p>
                    </div>
                )}
            </div>

            {/* Mensagem de status */}
            {statusMessage && (
                <div className="mt-6 p-4 bg-gray-800 border border-gray-700 rounded-xl flex items-center space-x-3 shadow-md">
                    <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0" />
                    <p className="text-gray-300">{statusMessage}</p>
                </div>
            )}
            
            {/* Mensagem de erro */}
            {errorMessage && (
                <div className="mt-6 p-4 bg-red-900 border border-red-700 rounded-xl flex items-center space-x-3 shadow-md">
                    <AlertCircle className="h-6 w-6 text-red-400 flex-shrink-0" />
                    <p className="text-red-300">{errorMessage}</p>
                </div>
            )}

            {/* Seletor de tipo de análise */}
            {selectedFile && (
                <div className="mt-8">
                    <label className="block text-md font-medium text-gray-300 mb-2">
                        Tipo de Análise
                    </label>
                    <select
                        value={analysisType}
                        onChange={(e) => setAnalysisType(e.target.value)}
                        disabled={isProcessing}
                        className="w-full p-4 bg-gray-800 border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-[#b0825a] focus:border-[#b0825a] disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
                    >
                        {Object.entries(ANALYSIS_TYPES).map(([key, label]) => (
                            <option key={key} value={key}>
                                {label}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Botão de análise */}
            {selectedFile && (
                <div className="mt-8">
                    <button
                        onClick={handleAnalysis}
                        disabled={isProcessing || !selectedFile}
                        className="w-full bg-[#b0825a] text-white py-4 px-6 rounded-xl font-extrabold text-lg hover:bg-[#a17752] disabled:bg-gray-700 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center space-x-3"
                    >
                        {isProcessing ? (
                            <>
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                <span>{statusMessage}</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle className="h-6 w-6" />
                                <span>Iniciar Análise</span>
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Informações adicionais */}
            <div className="mt-8 p-6 bg-gray-800 border border-gray-700 rounded-xl shadow-md">
                <h3 className="font-semibold text-white mb-3">Tipos de Análise Disponíveis:</h3>
                <ul className="text-sm text-gray-400 space-y-2">
                    <li><strong>Resumo Executivo:</strong> Visão geral em 3-4 parágrafos.</li>
                    <li><strong>Cronologia:</strong> Linha do tempo detalhada do processo.</li>
                    <li><strong>Partes:</strong> Identificação de autores, réus e advogados.</li>
                    <li><strong>Decisões:</strong> Principais julgados e sentenças.</li>
                    <li><strong>Estratégia:</strong> Análise de pontos favoráveis e desfavoráveis.</li>
                    <li><strong>Completa:</strong> Análise abrangente com todos os aspectos.</li>
                </ul>
            </div>
        </div>
    );
};

export default PdfUploader;
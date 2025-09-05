'use client';
//eslint-disable-next-line
import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Info, Clock, Zap, Loader2 } from 'lucide-react';

// Interface para os tipos de análise disponíveis
const ANALYSIS_TYPES = {
    'resumo': 'Resumo Executivo',
    'timeline': 'Cronologia do Processo',
    'partes': 'Identificação das Partes',
    'decisoes': 'Decisões Principais',
    'estrategia': 'Análise Estratégica',
    'completa': 'Análise Completa'
};

// 🚀 LIMITES ALINHADOS COM API (50MB + CHUNKING AUTOMÁTICO)
// Compatível com middleware de 200k tokens e chunking de 25 seções
const ANALYSIS_LIMITS = {
    'resumo': {
        maxFileSize: 50 * 1024 * 1024,   // ✅ ALINHADO: 50MB (igual à API)
        maxPages: 100,                   // ✅ EXPANDIDO: até 100 páginas com chunking
        maxTextChars: 500000,            // ✅ EXPANDIDO: ~250k tokens (chunking automático)
        description: 'Síntese objetiva em 2-3 parágrafos',
        responseTokens: 600,
        complexity: 'baixa',
        estimatedTime: '5-10 min',
        maxChunks: 15
    },
    'timeline': {
        maxFileSize: 50 * 1024 * 1024,   // ✅ ALINHADO: 50MB
        maxPages: 100,                   // ✅ EXPANDIDO: até 100 páginas com chunking
        maxTextChars: 500000,            // ✅ EXPANDIDO: ~250k tokens
        description: 'Cronologia detalhada dos eventos',
        responseTokens: 800,
        complexity: 'média',
        estimatedTime: '8-15 min',
        maxChunks: 20
    },
    'partes': {
        maxFileSize: 50 * 1024 * 1024,   // ✅ ALINHADO: 50MB
        maxPages: 100,                   // ✅ EXPANDIDO: até 100 páginas com chunking
        maxTextChars: 500000,            // ✅ EXPANDIDO: ~250k tokens
        description: 'Identificação completa dos envolvidos',
        responseTokens: 500,
        complexity: 'baixa',
        estimatedTime: '5-10 min',
        maxChunks: 15
    },
    'decisoes': {
        maxFileSize: 50 * 1024 * 1024,   // ✅ ALINHADO: 50MB
        maxPages: 100,                   // ✅ EXPANDIDO: até 100 páginas com chunking
        maxTextChars: 500000,            // ✅ EXPANDIDO: ~250k tokens
        description: 'Extração de sentenças e julgados',
        responseTokens: 1000,
        complexity: 'média',
        estimatedTime: '8-15 min',
        maxChunks: 20
    },
    'estrategia': {
        maxFileSize: 50 * 1024 * 1024,   // ✅ ALINHADO: 50MB
        maxPages: 100,                   // ✅ EXPANDIDO: até 100 páginas com chunking
        maxTextChars: 500000,            // ✅ EXPANDIDO: ~250k tokens
        description: 'Análise estratégica profunda',
        responseTokens: 1200,
        complexity: 'alta',
        estimatedTime: '10-20 min',
        maxChunks: 25
    },
    'completa': {
        maxFileSize: 50 * 1024 * 1024,   // ✅ ALINHADO: 50MB
        maxPages: 100,                   // ✅ EXPANDIDO: até 100 páginas com chunking
        maxTextChars: 500000,            // ✅ EXPANDIDO: ~250k tokens (middleware suporta)
        description: 'Análise abrangente e detalhada',
        responseTokens: 1500,
        complexity: 'muito alta',
        estimatedTime: '15-25 min',
        maxChunks: 25
    }
};

// 🚀 ESTIMADOR DE TOKENS (simulando o da API)
class TokenEstimator {
    static estimateTokens(text: string): number {
        // Estimativa baseada no padrão da API: ~2.5 caracteres por token para texto português
        return Math.ceil(text.length / 2.5);
    }
    
    static estimateProcessingTime(tokens: number): number {
        // Baseado na configuração da API: 6K TPM com 15s entre chunks
        const chunks = Math.ceil(tokens / 4000); // MAX_TOKENS_PER_CHUNK da API
        const baseTime = chunks * 15; // 15s por chunk
        const consolidationTime = chunks > 1 ? 30 : 0; // 30s para consolidação
        return Math.ceil((baseTime + consolidationTime) / 60); // em minutos
    }
}

// Interface para o progresso do processamento
interface ProcessingProgress {
    stage: string;
    currentChunk: number;
    totalChunks: number;
    estimatedTimeRemaining: number;
    message: string;
}

// Interface para o resultado da análise
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
        chunksProcessed?: number;
        totalTokensUsed?: number;
        processingTimeMinutes?: number;
    };
}

// Props do componente
interface PdfUploaderProps {
    clientId: string;
    onAnalysisComplete?: (result: AnalysisResult) => void;
    onError?: (error: string, errorCode?: string) => void;
    onProcessingStart?: (fileName: string, analysisType: string) => void;
    onProcessingProgress?: (progress: ProcessingProgress) => void;
}

// Função para extrair número de páginas do PDF
const extractPageCount = async (file: File): Promise<number> => {
    try {//eslint-disable-next-line
        if (typeof window !== 'undefined' && (window as any).pdfjsLib) {
            const arrayBuffer = await file.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);//eslint-disable-next-line
            const pdf = await (window as any).pdfjsLib.getDocument({ data: uint8Array }).promise;
            return pdf.numPages;
        }
        
        // Estimativa melhorada baseada no tamanho para PDFs jurídicos
        const sizeInMB = file.size / (1024 * 1024);
        const estimatedPages = Math.ceil(sizeInMB * 1.5); // Mais conservadora para PDFs densos
        console.log(`Estimando ${estimatedPages} páginas para arquivo de ${sizeInMB.toFixed(2)}MB`);
        return estimatedPages;
        
    } catch (error) {
        console.error('Erro ao extrair páginas do PDF:', error);
        const sizeInMB = file.size / (1024 * 1024);
        return Math.ceil(sizeInMB * 2); // Fallback mais conservador
    }
};

// Função para estimar tamanho do texto e tokens
const estimateDocumentComplexity = async (file: File): Promise<{
    estimatedChars: number;
    estimatedTokens: number;
    estimatedChunks: number;
    processingTimeMinutes: number;
}> => {
    try {
        const sizeInMB = file.size / (1024 * 1024);
        
        // Estimativa melhorada para PDFs jurídicos (mais texto por MB)
        const estimatedChars = Math.ceil(sizeInMB * 6000); // 6k chars por MB (PDFs densos)
        const estimatedTokens = TokenEstimator.estimateTokens(' '.repeat(estimatedChars));
        const estimatedChunks = Math.max(1, Math.ceil(estimatedTokens / 4000)); // 4K tokens por chunk (da API)
        const processingTimeMinutes = TokenEstimator.estimateProcessingTime(estimatedTokens);
        
        console.log(`Estimativas para ${sizeInMB.toFixed(2)}MB:`, {
            chars: estimatedChars,
            tokens: estimatedTokens,
            chunks: estimatedChunks,
            timeMinutes: processingTimeMinutes
        });
        
        return {
            estimatedChars,
            estimatedTokens,
            estimatedChunks,
            processingTimeMinutes
        };
    } catch (error) {
        console.error('Erro ao estimar complexidade:', error);
        return {
            estimatedChars: 0,
            estimatedTokens: 0,
            estimatedChunks: 1,
            processingTimeMinutes: 5
        };
    }
};

const PdfUploader: React.FC<PdfUploaderProps> = ({ 
    clientId, 
    onAnalysisComplete, 
    onError,
    onProcessingStart,
    onProcessingProgress 
}) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [analysisType, setAnalysisType] = useState<string>('completa');
    const [isProcessing, setIsProcessing] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [statusMessage, setStatusMessage] = useState<string>('');
    const [validationInfo, setValidationInfo] = useState<{
        pages?: number;
        estimatedChars?: number;
        estimatedTokens?: number;
        estimatedChunks?: number;
        processingTimeMinutes?: number;
        isValid: boolean;
        warning?: string;
    }>({ isValid: false });
    
    // Estado para progresso detalhado
    const [processingProgress, setProcessingProgress] = useState<ProcessingProgress | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 🚀 VALIDAÇÃO AVANÇADA ALINHADA COM API
    const validateFile = async (file: File, currentAnalysisType: string): Promise<string | null> => {
        const limits = ANALYSIS_LIMITS[currentAnalysisType as keyof typeof ANALYSIS_LIMITS];
        
        // 1. Verificação básica de tipo
        if (file.type !== 'application/pdf') {
            return 'Apenas arquivos PDF são aceitos.';
        }

        // 2. Verificação de tamanho ALINHADA COM API (50MB para todos)
        if (file.size > limits.maxFileSize) {
            return `Arquivo muito grande. Tamanho máximo: ${(limits.maxFileSize / 1024 / 1024).toFixed(0)}MB para todos os tipos de análise.`;
        }

        // 3. Verificação de nome do arquivo
        if (!file.name || file.name.trim() === '') {
            return 'Nome do arquivo inválido.';
        }

        try {
            setStatusMessage('Analisando estrutura do documento...');
            
            // 4. Análise avançada da complexidade
            const pageCount = await extractPageCount(file);
            const complexity = await estimateDocumentComplexity(file);
            
            // 5. Validação de páginas (expandida para 100 páginas)
            if (pageCount > limits.maxPages) {
                return `Documento com muitas páginas. Máximo: ${limits.maxPages} páginas para ${ANALYSIS_TYPES[currentAnalysisType as keyof typeof ANALYSIS_TYPES]}. Seu documento: ~${pageCount} páginas.`;
            }

            // 6. Validação de tokens (nova - alinhada com middleware)
            if (complexity.estimatedTokens > 200000) {
                return `Documento muito extenso. Tokens estimados: ${Math.floor(complexity.estimatedTokens / 1000)}k. Máximo suportado pelo sistema: 200k tokens.`;
            }

            // 7. Validação de chunks (nova - alinhada com API)
            if (complexity.estimatedChunks > limits.maxChunks) {
                return `Documento requer muitos chunks para processamento. Estimado: ${complexity.estimatedChunks} chunks. Máximo para ${ANALYSIS_TYPES[currentAnalysisType as keyof typeof ANALYSIS_TYPES]}: ${limits.maxChunks} chunks.`;
            }

            // 8. Warnings para documentos grandes
            let warning = '';
            if (complexity.processingTimeMinutes > 10) {
                warning = `Documento grande detectado. Tempo estimado: ${complexity.processingTimeMinutes} minutos com ${complexity.estimatedChunks} chunks.`;
            }

            // Armazenar informações detalhadas de validação
            setValidationInfo({
                pages: pageCount,
                estimatedChars: complexity.estimatedChars,
                estimatedTokens: complexity.estimatedTokens,
                estimatedChunks: complexity.estimatedChunks,
                processingTimeMinutes: complexity.processingTimeMinutes,
                isValid: true,
                warning
            });

            setStatusMessage('');
            return null;

        } catch (error) {
            console.error('Erro na validação avançada:', error);
            return 'Erro ao analisar estrutura do PDF. Verifique se o arquivo não está corrompido.';
        }
    };

    // Handler para seleção de arquivo
    const handleFileSelect = async (file: File) => {
        setErrorMessage('');
        setValidationInfo({ isValid: false });
        
        const validationError = await validateFile(file, analysisType);
        
        if (validationError) {
            setErrorMessage(validationError);
            onError?.(validationError);
            return;
        }

        setSelectedFile(file);
    };

    // Handler para mudança no tipo de análise
    const handleAnalysisTypeChange = async (newType: string) => {
        setAnalysisType(newType);
        
        if (selectedFile) {
            setErrorMessage('');
            const validationError = await validateFile(selectedFile, newType);
            
            if (validationError) {
                setErrorMessage(validationError);
            }
        }
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

    //eslint-disable-next-line
    const handleApiError = (error: any, response?: Response) => {
        let errorMessage = '';
        let errorCode = '';

        if (response) {
            // Tratamento baseado nos códigos de erro da API
            if (response.status === 402) {
                errorCode = 'SUBSCRIPTION_INACTIVE';
                errorMessage = 'Serviço de análise temporariamente indisponível. Nossa equipe entrará em contato em breve.';
            } else if (response.status === 429) {
                errorCode = 'RATE_LIMIT';
                errorMessage = 'Limite de análises atingido. Aguarde alguns minutos e tente novamente.';
            } else if (response.status === 400) {
                errorMessage = error.resposta || 'Arquivo inválido ou incompatível.';
            } else {
                errorMessage = error.resposta || 'Erro no processamento da análise.';
            }
        } else {
            errorMessage = error instanceof Error ? error.message : 'Erro de conexão. Verifique sua internet e tente novamente.';
        }

        setErrorMessage(errorMessage);
        onError?.(errorMessage, errorCode);
    };

    // 🚀 FUNÇÃO DE ANÁLISE COM PROGRESS TRACKING
    const handleAnalysis = async () => {
        if (!selectedFile || !clientId || !validationInfo.isValid) {
            const error = 'Arquivo inválido ou não validado.';
            setErrorMessage(error);
            onError?.(error);
            return;
        }

        setIsProcessing(true);
        setErrorMessage('');
        setProcessingProgress(null);
        
        onProcessingStart?.(selectedFile.name, ANALYSIS_TYPES[analysisType as keyof typeof ANALYSIS_TYPES]);

        // Configura progresso inicial
        const initialProgress: ProcessingProgress = {
            stage: 'upload',
            currentChunk: 0,
            totalChunks: validationInfo.estimatedChunks || 1,
            estimatedTimeRemaining: validationInfo.processingTimeMinutes || 5,
            message: 'Enviando arquivo e iniciando processamento...'
        };
        
        setProcessingProgress(initialProgress);
        onProcessingProgress?.(initialProgress);

        const maxRetries = 3;
        let retryCount = 0;
        let success = false;

        while (retryCount < maxRetries && !success) {
            try {
                const progress = {
                    ...initialProgress,
                    stage: retryCount > 0 ? 'retry' : 'processing',
                    message: retryCount > 0 ? 
                        `Tentativa ${retryCount + 1} de ${maxRetries} - Processando com IA...` : 
                        'Processando com IA... (isso pode levar alguns minutos)'
                };
                
                setProcessingProgress(progress);
                onProcessingProgress?.(progress);

                const formData = new FormData();
                formData.append('file', selectedFile);
                formData.append('analysisType', analysisType);
                formData.append('clientId', clientId);
                formData.append('advogadoId', clientId); // Adicionado para compatibilidade

                const response = await fetch('/api/pdf-analysis', {
                    method: 'POST',
                    body: formData,
                });

                const result = await response.json();

                if (!response.ok || !result.sucesso) {
                    throw { ...result, response };
                }

                // Sucesso
                const finalProgress: ProcessingProgress = {
                    stage: 'completed',
                    currentChunk: validationInfo.estimatedChunks || 1,
                    totalChunks: validationInfo.estimatedChunks || 1,
                    estimatedTimeRemaining: 0,
                    message: 'Análise concluída com sucesso!'
                };
                
                setProcessingProgress(finalProgress);
                onProcessingProgress?.(finalProgress);
                
                onAnalysisComplete?.(result);
                success = true;
                setStatusMessage('Análise concluída com sucesso!');
                //eslint-disable-next-line
            } catch (error: any) {
                console.error(`Erro na tentativa ${retryCount + 1}:`, error);
                retryCount++;
                
                if (retryCount < maxRetries) {
                    const delay = Math.pow(2, retryCount) * 1000;
                    const retryProgress: ProcessingProgress = {
                        stage: 'retry',
                        currentChunk: 0,
                        totalChunks: validationInfo.estimatedChunks || 1,
                        estimatedTimeRemaining: delay / 1000,
                        message: `Erro detectado. Tentando novamente em ${delay / 1000} segundos...`
                    };
                    
                    setProcessingProgress(retryProgress);
                    onProcessingProgress?.(retryProgress);
                    
                    await new Promise(res => setTimeout(res, delay));
                } else {
                    handleApiError(error, error.response);
                    setProcessingProgress(null);
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
        setValidationInfo({ isValid: false });
        setProcessingProgress(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Função para abrir seletor de arquivo
    const openFileSelector = () => {
        fileInputRef.current?.click();
    };

    // Obter limites do tipo atual
    const currentLimits = ANALYSIS_LIMITS[analysisType as keyof typeof ANALYSIS_LIMITS];

    return (
        <div className="w-full max-w-2xl mx-auto p-8 bg-gray-900 rounded-3xl shadow-xl border border-gray-800">
            <div className="mb-8 text-center">
                <h2 className="text-3xl font-extrabold text-white mb-2">
                    Análise PDF Avançada
                </h2>
                <p className="text-gray-400">
                    Sistema inteligente para documentos até 100 páginas com chunking automático
                </p>
            </div>

            {/* Seletor de tipo de análise */}
            <div className="mb-6">
                <label className="block text-md font-medium text-gray-300 mb-3">
                    Tipo de Análise
                </label>
                <select
                    value={analysisType}
                    onChange={(e) => handleAnalysisTypeChange(e.target.value)}
                    disabled={isProcessing}
                    className="w-full p-4 bg-gray-800 border border-gray-700 text-white rounded-xl focus:ring-2 focus:ring-[#b0825a] focus:border-[#b0825a] disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
                >
                    {Object.entries(ANALYSIS_TYPES).map(([key, label]) => (
                        <option key={key} value={key}>
                            {label}
                        </option>
                    ))}
                </select>
                
                {/* Informações sobre o tipo selecionado */}
                <div className="mt-3 p-3 bg-gray-800 border border-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-300">{currentLimits.description}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                            currentLimits.complexity === 'baixa' ? 'bg-green-900 text-green-300' :
                            currentLimits.complexity === 'média' ? 'bg-yellow-900 text-yellow-300' :
                            currentLimits.complexity === 'alta' ? 'bg-orange-900 text-orange-300' :
                            'bg-red-900 text-red-300'
                        }`}>
                            Complexidade: {currentLimits.complexity}
                        </span>
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-4">
                        <span>📁 50MB</span>
                        <span>📄 {currentLimits.maxPages} páginas</span>
                        <span>⏱️ {currentLimits.estimatedTime}</span>
                        <span>🔄 até {currentLimits.maxChunks} chunks</span>
                    </div>
                </div>
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
                        <div className="flex items-center space-x-3 mb-4 w-full">
                            <FileText className="h-10 w-10 text-[#b0825a] flex-shrink-0" />
                            <div className="text-left flex-grow min-w-0">
                                <p className="font-medium text-white truncate">{selectedFile.name}</p>
                                <p className="text-sm text-gray-400">
                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                                {validationInfo.isValid && (
                                    <div className="text-xs text-green-400 mt-1">
                                        <div>✅ ~{validationInfo.pages} páginas • ~{Math.floor((validationInfo.estimatedTokens || 0) / 1000)}k tokens</div>
                                        {validationInfo.estimatedChunks && validationInfo.estimatedChunks > 1 && (
                                            <div className="flex items-center gap-2 mt-1">
                                                <Zap className="h-3 w-3" />
                                                <span>{validationInfo.estimatedChunks} chunks • ~{validationInfo.processingTimeMinutes}min</span>
                                            </div>
                                        )}
                                    </div>
                                )}
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
                            Até 50MB • {currentLimits.maxPages} páginas • Chunking automático
                        </p>
                    </div>
                )}
            </div>

            {/* Warning para documentos grandes */}
            {validationInfo.warning && (
                <div className="mt-4 p-3 bg-yellow-900 border border-yellow-700 rounded-xl flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                    <p className="text-yellow-300 text-sm">{validationInfo.warning}</p>
                </div>
            )}

            {/* Progress Bar para processamento */}
            {processingProgress && (
                <div className="mt-6 p-4 bg-gray-800 border border-gray-700 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-300">Progresso</span>
                        <span className="text-sm text-gray-400">
                            {processingProgress.stage === 'completed' ? '100%' : 
                             `${Math.round((processingProgress.currentChunk / processingProgress.totalChunks) * 100)}%`}
                        </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
                        <div 
                            className="bg-[#b0825a] h-2 rounded-full transition-all duration-300"
                            style={{ 
                                width: processingProgress.stage === 'completed' ? '100%' :
                                       `${(processingProgress.currentChunk / processingProgress.totalChunks) * 100}%` 
                            }}
                        ></div>
                    </div>
                    <div className="flex items-center space-x-2">
                        {processingProgress.stage !== 'completed' && (
                            <Loader2 className="h-4 w-4 text-[#b0825a] animate-spin" />
                        )}
                        <span className="text-sm text-gray-300">{processingProgress.message}</span>
                    </div>
                    {processingProgress.totalChunks > 1 && processingProgress.stage === 'processing' && (
                        <div className="text-xs text-gray-400 mt-2">
                            Chunk {processingProgress.currentChunk + 1} de {processingProgress.totalChunks} 
                            {processingProgress.estimatedTimeRemaining > 0 && 
                             ` • ~${processingProgress.estimatedTimeRemaining}min restantes`}
                        </div>
                    )}
                </div>
            )}

            {/* Mensagem de status */}
            {statusMessage && !processingProgress && (
                <div className="mt-6 p-4 bg-gray-800 border border-gray-700 rounded-xl flex items-center space-x-3 shadow-md">
                    <CheckCircle className="h-6 w-6 text-blue-400 flex-shrink-0" />
                    <p className="text-gray-300">{statusMessage}</p>
                </div>
            )}
            
            {/* Mensagem de erro */}
            {errorMessage && (
                <div className="mt-6 p-4 bg-red-900 border border-red-700 rounded-xl flex items-center space-x-3 shadow-md">
                    <AlertCircle className="h-6 w-6 text-red-400 flex-shrink-0" />
                    <div className="flex-grow">
                        <p className="text-red-300">{errorMessage}</p>
                        {selectedFile && !validationInfo.isValid && (
                            <p className="text-red-400 text-sm mt-1">
                                Sugestão: Tente um tipo de análise mais simples ou um documento menor.
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Botão de análise */}
            {selectedFile && validationInfo.isValid && (
                <div className="mt-8">
                    <button
                        onClick={handleAnalysis}
                        disabled={isProcessing || !validationInfo.isValid}
                        className="w-full bg-[#b0825a] text-white py-4 px-6 rounded-xl font-extrabold text-lg hover:bg-[#a17752] disabled:bg-gray-700 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center space-x-3"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="h-6 w-6 animate-spin" />
                                <span>Processando com IA...</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle className="h-6 w-6" />
                                <span>Iniciar {ANALYSIS_TYPES[analysisType as keyof typeof ANALYSIS_TYPES]}</span>
                            </>
                        )}
                    </button>
                    
                    {/* Estimativas detalhadas */}
                    {validationInfo.estimatedChunks && validationInfo.estimatedChunks > 1 && (
                        <div className="mt-3 text-center">
                            <p className="text-xs text-gray-500">
                                Este documento será processado em {validationInfo.estimatedChunks} partes 
                                com ~15 segundos entre cada uma (TPM: 6K tokens/min)
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Informações adicionais do sistema */}
            <div className="mt-8 p-6 bg-gray-800 border border-gray-700 rounded-xl shadow-md">
                <h3 className="font-semibold text-white mb-3 flex items-center">
                    <Info className="h-5 w-5 mr-2 text-[#b0825a]" />
                    Sistema de Análise Avançada
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-400">
                    <div>
                        <h4 className="text-gray-300 font-medium mb-2">Tipos de Análise:</h4>
                        <ul className="space-y-1">
                            <li><strong>Resumo:</strong> Síntese objetiva (5-10min)</li>
                            <li><strong>Timeline:</strong> Cronologia detalhada (8-15min)</li>
                            <li><strong>Partes:</strong> Identificação completa (5-10min)</li>
                            <li><strong>Decisões:</strong> Extração de julgados (8-15min)</li>
                            <li><strong>Estratégia:</strong> Análise profunda (10-20min)</li>
                            <li><strong>Completa:</strong> Análise abrangente (15-25min)</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-gray-300 font-medium mb-2">Recursos Técnicos:</h4>
                        <ul className="space-y-1">
                            <li>• <strong>Chunking Inteligente:</strong> Divisão automática por seções</li>
                            <li>• <strong>Rate Limiting:</strong> 6K tokens/min otimizado</li>
                            <li>• <strong>Retry System:</strong> Recuperação automática</li>
                            <li>• <strong>Token Management:</strong> Monitoramento em tempo real</li>
                            <li>• <strong>Progress Tracking:</strong> Feedback detalhado</li>
                            <li>• <strong>Middleware:</strong> Suporte até 200K tokens</li>
                        </ul>
                    </div>
                </div>
                
                <div className="mt-4 p-3 bg-gray-700 rounded-lg">
                    <p className="text-xs text-gray-400">
                        <strong>Limites Atuais:</strong> 50MB por arquivo • 100 páginas • 
                        25 chunks máximo por análise • Processamento sequencial com delay otimizado
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PdfUploader;
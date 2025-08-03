'use client';

import React, { useState, useEffect } from 'react';
import { 
    Upload, 
    FileText, 
    Brain, 
    Database, 
    CheckCircle, 
    Loader2,
    Clock,
    X,
    AlertCircle,
    HardDrive, // Ícone para substituir o emoji de gráfico
    RotateCw,
} from 'lucide-react';

// Interface para as etapas do processamento
interface ProcessingStep {
    id: string;
    label: string;
    description: string;
    icon: React.ReactNode;
    status: 'waiting' | 'processing' | 'completed' | 'error';
}

// Props do componente
interface ProcessingLoaderProps {
    fileName?: string;
    fileSize?: number;
    analysisType?: string;
    onCancel?: () => void;
    isProcessing?: boolean;
    error?: string;
}

const ProcessingLoader: React.FC<ProcessingLoaderProps> = ({
    fileName = 'documento.pdf',
    fileSize = 0,
    analysisType = 'Análise Completa',
    onCancel,
    isProcessing = true,
    error
}) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);

    // Definição das etapas do processamento
    const steps: ProcessingStep[] = [
        {
            id: 'upload',
            label: 'Upload do Arquivo',
            description: 'Enviando documento para o servidor...',
            icon: <Upload className="h-6 w-6" />,
            status: 'waiting'
        },
        {
            id: 'extract',
            label: 'Extração de Texto',
            description: 'Extraindo conteúdo do PDF...',
            icon: <FileText className="h-6 w-6" />,
            status: 'waiting'
        },
        {
            id: 'analyze',
            label: 'Análise com IA',
            description: 'Processando com inteligência artificial...',
            icon: <Brain className="h-6 w-6" />,
            status: 'waiting'
        },
        {
            id: 'save',
            label: 'Salvamento',
            description: 'Armazenando resultado no sistema...',
            icon: <Database className="h-6 w-6" />,
            status: 'waiting'
        }
    ];

    // Efeito para simular o progresso das etapas
    useEffect(() => {
        if (!isProcessing || error) return;

        const interval = setInterval(() => {
            setCurrentStep(prev => {
                if (prev < steps.length) {
                    return prev + 1;
                }
                return prev;
            });
        }, 2000); // Avança a cada 2 segundos para simular o progresso

        return () => clearInterval(interval);
    }, [isProcessing, error, steps.length]);

    // Efeito para o temporizador do tempo decorrido
    useEffect(() => {
        if (!isProcessing || error) return;

        const timer = setInterval(() => {
            setElapsedTime(prev => prev + 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [isProcessing, error]);

    /**
     * @description Determina o status visual de cada etapa.
     * @param index O índice da etapa.
     * @returns O status da etapa ('waiting' | 'processing' | 'completed' | 'error').
     */
    const getStepStatus = (index: number): ProcessingStep['status'] => {
        if (error) {
            return 'error';
        }
        
        if (index < currentStep) return 'completed';
        if (index === currentStep && isProcessing) return 'processing';
        return 'waiting';
    };

    /**
     * @description Formata o tempo decorrido em minutos e segundos.
     * @param seconds O tempo em segundos.
     * @returns O tempo formatado como 'm:ss'.
     */
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    /**
     * @description Formata o tamanho do arquivo em uma string legível.
     * @param bytes O tamanho do arquivo em bytes.
     * @returns O tamanho formatado com a unidade correspondente.
     */
    const formatFileSize = (bytes: number): string => {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
    };

    return (
        <div className="w-full max-w-2xl mx-auto bg-gray-900 rounded-3xl shadow-xl border border-gray-800 overflow-hidden">
            {/* Cabeçalho */}
            <div className="bg-gradient-to-r from-[#b0825a] to-[#a17752] text-white p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                            </div>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">
                                {error ? 'Erro no Processamento' : 'Processando Análise'}
                            </h1>
                            <p className="text-gray-100 font-semibold">{analysisType}</p>
                        </div>
                    </div>
                    
                    {onCancel && (
                        <button
                            onClick={onCancel}
                            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-lg transition-colors"
                            title="Cancelar processamento"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    )}
                </div>
            </div>

            {/* Informações do arquivo */}
            <div className="p-6 bg-gray-800 border-b border-gray-700">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-gray-400">
                    <div className="flex items-start space-x-3">
                        <FileText className="h-6 w-6 text-[#b0825a] flex-shrink-0" />
                        <div>
                            <p className="text-sm">Arquivo</p>
                            <p className="font-semibold text-white truncate" title={fileName}>
                                {fileName}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start space-x-3">
                        <HardDrive className="h-6 w-6 text-[#b0825a] flex-shrink-0" />
                        <div>
                            <p className="text-sm">Tamanho</p>
                            <p className="font-semibold text-white">
                                {formatFileSize(fileSize)}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start space-x-3">
                        <Clock className="h-6 w-6 text-[#b0825a] flex-shrink-0" />
                        <div>
                            <p className="text-sm">Tempo Decorrido</p>
                            <p className="font-semibold text-white">
                                {formatTime(elapsedTime)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Etapas do processamento */}
            <div className="p-6">
                <h2 className="text-lg font-semibold text-white mb-6">
                    Progresso do Processamento
                </h2>

                <div className="space-y-4">
                    {steps.map((step, index) => {
                        const status = getStepStatus(index);
                        
                        return (
                            <div
                                key={step.id}
                                className={`flex items-center space-x-4 p-4 rounded-xl border transition-all duration-300 ${
                                    status === 'completed'
                                        ? 'border-green-800 bg-green-950/50'
                                        : status === 'processing'
                                        ? 'border-[#b0825a] bg-gray-700'
                                        : status === 'error'
                                        ? 'border-red-800 bg-red-950/50'
                                        : 'border-gray-700 bg-gray-800'
                                }`}
                            >
                                {/* Ícone da etapa */}
                                <div className={`flex-shrink-0 p-2 rounded-full ${
                                    status === 'completed'
                                        ? 'bg-green-600 text-white'
                                        : status === 'processing'
                                        ? 'bg-[#b0825a] text-white'
                                        : status === 'error'
                                        ? 'bg-red-600 text-white'
                                        : 'bg-gray-600 text-gray-300'
                                }`}>
                                    {status === 'completed' ? (
                                        <CheckCircle className="h-6 w-6" />
                                    ) : status === 'processing' ? (
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                    ) : status === 'error' ? (
                                        <AlertCircle className="h-6 w-6" />
                                    ) : (
                                        step.icon
                                    )}
                                </div>

                                {/* Conteúdo da etapa */}
                                <div className="flex-grow">
                                    <h3 className={`font-semibold ${
                                        status === 'completed'
                                            ? 'text-green-400'
                                            : status === 'processing'
                                            ? 'text-[#b0825a]'
                                            : status === 'error'
                                            ? 'text-red-400'
                                            : 'text-gray-400'
                                    }`}>
                                        {step.label}
                                    </h3>
                                    <p className={`text-sm ${
                                        status === 'completed'
                                            ? 'text-green-500'
                                            : status === 'processing'
                                            ? 'text-gray-300'
                                            : status === 'error'
                                            ? 'text-red-500'
                                            : 'text-gray-500'
                                    }`}>
                                        {status === 'completed'
                                            ? 'Concluído com sucesso'
                                            : status === 'processing'
                                            ? step.description
                                            : status === 'error'
                                            ? 'Erro nesta etapa'
                                            : step.description
                                        }
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Mensagem de erro */}
                {error && (
                    <div className="mt-6 p-4 bg-red-950 border border-red-900 rounded-xl">
                        <div className="flex items-center space-x-2">
                            <AlertCircle className="h-5 w-5 text-red-500" />
                            <h3 className="font-medium text-red-400">Erro no Processamento</h3>
                        </div>
                        <p className="text-red-300 mt-2">{error}</p>
                    </div>
                )}
            </div>

            {/* Rodapé com Dicas e Status */}
            <div className="p-6 bg-gray-800 border-t border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-medium text-gray-400">
                        Progresso Geral
                    </span>
                    <span className={`text-sm font-semibold ${error ? 'text-red-400' : 'text-[#b0825a]'}`}>
                        {error ? '0' : Math.round(((currentStep) / steps.length) * 100)}%
                    </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${
                            error ? 'bg-red-500' : 'bg-[#b0825a]'
                        }`}
                        style={{
                            width: error ? '100%' : `${((currentStep) / steps.length) * 100}%`
                        }}
                    ></div>
                </div>

                {!error && isProcessing && (
                    <div className="mt-6 p-4 bg-gray-900 border border-gray-700 rounded-xl">
                        <h3 className="font-semibold text-white mb-2 flex items-center space-x-2">
                           <RotateCw className="h-4 w-4 text-gray-400 animate-spin" />
                           <span> Dicas para o Processamento</span>
                        </h3>
                        <ul className="text-sm text-gray-400 space-y-1">
                            <li>• A análise pode levar alguns minutos, dependendo do tamanho do documento.</li>
                            <li>• Não feche esta página durante o processamento.</li>
                            <li>• O resultado será exibido automaticamente quando concluído.</li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProcessingLoader;
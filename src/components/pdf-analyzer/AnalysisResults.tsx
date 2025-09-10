'use client';

import React, { useState } from 'react';
import { 
    FileText, 
    Copy, 
    Download, 
    Printer, 
    Clock, 
    CheckCircle, 
    AlertCircle,
    HardDrive,
    Type,
    Calendar,
    Cpu,
    ChevronDown,
    ChevronUp
} from 'lucide-react';

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
    };
}

// Props do componente
interface AnalysisResultsProps {
    result: AnalysisResult;
    onClose?: () => void;
    onNewAnalysis?: () => void;
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ 
    result, 
    onClose, 
    onNewAnalysis 
}) => {
    const [copySuccess, setCopySuccess] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);

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

    /**
     * @description Formata o timestamp da análise em uma string de data e hora.
     * @param timestamp O timestamp da análise.
     * @returns A data e hora formatada.
     */
    const formatDate = (timestamp: string): string => {
        return new Date(timestamp).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    /**
     * @description Copia o texto da análise para a área de transferência.
     * @returns {Promise<void>}
     */
    const handleCopyText = () => {
        const tempTextArea = document.createElement('textarea');
        tempTextArea.value = result.resposta;
        document.body.appendChild(tempTextArea);
        tempTextArea.select();
        try {
            document.execCommand('copy');
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error('Erro ao copiar texto:', err);
        } finally {
            document.body.removeChild(tempTextArea);
        }
    };

    /**
     * @description Prepara e baixa o resultado da análise como um arquivo TXT.
     * @returns {void}
     */
    const handleDownload = () => {
        const header = `ANÁLISE JURÍDICA\n================\n\n`;
        const metadata = 
            `Arquivo: ${result.metadata.fileName}\n` +
            `Tipo de Análise: ${result.metadata.analysisType}\n` +
            `Modelo: ${result.metadata.modelo}\n` +
            `Data: ${formatDate(result.metadata.timestamp)}\n` +
            `Tamanho do Arquivo: ${formatFileSize(result.metadata.fileSize)}\n` +
            `Caracteres Extraídos: ${result.metadata.textLength.toLocaleString()}\n\n`;
        const analysisContent = `RESULTADO DA ANÁLISE\n===================\n\n${result.resposta}\n\n`;
        const footer = `---
Gerado pelo sistema IAJuris`;
        const fileContent = header + metadata + analysisContent + footer;

        const element = document.createElement('a');
        const file = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
        element.href = URL.createObjectURL(file);
        element.download = `analise_${result.metadata.fileName.replace('.pdf', '')}_${Date.now()}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    /**
     * @description Abre uma nova janela para imprimir o resultado.
     * @returns {void}
     */
    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Análise Jurídica - ${result.metadata.fileName}</title>
                        <style>
                            body { 
                                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; 
                                margin: 40px; 
                                line-height: 1.6; 
                                color: #333;
                            }
                            .header { 
                                border-bottom: 2px solid #ddd; 
                                padding-bottom: 20px; 
                                margin-bottom: 30px; 
                            }
                            h1 { font-size: 24px; font-weight: bold; margin: 0; }
                            p { margin: 0 0 10px 0; }
                            .content { white-space: pre-wrap; font-size: 16px; }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <h1>Análise Jurídica - ${result.metadata.analysisType}</h1>
                            <p><strong>Arquivo:</strong> ${result.metadata.fileName}</p>
                            <p><strong>Data:</strong> ${formatDate(result.metadata.timestamp)}</p>
                        </div>
                        <div class="content">${result.resposta}</div>
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
    };

    return (
        <div className="w-full max-w-full mx-auto px-2 sm:px-4 lg:px-6">
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden backdrop-blur-sm">
                
                {/* Header - Redesenhado com melhor hierarquia visual */}
                <div className="relative bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 px-4 py-6 sm:px-6 md:px-8 lg:py-8">
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="relative z-10">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
                            <div className="flex items-start space-x-3 sm:space-x-4 min-w-0 flex-1">
                                <div className="flex-shrink-0 bg-white/20 backdrop-blur-sm rounded-full p-2.5 sm:p-3">
                                    {result.sucesso ? (
                                        <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-white animate-pulse" />
                                    ) : (
                                        <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1">
                                        Análise Concluída
                                    </h1>
                                    <p className="text-white/90 text-base sm:text-lg font-medium truncate">
                                        {result.metadata.analysisType}
                                    </p>
                                </div>
                            </div>
                            
                            {/* Botões - Melhor responsividade */}
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full lg:w-auto lg:flex-shrink-0">
                                {onNewAnalysis && (
                                    <button
                                        onClick={onNewAnalysis}
                                        className="bg-white/30 hover:bg-white/10 backdrop-blur-sm text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 active:scale-95 border border-white/20 text-sm sm:text-base whitespace-nowrap"
                                    >
                                        Nova Análise
                                    </button>
                                )}
                                {onClose && (
                                    <button
                                        onClick={onClose}
                                        className="bg-white/30 hover:bg-white/10 backdrop-blur-sm text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 active:scale-95 border border-white/10 text-sm sm:text-base whitespace-nowrap"
                                    >
                                        Voltar
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Metadata Grid - Melhor organização e responsividade */}
                <div className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8 bg-slate-800/50 border-b border-slate-700/50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                        
                        <div className="bg-slate-800/80 rounded-xl p-3 sm:p-4 border border-slate-700/30">
                            <div className="flex items-center space-x-3">
                                <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Arquivo</p>
                                    <p className="text-sm font-semibold text-white truncate mt-1" title={result.metadata.fileName}>
                                        {result.metadata.fileName}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-800/80 rounded-xl p-3 sm:p-4 border border-slate-700/30">
                            <div className="flex items-center space-x-3">
                                <Calendar className="h-5 w-5 text-blue-400 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Data da Análise</p>
                                    <p className="text-sm font-semibold text-white mt-1">
                                        {formatDate(result.metadata.timestamp)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-800/80 rounded-xl p-3 sm:p-4 border border-slate-700/30">
                            <div className="flex items-center space-x-3">
                                <Cpu className="h-5 w-5 text-green-400 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Modelo IA</p>
                                    <p className="text-sm font-semibold text-white mt-1">{result.metadata.modelo}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-800/80 rounded-xl p-3 sm:p-4 border border-slate-700/30">
                            <div className="flex items-center space-x-3">
                                <HardDrive className="h-5 w-5 text-purple-400 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Tamanho</p>
                                    <p className="text-sm font-semibold text-white mt-1">
                                        {formatFileSize(result.metadata.fileSize)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-800/80 rounded-xl p-3 sm:p-4 border border-slate-700/30">
                            <div className="flex items-center space-x-3">
                                <Type className="h-5 w-5 text-cyan-400 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Texto Extraído</p>
                                    <p className="text-sm font-semibold text-white mt-1">
                                        {result.metadata.textLength.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-800/80 rounded-xl p-3 sm:p-4 border border-slate-700/30">
                            <div className="flex items-center space-x-3">
                                <Clock className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Status</p>
                                    <p className={`text-sm font-semibold mt-1 ${result.sucesso ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {result.sucesso ? 'Sucesso' : 'Erro'}
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Barra de Controles - Melhor layout */}
                <div className="px-4 py-4 sm:px-6 lg:px-8 bg-slate-900/50 border-b border-slate-700/30">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="flex items-center justify-center sm:justify-start space-x-2 text-slate-300 hover:text-amber-400 font-medium transition-colors group"
                        >
                            <span className="text-sm">{isExpanded ? 'Recolher' : 'Expandir'} Resultado</span>
                            {isExpanded ? (
                                <ChevronUp className="h-5 w-5 transition-transform group-hover:scale-110" />
                            ) : (
                                <ChevronDown className="h-5 w-5 transition-transform group-hover:scale-110" />
                            )}
                        </button>
                        
                        <div className="flex flex-wrap justify-center sm:justify-end gap-2 sm:gap-3">
                            <button
                                onClick={handleCopyText}
                                className="flex items-center space-x-2 bg-slate-700/50 hover:bg-slate-600/50 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-all duration-200 border border-slate-600/30 hover:border-amber-400/30 group text-sm whitespace-nowrap"
                                title="Copiar texto"
                            >
                                <Copy className="h-4 w-4 transition-transform group-hover:scale-110" />
                                <span className="font-medium">
                                    {copySuccess ? 'Copiado!' : 'Copiar'}
                                </span>
                            </button>

                            <button
                                onClick={handleDownload}
                                className="flex items-center space-x-2 bg-slate-700/50 hover:bg-slate-600/50 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-all duration-200 border border-slate-600/30 hover:border-blue-400/30 group text-sm whitespace-nowrap"
                                title="Baixar como TXT"
                            >
                                <Download className="h-4 w-4 transition-transform group-hover:scale-110" />
                                <span className="font-medium">Baixar</span>
                            </button>

                            <button
                                onClick={handlePrint}
                                className="flex items-center space-x-2 bg-slate-700/50 hover:bg-slate-600/50 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-all duration-200 border border-slate-600/30 hover:border-green-400/30 group text-sm whitespace-nowrap"
                                title="Imprimir"
                            >
                                <Printer className="h-4 w-4 transition-transform group-hover:scale-110" />
                                <span className="font-medium">Imprimir</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Conteúdo da Análise - Melhor tipografia e espaçamento */}
                {isExpanded && (
                    <div className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
                        <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
                            <div className="bg-slate-800/50 px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-700/30">
                                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center space-x-3">
                                    <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />
                                    <span>Resultado da Análise</span>
                                </h2>
                            </div>
                            
                            <div className="p-4 sm:p-6">
                                <div className="prose max-w-none">
                                    <div className="text-slate-200 leading-relaxed text-sm sm:text-base tracking-wide whitespace-pre-wrap font-light">
                                        {result.resposta}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {!result.sucesso && (
                            <div className="mt-4 sm:mt-6 p-4 sm:p-6 bg-red-900/20 border border-red-800/30 rounded-xl backdrop-blur-sm">
                                <div className="flex items-center space-x-3 mb-3">
                                    <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-400 flex-shrink-0" />
                                    <h3 className="font-bold text-red-300 text-base sm:text-lg">Erro na Análise</h3>
                                </div>
                                <p className="text-red-200 leading-relaxed text-sm sm:text-base">
                                    Houve um problema ao processar o documento. Verifique se o arquivo está correto e tente novamente.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Footer - Melhor posicionamento */}
                <div className="px-4 py-3 sm:px-6 sm:py-4 lg:px-8 bg-slate-900/80 border-t border-slate-700/30">
                    <p className="text-xs sm:text-sm text-slate-400 text-center">
                        Análise gerada pelo sistema 
                        <span className="text-amber-400 font-medium"> IAJuris</span>
                        <span className="mx-2">•</span>
                        {formatDate(result.metadata.timestamp)}
                    </p>
                </div>

            </div>
        </div>
    );
};

export default AnalysisResults;
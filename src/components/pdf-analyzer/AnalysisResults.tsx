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
        // Usa o método mais robusto para copiar em ambientes de iFrame
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
        <div className="w-full max-w-4xl mx-auto bg-gray-900 rounded-3xl shadow-xl border border-gray-800 overflow-hidden">
            {/* Cabeçalho da Análise */}
            <div className="bg-gradient-to-r from-[#b0825a] to-[#a17752] text-white p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        {result.sucesso ? (
                            <CheckCircle className="h-10 w-10 text-green-400 animate-pulse" />
                        ) : (
                            <AlertCircle className="h-10 w-10 text-green-400" />
                        )}
                        <div>
                            <h1 className="text-3xl font-extrabold">Análise Concluída</h1>
                            <p className="text-white font-semibold">{result.metadata.analysisType}</p>
                        </div>
                    </div>
                    <div className="flex space-x-2">
                        {onNewAnalysis && (
                            <button
                                onClick={onNewAnalysis}
                                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
                            >
                                Nova Análise
                            </button>
                        )}
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
                            >
                                Fechar
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Metadados da Análise */}
            <div className="p-6 bg-gray-800 border-b border-gray-700">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-gray-400">
                    <div className="flex items-start space-x-3">
                        <FileText className="h-6 w-6 text-gray-400 flex-shrink-0" />
                        <div>
                            <p className="text-sm">Arquivo</p>
                            <p className="font-semibold text-white break-words" title={result.metadata.fileName}>
                                {result.metadata.fileName}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start space-x-3">
                        <Calendar className="h-6 w-6 text-gray-400 flex-shrink-0" />
                        <div>
                            <p className="text-sm">Data da Análise</p>
                            <p className="font-semibold text-white">
                                {formatDate(result.metadata.timestamp)}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start space-x-3">
                        <Cpu className="h-6 w-6 text-gray-400 flex-shrink-0" />
                        <div>
                            <p className="text-sm">Modelo IA</p>
                            <p className="font-semibold text-white">{result.metadata.modelo}</p>
                        </div>
                    </div>

                    <div className="flex items-start space-x-3">
                        <HardDrive className="h-6 w-6 text-gray-400 flex-shrink-0" />
                        <div>
                            <p className="text-sm">Tamanho</p>
                            <p className="font-semibold text-white">
                                {formatFileSize(result.metadata.fileSize)}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start space-x-3">
                        <Type className="h-6 w-6 text-gray-400 flex-shrink-0" />
                        <div>
                            <p className="text-sm">Texto Extraído</p>
                            <p className="font-semibold text-white">
                                {result.metadata.textLength.toLocaleString()} caracteres
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start space-x-3">
                        <Clock className="h-6 w-6 text-gray-400 flex-shrink-0" />
                        <div>
                            <p className="text-sm">Status</p>
                            <p className={`font-semibold ${result.sucesso ? 'text-green-400' : 'text-red-400'}`}>
                                {result.sucesso ? 'Sucesso' : 'Erro'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Barra de Ações e Expansão */}
            <div className="p-4 bg-gray-900 border-b border-gray-700 flex items-center justify-between">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center space-x-2 text-gray-400 hover:text-[#a17752] font-medium transition-colors"
                >
                    <span>{isExpanded ? 'Recolher' : 'Expandir'} Resultado</span>
                    {isExpanded ? (
                        <ChevronUp className="h-5 w-5" />
                    ) : (
                        <ChevronDown className="h-5 w-5" />
                    )}
                </button>
                <div className="flex space-x-2">
                    <button
                        onClick={handleCopyText}
                        className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors shadow"
                        title="Copiar texto"
                    >
                        <Copy className="h-5 w-5" />
                        <span className="hidden sm:inline">{copySuccess ? 'Copiado!' : 'Copiar'}</span>
                    </button>

                    <button
                        onClick={handleDownload}
                        className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors shadow"
                        title="Baixar como TXT"
                    >
                        <Download className="h-5 w-5" />
                        <span className="hidden sm:inline">Baixar</span>
                    </button>

                    <button
                        onClick={handlePrint}
                        className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors shadow"
                        title="Imprimir"
                    >
                        <Printer className="h-5 w-5" />
                        <span className="hidden sm:inline">Imprimir</span>
                    </button>
                </div>
            </div>

            {/* Conteúdo da Análise */}
            {isExpanded && (
                <div className="p-6">
                    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-3">
                            <FileText className="h-6 w-6 text-gray-400" />
                            <span>Resultado da Análise</span>
                        </h2>
                        
                        <div className="prose max-w-none prose-invert">
                            <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                                {result.resposta}
                            </div>
                        </div>
                    </div>

                    {!result.sucesso && (
                        <div className="mt-6 p-4 bg-red-950 border border-red-900 rounded-xl">
                            <div className="flex items-center space-x-2">
                                <AlertCircle className="h-5 w-5 text-red-500" />
                                <h3 className="font-medium text-red-400">Erro na Análise</h3>
                            </div>
                            <p className="text-red-300 mt-2">
                                Houve um problema ao processar o documento. Verifique se o arquivo está correto e tente novamente.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Rodapé da Análise */}
            <div className="p-4 bg-gray-800 text-center border-t border-gray-700">
                <p className="text-sm text-gray-400">
                    Análise gerada pelo sistema IAJuris • {formatDate(result.metadata.timestamp)}
                </p>
            </div>
        </div>
    );
};

export default AnalysisResults;
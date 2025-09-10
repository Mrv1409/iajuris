import { NextRequest, NextResponse } from 'next/server';
import pdfParse from 'pdf-parse';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { TokenMiddleware, TokenEstimator } from '@/middleware/token.middleware';
import { MultiProviderService } from '@/services/multi-provider.service';

// 🚀 CONFIGURAÇÕES OTIMIZADAS PARA MULTI-PROVIDER (14K TPM TOTAL)
const CHUNK_CONFIG = {
    MAX_TOKENS_PER_CHUNK: 3000,    // ✅ Mantido para compatibilidade
    OVERLAP_TOKENS: 300,           // ✅ Overlap inteligente
    MAX_CHUNKS: 35,                // ✅ Aumentado devido à maior capacidade TPM
    // DELAY_BETWEEN_CHUNKS removido - agora gerenciado pelo MultiProviderService
};

// Tipos de análise disponíveis
const ANALYSIS_TYPES = {
    'resumo': 'Resumo Executivo',
    'timeline': 'Cronologia do Processo',
    'partes': 'Identificação das Partes',
    'decisoes': 'Decisões Principais',
    'estrategia': 'Análise Estratégica',
    'completa': 'Análise Completa'
};

// 🚀 LIMITES OTIMIZADOS
const ANALYSIS_LIMITS = {
    'resumo': { responseTokens: 600 },
    'timeline': { responseTokens: 800 },
    'partes': { responseTokens: 500 },
    'decisoes': { responseTokens: 1000 },
    'estrategia': { responseTokens: 1200 },
    'completa': { responseTokens: 2000 }
};

interface PdfAnalysisData {
    clientId: string;
    resposta: string;
    sucesso: boolean;
    metadata: {
        documentId: string;
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

interface TextChunk {
    index: number;
    text: string;
    tokenCount: number;
    startPosition: number;
    endPosition: number;
}

/**
 * Salva os dados da análise de PDF no Firestore.
 */
async function saveAnalysisToFirestore(data: Omit<PdfAnalysisData, 'metadata'> & { metadata: Omit<PdfAnalysisData['metadata'], 'documentId'> }): Promise<string> {
    try {
        const docRef = await addDoc(collection(db, 'pdf_analysis'), {
            ...data,
            timestamp: serverTimestamp()
        });
        console.log("✅ Documento salvo com ID:", docRef.id);
        return docRef.id;
    } catch (e) {
        console.error("❌ Erro ao salvar documento:", e);
        throw new Error('Erro ao salvar os dados da análise no Firestore.');
    }
}

// Função para processar o buffer do arquivo PDF
async function processPdfBuffer(buffer: Buffer): Promise<string> {
    try {
        const data = await pdfParse(buffer);
        return data.text;
    } catch (error) {
        console.error('❌ Erro ao processar PDF:', error);
        throw new Error('Erro ao extrair texto do PDF');
    }
}

// 🚀 FUNÇÃO OTIMIZADA: Divisão em chunks respeitando nova capacidade
function splitTextIntoChunks(text: string): TextChunk[] {
    const chunks: TextChunk[] = [];
    const totalTokens = TokenEstimator.estimateTokens(text);
    
    console.log(`📄 Texto total: ${text.length} caracteres, ~${totalTokens} tokens`);
    
    // Se o texto é pequeno, retorna como chunk único
    if (totalTokens <= CHUNK_CONFIG.MAX_TOKENS_PER_CHUNK) {
        console.log('📄 Documento pequeno - processamento direto');
        return [{
            index: 0,
            text: text,
            tokenCount: totalTokens,
            startPosition: 0,
            endPosition: text.length
        }];
    }

    // 🚀 DIVISÃO INTELIGENTE OTIMIZADA
    // Primeiro tenta dividir por seções jurídicas
    let sections = text.split(/(?=\n(?:PETIÇÃO|DESPACHO|DECISÃO|SENTENÇA|ACÓRDÃO|PARECER|MANIFESTAÇÃO|CONTESTAÇÃO|RECURSO|INICIAL))/gi);
    
    // Se não encontrou seções, divide por parágrafos
    if (sections.length === 1) {
        sections = text.split(/\n\s*\n/);
    }
    
    // Se ainda não dividiu bem, força divisão por caracteres
    if (sections.length === 1) {
        const charsPerChunk = Math.ceil(text.length / Math.ceil(totalTokens / CHUNK_CONFIG.MAX_TOKENS_PER_CHUNK));
        sections = [];
        for (let i = 0; i < text.length; i += charsPerChunk) {
            sections.push(text.slice(i, i + charsPerChunk));
        }
    }

    let currentChunk = '';
    let currentTokens = 0;
    let chunkIndex = 0;
    let startPos = 0;

    for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const sectionTokens = TokenEstimator.estimateTokens(section);
        
        // Se adicionar esta seção ultrapassar o limite, finaliza o chunk atual
        if (currentTokens + sectionTokens > CHUNK_CONFIG.MAX_TOKENS_PER_CHUNK && currentChunk.length > 0) {
            chunks.push({
                index: chunkIndex,
                text: currentChunk.trim(),
                tokenCount: currentTokens,
                startPosition: startPos,
                endPosition: startPos + currentChunk.length
            });
            
            chunkIndex++;
            
            // Inicia novo chunk com overlap reduzido mas inteligente
            const sentences = currentChunk.split(/[.!?]+/);
            const overlapSentences = sentences.slice(-2).join('. '); // Últimas 2 frases
            const overlapText = overlapSentences.length > CHUNK_CONFIG.OVERLAP_TOKENS ? 
                currentChunk.slice(-CHUNK_CONFIG.OVERLAP_TOKENS) : overlapSentences;
            
            currentChunk = overlapText + '\n' + section;
            currentTokens = TokenEstimator.estimateTokens(currentChunk);
            startPos = startPos + currentChunk.length - overlapText.length;
        } else {
            currentChunk += (currentChunk ? '\n' : '') + section;
            currentTokens = TokenEstimator.estimateTokens(currentChunk);
        }
        
        // Limite de segurança de chunks
        if (chunkIndex >= CHUNK_CONFIG.MAX_CHUNKS) {
            console.warn(`⚠️ Limite de ${CHUNK_CONFIG.MAX_CHUNKS} chunks atingido`);
            break;
        }
    }
    
    // Adiciona o último chunk se houver conteúdo
    if (currentChunk.trim().length > 0) {
        // Verificação final de segurança
        const finalTokens = TokenEstimator.estimateTokens(currentChunk);
        if (finalTokens > CHUNK_CONFIG.MAX_TOKENS_PER_CHUNK) {
            // Se ainda assim está muito grande, força divisão
            console.warn(`⚠️ Chunk final muito grande (${finalTokens} tokens). Forçando divisão...`);
            const halfPoint = Math.floor(currentChunk.length / 2);
            const firstHalf = currentChunk.slice(0, halfPoint).trim();
            const secondHalf = currentChunk.slice(halfPoint).trim();
            
            if (firstHalf.length > 0) {
                chunks.push({
                    index: chunkIndex,
                    text: firstHalf,
                    tokenCount: TokenEstimator.estimateTokens(firstHalf),
                    startPosition: startPos,
                    endPosition: startPos + firstHalf.length
                });
                chunkIndex++;
            }
            
            if (secondHalf.length > 0) {
                chunks.push({
                    index: chunkIndex,
                    text: secondHalf,
                    tokenCount: TokenEstimator.estimateTokens(secondHalf),
                    startPosition: startPos + firstHalf.length,
                    endPosition: startPos + currentChunk.length
                });
            }
        } else {
            chunks.push({
                index: chunkIndex,
                text: currentChunk.trim(),
                tokenCount: finalTokens,
                startPosition: startPos,
                endPosition: startPos + currentChunk.length
            });
        }
    }
    
    console.log(`📦 Texto dividido em ${chunks.length} chunks:`);
    chunks.forEach((chunk, i) => {
        console.log(`   Chunk ${i + 1}: ~${chunk.tokenCount} tokens`);
    });
    
    return chunks;
}

// 🚀 FUNÇÃO OTIMIZADA: Prompts concisos e diretos
function createOptimizedPrompt(chunk: TextChunk, analysisType: string, totalChunks: number): { systemPrompt: string; userPrompt: string } {
    // Sistema prompt conciso
    const systemPrompt = `Assistente jurídico especializado. Chunk ${chunk.index + 1}/${totalChunks}.${totalChunks > 1 ? ' Esta é uma análise PARCIAL.' : ''}`;

    let userPrompt = '';

    switch (analysisType) {
        case 'resumo':
            userPrompt = `Resuma esta seção do processo:\n\n${chunk.text}\n\nForneça:\n1. Conteúdo principal\n2. Informações relevantes\n3. Contexto processual`;
            break;

        case 'timeline':
            userPrompt = `Extraia cronologia desta seção:\n\n${chunk.text}\n\nIdentifique:\n1. Datas e prazos\n2. Eventos processuais\n3. Marcos temporais\n\nOrdem cronológica.`;
            break;

        case 'partes':
            userPrompt = `Identifique partes nesta seção:\n\n${chunk.text}\n\nExtraia:\n1. Pessoas/empresas\n2. Advogados\n3. Órgãos\n4. Qualificações`;
            break;

        case 'decisoes':
            userPrompt = `Extraia decisões desta seção:\n\n${chunk.text}\n\nIdentifique:\n1. Decisões/despachos\n2. Sentenças\n3. Fundamentos\n4. Impactos`;
            break;

        case 'estrategia':
            userPrompt = `Análise estratégica desta seção:\n\n${chunk.text}\n\nAnalise:\n1. Argumentos\n2. Pontos favoráveis\n3. Fragilidades\n4. Elementos estratégicos`;
            break;

        case 'completa':
            userPrompt = `Análise completa desta seção:\n\n${chunk.text}\n\nForneça:\n1. Resumo principal\n2. Aspectos jurídicos\n3. Informações relevantes\n4. Elementos importantes`;
            break;

        default:
            userPrompt = `Analise esta seção do processo:\n\n${chunk.text}`;
    }

    return { systemPrompt, userPrompt };
}

// 🚀 FUNÇÃO COM MULTI-PROVIDER SERVICE E MELHOR TRATAMENTO DE ERROS
async function analyzeChunkWithGroq(chunk: TextChunk, analysisType: string, totalChunks: number): Promise<string> {
    const { systemPrompt, userPrompt } = createOptimizedPrompt(chunk, analysisType, totalChunks);
    
    // Estima tokens do request completo
    const estimatedTokens = TokenEstimator.estimateTokens(systemPrompt + userPrompt) + 
                           (ANALYSIS_LIMITS[analysisType as keyof typeof ANALYSIS_LIMITS]?.responseTokens || 800);

    const requestBody = {
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: ANALYSIS_LIMITS[analysisType as keyof typeof ANALYSIS_LIMITS]?.responseTokens || 800,
        top_p: 0.9,
        stream: false
    };

    try {
        console.log(`🔄 Processando chunk ${chunk.index + 1}/${totalChunks} (~${estimatedTokens} tokens estimados)`);
        
        // 🚀 USAR MULTI-PROVIDER SERVICE
        const response = await MultiProviderService.makeRequest(
            requestBody, 
            estimatedTokens,
            analysisType // Passa o tipo para seleção inteligente de provider
        );

        if (response.ok) {
            const data = await response.json();
            const result = data.choices?.[0]?.message?.content || `Erro ao processar chunk ${chunk.index + 1}`;
            console.log(`✅ Chunk ${chunk.index + 1} processado com sucesso`);
            return result;
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);

    } catch (error) {
        console.error(`❌ Erro no chunk ${chunk.index + 1}:`, error);
        
        // 🔍 IDENTIFICAR TIPO DE ERRO PARA RETRY INTELIGENTE
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Erros que podem ser resolvidos com retry
        const retryableErrors = [
            'Nenhum provider disponível no momento',
            'Rate limit exceeded',
            'Service temporarily unavailable',
            'Too many requests',
            'HTTP 429',
            'HTTP 503',
            'HTTP 502'
        ];
        
        const isRetryable = retryableErrors.some(retryableError => 
            errorMessage.toLowerCase().includes(retryableError.toLowerCase())
        );
        
        if (isRetryable) {
            // Marcar erro como temporário para retry
            const retryError = new Error(`RETRYABLE: ${errorMessage}`);//eslint-disable-next-line
            (retryError as any).retryable = true;
            throw retryError;
        } else {
            // Erro permanente - não vale a pena retry
            throw new Error(`PERMANENT: ${errorMessage}`);
        }
    }
}

// 🚀 CONSOLIDAÇÃO INTELIGENTE COM TRATAMENTO DE SEÇÕES FALTANTES
async function consolidateAnalysis(chunkAnalyses: string[], analysisType: string, fileName: string): Promise<string> {
    if (chunkAnalyses.length === 1) {
        return chunkAnalyses[0];
    }

    // 🔍 VERIFICAR SEÇÕES FALTANTES OU COM ERRO
    const missingOrErrorSections: number[] = [];
    const validSections: number[] = [];
    
    chunkAnalyses.forEach((analysis, i) => {
        if (!analysis || 
            analysis.includes('[SEÇÃO') || 
            analysis.includes('[Erro ao processar') || 
            analysis.includes('INDISPONÍVEL') ||
            analysis.includes('NÃO PROCESSADA')) {
            missingOrErrorSections.push(i + 1);
        } else {
            validSections.push(i + 1);
        }
    });

    const systemPrompt = `Consolidador jurídico especializado. Integre ${chunkAnalyses.length} análises parciais em análise única e coerente.${
        missingOrErrorSections.length > 0 ? 
        ` IMPORTANTE: As seções ${missingOrErrorSections.join(', ')} não estão disponíveis devido a problemas técnicos. Consolide apenas as seções disponíveis (${validSections.join(', ')}) e mencione claramente quais seções faltam.` : ''
    }`;

    let userPrompt = `Consolide estas análises em uma única análise estruturada:\n\n`;
    
    chunkAnalyses.forEach((analysis, i) => {
        if (analysis && !analysis.includes('[SEÇÃO') && !analysis.includes('[Erro ao processar')) {
            userPrompt += `=== SEÇÃO ${i + 1} ===\n${analysis}\n\n`;
        } else {
            userPrompt += `=== SEÇÃO ${i + 1} - INDISPONÍVEL ===\n${analysis || '[Seção não processada]'}\n\n`;
        }
    });

    const analysisTypeText = ANALYSIS_TYPES[analysisType as keyof typeof ANALYSIS_TYPES];
    
    if (missingOrErrorSections.length > 0) {
        userPrompt += `\nCrie ${analysisTypeText} consolidado das seções disponíveis. OBRIGATÓRIO: Informe no início da resposta que as seções ${missingOrErrorSections.join(', ')} não puderam ser processadas devido a sobrecarga temporária do sistema, mas que a análise das demais seções está completa.`;
    } else {
        userPrompt += `\nCrie ${analysisTypeText} consolidado eliminando redundâncias e organizando logicamente.`;
    }

    // Estima tokens
    const estimatedTokens = TokenEstimator.estimateTokens(systemPrompt + userPrompt) + 
                           ((ANALYSIS_LIMITS[analysisType as keyof typeof ANALYSIS_LIMITS]?.responseTokens || 800) + 500);

    const requestBody = {
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: (ANALYSIS_LIMITS[analysisType as keyof typeof ANALYSIS_LIMITS]?.responseTokens || 800) + 500,
        top_p: 0.8,
        stream: false
    };

    try {
        console.log('🔄 Consolidando análises com MultiProviderService...');
        
        // 🚀 USAR MULTI-PROVIDER SERVICE PARA CONSOLIDAÇÃO
        const response = await MultiProviderService.makeRequest(
            requestBody, 
            estimatedTokens,
            analysisType
        );

        if (!response.ok) {
            throw new Error(`Erro na consolidação: ${response.statusText}`);
        }

        const data = await response.json();
        const consolidatedResult = data.choices?.[0]?.message?.content || 'Erro ao consolidar análises';
        
        // 🔍 ADICIONAR INFORMAÇÕES TÉCNICAS SE HOUVER SEÇÕES FALTANTES
        if (missingOrErrorSections.length > 0) {
            const technicalNote = `\n\n---\n**NOTA TÉCNICA:** Durante o processamento deste documento, ${missingOrErrorSections.length} de ${chunkAnalyses.length} seções não puderam ser analisadas devido à sobrecarga temporária do sistema. A análise apresentada está baseada nas seções ${validSections.join(', ')} que foram processadas com sucesso. Para uma análise completa, recomenda-se reprocessar o documento em alguns minutos.`;
            return consolidatedResult + technicalNote;
        }
        
        return consolidatedResult;
        
    } catch (error) {
        console.error('❌ Erro na consolidação:', error);
        
        // 🚨 FALLBACK: Se a consolidação falhar, retornar análises separadas
        if (validSections.length > 0) {
            console.log('🔄 Fallback: Retornando análises não consolidadas devido a erro na consolidação...');
            
            let fallbackResult = `**ANÁLISE ${analysisTypeText.toUpperCase()} - DOCUMENTO: ${fileName}**\n\n`;
            
            if (missingOrErrorSections.length > 0) {
                fallbackResult += `⚠️ **AVISO:** As seções ${missingOrErrorSections.join(', ')} não puderam ser processadas devido a problemas técnicos temporários.\n\n`;
            }
            
            chunkAnalyses.forEach((analysis, i) => {
                if (analysis && !analysis.includes('[SEÇÃO') && !analysis.includes('[Erro ao processar')) {
                    fallbackResult += `## SEÇÃO ${i + 1}\n\n${analysis}\n\n---\n\n`;
                }
            });
            
            return fallbackResult;
        }
        
        throw new Error(`Erro ao consolidar análises: ${error}`);
    }
}

// 🚀 FUNÇÃO PRINCIPAL COM MULTI-PROVIDER E SISTEMA DE RETRY
async function analyzeWithGroq(text: string, analysisType: string, fileName: string): Promise<{analysis: string, chunksProcessed: number, totalTokensUsed: number, processingTimeMinutes: number}> {
    const startTime = Date.now();
    const chunks = splitTextIntoChunks(text);
    
    // Log da capacidade atual do sistema
    const capacity = MultiProviderService.getTotalCapacity();
    console.log(`🚀 Capacidade MultiProvider: ${capacity.availableTPM}/${capacity.totalTPM} TPM disponíveis`);
    console.log(`🚀 Providers ativos: ${capacity.activeProviders}`);
    
    if (chunks.length === 1) {
        console.log('📄 Documento pequeno - processamento direto');
        const analysis = await analyzeChunkWithGroq(chunks[0], analysisType, 1);
        const promptTokens = TokenEstimator.estimateTokens(text);
        const responseTokens = TokenEstimator.estimateTokens(analysis);
        const processingTime = (Date.now() - startTime) / 60000;
        
        return {
            analysis,
            chunksProcessed: 1,
            totalTokensUsed: promptTokens + responseTokens,
            processingTimeMinutes: processingTime
        };
    }
    
    // Processamento com múltiplos chunks usando MultiProvider
    console.log(`📦 Processando ${chunks.length} chunks com MultiProviderService...`);
    console.log(`⏰ Processamento paralelo inteligente ativado`);
    
    const chunkAnalyses: string[] = [];
    let totalTokensUsed = 0;
    const failedChunks: number[] = []; // Track de chunks que falharam
    
    // 🔄 PRIMEIRA PASSADA: Tentar processar todos os chunks
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        console.log(`🔄 Processando chunk ${i + 1}/${chunks.length} (~${chunk.tokenCount} tokens)...`);
        
        try {
            const chunkAnalysis = await analyzeChunkWithGroq(chunk, analysisType, chunks.length);
            chunkAnalyses[i] = chunkAnalysis;
            
            // Calcular tokens usados neste chunk
            const chunkTokens = chunk.tokenCount + TokenEstimator.estimateTokens(chunkAnalysis);
            totalTokensUsed += chunkTokens;
            
            console.log(`✅ Chunk ${i + 1} concluído - ${chunkTokens} tokens usados`);
            
        } catch (error) {
            console.error(`❌ Erro no chunk ${i + 1}:`, error);
            failedChunks.push(i);
            chunkAnalyses[i] = 'Erro ao processar chunk'; // Marca como falhou
        }
    }
    
    // 🔄 SISTEMA DE RETRY: Tentar novamente os chunks que falharam
    if (failedChunks.length > 0) {
        console.log(`🔄 Iniciando retry para ${failedChunks.length} chunks que falharam...`);
        
        const retryConfig = {
            maxRetries: 3,
            baseDelay: 5000, // 5 segundos
            backoffMultiplier: 2
        };
        
        for (const chunkIndex of failedChunks) {
            const chunk = chunks[chunkIndex];
            let retryCount = 0;
            let success = false;
            
            while (retryCount < retryConfig.maxRetries && !success) {
                const delay = retryConfig.baseDelay * Math.pow(retryConfig.backoffMultiplier, retryCount);
                
                console.log(`🔄 Retry ${retryCount + 1}/${retryConfig.maxRetries} para chunk ${chunkIndex + 1} em ${delay/1000}s...`);
                
                // Aguardar antes do retry
                await new Promise(resolve => setTimeout(resolve, delay));
                
                // Verificar se há providers disponíveis antes de tentar
                const currentCapacity = MultiProviderService.getTotalCapacity();
                if (currentCapacity.availableTPM === 0) {
                    console.log(`⏳ Aguardando providers ficarem disponíveis...`);
                    await new Promise(resolve => setTimeout(resolve, 10000)); // Espera mais 10s
                    continue;
                }
                
                try {
                    console.log(`🔄 Tentativa ${retryCount + 1}: Processando chunk ${chunkIndex + 1}...`);
                    const chunkAnalysis = await analyzeChunkWithGroq(chunk, analysisType, chunks.length);
                    chunkAnalyses[chunkIndex] = chunkAnalysis;
                    
                    const chunkTokens = chunk.tokenCount + TokenEstimator.estimateTokens(chunkAnalysis);
                    totalTokensUsed += chunkTokens;
                    
                    console.log(`✅ Chunk ${chunkIndex + 1} recuperado com sucesso no retry ${retryCount + 1} - ${chunkTokens} tokens usados`);
                    success = true;
                    
                    // Remove da lista de falhados
                    const indexToRemove = failedChunks.indexOf(chunkIndex);
                    if (indexToRemove > -1) {
                        failedChunks.splice(indexToRemove, 1);
                    }
                    
                } catch (error) {
                    retryCount++;
                    console.error(`❌ Retry ${retryCount} falhou para chunk ${chunkIndex + 1}:`, error);
                    
                    if (retryCount >= retryConfig.maxRetries) {
                        console.error(`💥 Chunk ${chunkIndex + 1} falhou definitivamente após ${retryConfig.maxRetries} tentativas`);
                    }
                }
            }
        }
    }
    
    // 🔄 VERIFICAÇÃO FINAL: Verificar se ainda há chunks críticos que falharam
    const finalFailedChunks = failedChunks.filter(i => chunkAnalyses[i] === null);
    
    if (finalFailedChunks.length > 0) {
        console.warn(`⚠️ ${finalFailedChunks.length} chunks não puderam ser processados após tentativas de retry`);
        
        // Se mais de 50% dos chunks falharam, abortar análise
        if (finalFailedChunks.length > chunks.length * 0.5) {
            throw new Error(`Falha crítica: ${finalFailedChunks.length}/${chunks.length} chunks não puderam ser processados. Sistema temporariamente sobrecarregado.`);
        }
        
        // Para chunks que ainda falharam, tentar uma abordagem alternativa
        for (const chunkIndex of finalFailedChunks) {
            const chunk = chunks[chunkIndex];
            
            // Se o chunk for muito grande, tentar dividir ao meio
            if (chunk.tokenCount > 3000) {
                console.log(`🔀 Tentando dividir chunk ${chunkIndex + 1} grande (${chunk.tokenCount} tokens) ao meio...`);
                
                try {
                    const halfPoint = Math.floor(chunk.text.length / 2);
                    const firstHalf = chunk.text.slice(0, halfPoint).trim();
                    const secondHalf = chunk.text.slice(halfPoint).trim();
                    
                    const halfChunk1 = {
                        ...chunk,
                        text: firstHalf,
                        tokenCount: TokenEstimator.estimateTokens(firstHalf)
                    };
                    
                    const halfChunk2 = {
                        ...chunk,
                        text: secondHalf,
                        tokenCount: TokenEstimator.estimateTokens(secondHalf)
                    };
                    
                    // Tentar processar as metades
                    const analysis1 = await analyzeChunkWithGroq(halfChunk1, analysisType, chunks.length);
                    const analysis2 = await analyzeChunkWithGroq(halfChunk2, analysisType, chunks.length);
                    
                    chunkAnalyses[chunkIndex] = `${analysis1}\n\n${analysis2}`;
                    
                    const combinedTokens = halfChunk1.tokenCount + halfChunk2.tokenCount + 
                                         TokenEstimator.estimateTokens(analysis1) + 
                                         TokenEstimator.estimateTokens(analysis2);
                    totalTokensUsed += combinedTokens;
                    
                    console.log(`✅ Chunk ${chunkIndex + 1} processado através de divisão - ${combinedTokens} tokens usados`);
                    
                } catch (splitError) {
                    console.error(`❌ Falha ao dividir chunk ${chunkIndex + 1}:`, splitError);
                    chunkAnalyses[chunkIndex] = `[SEÇÃO ${chunkIndex + 1} INDISPONÍVEL: Esta seção não pôde ser processada devido a sobrecarga temporária do sistema. Conteúdo aproximado: ${chunk.text.slice(0, 200)}...]`;
                }
            } else {
                // Para chunks menores que ainda falharam, usar mensagem informativa
                chunkAnalyses[chunkIndex] = `[SEÇÃO ${chunkIndex + 1} INDISPONÍVEL: Esta seção não pôde ser processada devido a sobrecarga temporária do sistema. Conteúdo aproximado: ${chunk.text.slice(0, 200)}...]`;
            }
        }
    }
    
    // Garantir que não há valores null no array
    for (let i = 0; i < chunkAnalyses.length; i++) {
        if (chunkAnalyses[i] === null || chunkAnalyses[i] === undefined) {
            chunkAnalyses[i] = `[SEÇÃO ${i + 1} NÃO PROCESSADA: Conteúdo indisponível devido a erro técnico]`;
        }
    }
    
    console.log('🔄 Consolidando análises...');
    const consolidatedAnalysis = await consolidateAnalysis(chunkAnalyses, analysisType, fileName);
    const consolidationTokens = TokenEstimator.estimateTokens(consolidatedAnalysis);
    totalTokensUsed += consolidationTokens;
    
    const processingTime = (Date.now() - startTime) / 60000;
    console.log(`✅ Análise concluída - Total: ${totalTokensUsed} tokens em ${processingTime.toFixed(1)} minutos`);
    
    // Log final das estatísticas dos providers
    const finalStats = MultiProviderService.getProviderStats();
    console.log('📊 Estatísticas finais dos providers:', Object.keys(finalStats).map(key => ({
        provider: key,
        usage: finalStats[key].capacityUsed
    })));
    
    const successfulChunks = chunkAnalyses.filter(analysis => 
        analysis && !analysis.includes('[SEÇÃO') && !analysis.includes('[Erro ao processar')
    ).length;
    
    console.log(`📈 Resultado final: ${successfulChunks}/${chunks.length} chunks processados com sucesso`);
    
    return {
        analysis: consolidatedAnalysis,
        chunksProcessed: chunks.length,
        totalTokensUsed,
        processingTimeMinutes: processingTime
    };
}

export async function POST(request: NextRequest) {
    try {
        // Verificar se o MultiProviderService está configurado
        const capacity = MultiProviderService.getTotalCapacity();
        if (capacity.activeProviders === 0) {
            console.error('❌ Nenhum provider ativo no MultiProviderService');
            return NextResponse.json(
                {
                    error: 'Serviço temporariamente indisponível',
                    resposta: 'Sistema de análise temporariamente indisponível. Tente novamente em alguns minutos.',
                    sucesso: false
                },
                { status: 503 }
            );
        }

        console.log(`🚀 Iniciando com ${capacity.activeProviders} providers ativos (${capacity.availableTPM}/${capacity.totalTPM} TPM disponíveis)`);

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const analysisType = formData.get('analysisType') as string || 'completa';
        const clientId = formData.get('clientId') as string;
        const advogadoId = formData.get('advogadoId') as string || clientId;

        // Validações básicas
        if (!file) {
            return NextResponse.json(
                {
                    error: 'Arquivo não fornecido',
                    resposta: 'Por favor, selecione um arquivo PDF para análise.',
                    sucesso: false
                },
                { status: 400 }
            );
        }

        if (file.type !== 'application/pdf') {
            return NextResponse.json(
                {
                    error: 'Tipo de arquivo inválido',
                    resposta: 'Apenas arquivos PDF são aceitos.',
                    sucesso: false
                },
                { status: 400 }
            );
        }

        if (!advogadoId) {
            return NextResponse.json(
                {
                    error: 'ID do advogado não informado',
                    resposta: 'Identificação do usuário é necessária para utilizar o serviço.',
                    sucesso: false
                },
                { status: 400 }
            );
        }

        // 🚀 VALIDAÇÃO DE TAMANHO DE ARQUIVO
        const maxFileSizeBytes = 50 * 1024 * 1024; // 50MB
        if (file.size > maxFileSizeBytes) {
            return NextResponse.json(
                {
                    error: 'Arquivo muito grande',
                    resposta: 'O arquivo deve ter no máximo 50MB para ser processado.',
                    sucesso: false
                },
                { status: 400 }
            );
        }

        // Verificação de tokens
        const tokenCheck = await TokenMiddleware.checkTokens(advogadoId, 'PDF_ANALYSIS');
        
        if (!tokenCheck.success) {
            console.log('❌ Limite de tokens excedido:', tokenCheck.error);
            
            let errorMessage = '';
            if (tokenCheck.error.code === 'SUBSCRIPTION_INACTIVE') {
                errorMessage = 'Serviço de análise temporariamente indisponível. Nossa equipe entrará em contato em breve.';
            } else if (tokenCheck.error.code === 'DAILY_LIMIT') {
                errorMessage = 'Limite diário de análises de PDF atingido. Tente novamente amanhã.';
            } else if (tokenCheck.error.code === 'MINUTE_LIMIT') {
                errorMessage = 'Muitas análises em pouco tempo. Aguarde alguns minutos e tente novamente.';
            } else {
                errorMessage = 'Serviço de análise temporariamente indisponível. Tente novamente mais tarde.';
            }

            const status = tokenCheck.error.code === 'SUBSCRIPTION_INACTIVE' ? 402 : 429;
            const response = NextResponse.json(
                {
                    error: tokenCheck.error.error,
                    resposta: errorMessage,
                    code: tokenCheck.error.code,
                    sucesso: false
                },
                { status }
            );

            if (tokenCheck.error.limits) {
                response.headers.set('X-RateLimit-Daily-Limit', tokenCheck.error.limits.dailyLimit.toString());
                response.headers.set('X-RateLimit-Daily-Remaining', Math.max(0, tokenCheck.error.limits.dailyLimit - tokenCheck.error.limits.dailyUsed).toString());
                response.headers.set('X-RateLimit-Minute-Limit', tokenCheck.error.limits.minuteLimit.toString());
                response.headers.set('X-RateLimit-Minute-Remaining', Math.max(0, tokenCheck.error.limits.minuteLimit - tokenCheck.error.limits.minuteUsed).toString());
            }
            
            if (tokenCheck.error.retryAfter) {
                response.headers.set('Retry-After', tokenCheck.error.retryAfter.toString());
            }

            return response;
        }
        
        // Processamento do arquivo
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        try {
            console.log('📄 Extraindo texto do PDF...', {
                fileName: file.name,
                fileSize: `${Math.round(file.size / 1024)}KB`
            });
            
            const extractedText = await processPdfBuffer(buffer);

            if (!extractedText || extractedText.trim().length < 100) {
                return NextResponse.json(
                    {
                        error: 'PDF vazio ou ilegível',
                        resposta: 'O arquivo PDF não contém texto suficiente para análise. Verifique se o arquivo não está corrompido ou se é uma imagem escaneada.',
                        sucesso: false
                    },
                    { status: 400 }
                );
            }

            console.log('🔄 Iniciando análise com MultiProviderService...', {
                fileName: file.name,
                fileSize: file.size,
                textLength: extractedText.length,
                analysisType,
                advogadoId
            });
            
            // 🚀 ANÁLISE COM MULTI-PROVIDER SERVICE
            const result = await analyzeWithGroq(extractedText, analysisType, file.name);

            console.log('💾 Salvando análise no Firestore...');
            const metadata = {
                fileName: file.name,
                analysisType: ANALYSIS_TYPES[analysisType as keyof typeof ANALYSIS_TYPES],
                modelo: 'MultiProvider (Groq)',
                timestamp: new Date().toISOString(),
                fileSize: file.size,
                textLength: extractedText.length,
                chunksProcessed: result.chunksProcessed,
                totalTokensUsed: result.totalTokensUsed,
                processingTimeMinutes: result.processingTimeMinutes
            };
            
            const analysisData = {
                clientId,
                resposta: result.analysis,
                sucesso: true,
                metadata
            };

            const documentId = await saveAnalysisToFirestore(analysisData);

            // Registro de tokens
            try {
                await TokenMiddleware.incrementTokens(advogadoId, result.totalTokensUsed);
                
                console.log('✅ Análise concluída com sucesso:', {
                    advogadoId,
                    fileName: file.name,
                    analysisType,
                    chunksProcessed: result.chunksProcessed,
                    totalTokensUsed: result.totalTokensUsed,
                    processingTimeMinutes: result.processingTimeMinutes.toFixed(1),
                    documentId
                });
            } catch (tokenError) {
                console.error('❌ Erro ao registrar tokens:', tokenError);
                
                // 🚀 NOVO: Verificar se é acesso irrestrito
                const errorMessage = tokenError instanceof Error ? tokenError.message : String(tokenError);
                if (errorMessage.includes('acesso irrestrito')) {
                    console.log(`🔓 Tokens não incrementados - ${errorMessage}`);
                }
            }

            return NextResponse.json({
                resposta: result.analysis,
                sucesso: true,
                metadata: {
                    ...metadata,
                    documentId,
                    fileUrl: `api/pdf-analysis/${documentId}`
                }
            });

        } catch (error) {
            console.error('❌ Erro no processamento da análise:', error);
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido.';
            return NextResponse.json(
                {
                    error: 'Erro no processamento da análise.',
                    resposta: errorMessage,
                    sucesso: false
                },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('❌ Erro geral no endpoint /api/pdf-analysis:', error);
        return NextResponse.json(
            {
                error: 'Erro interno do servidor',
                resposta: 'Desculpe, ocorreu um erro ao processar o arquivo. Tente novamente mais tarde.',
                sucesso: false
            },
            { status: 500 }
        );
    }
}
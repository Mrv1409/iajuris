import { NextRequest, NextResponse } from 'next/server';
import pdfParse from 'pdf-parse';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { TokenMiddleware, TokenEstimator } from '@/middleware/token.middleware';

// Configuração para a API da Groq
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// 🚀 CONFIGURAÇÕES OTIMIZADAS PARA TPM 6K
const CHUNK_CONFIG = {
    MAX_TOKENS_PER_CHUNK: 4000,    // ✅ Respeitando TPM de 6K
    OVERLAP_TOKENS: 300,           // ✅ Reduzido mas suficiente
    MAX_CHUNKS: 25,                // ✅ Permite documentos maiores
    DELAY_BETWEEN_CHUNKS: 15000    // ✅ 15s entre chunks (6K tokens/min)
};

// 🚀 CONFIGURAÇÕES DE RETRY
const RETRY_CONFIG = {
    MAX_RETRIES: 3,
    BASE_DELAY: 2000,      // 2s base
    MAX_DELAY: 30000,      // 30s máximo
    BACKOFF_MULTIPLIER: 2
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

// 🚀 LIMITES OTIMIZADOS (reduzidos para economizar tokens)
const ANALYSIS_LIMITS = {
    'resumo': { responseTokens: 600 },
    'timeline': { responseTokens: 800 },
    'partes': { responseTokens: 500 },
    'decisoes': { responseTokens: 1000 },
    'estrategia': { responseTokens: 1200 },
    'completa': { responseTokens: 1500 }
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

// 🚀 NOVA: Classe para gerenciar Rate Limiting
class RateLimitManager {
    private lastRequestTime = 0;
    private tokensInCurrentMinute = 0;
    private minuteStart = 0;

    async enforceTPMLimit(tokensToSend: number): Promise<void> {
        const now = Date.now();
        
        // Reset contador se passou um minuto
        if (now - this.minuteStart > 60000) {
            this.tokensInCurrentMinute = 0;
            this.minuteStart = now;
        }
        
        // Verifica se adicionar estes tokens ultrapassaria TPM
        if (this.tokensInCurrentMinute + tokensToSend > 6000) {
            const waitTime = 60000 - (now - this.minuteStart) + 1000; // +1s de margem
            console.log(`⏳ TPM limit reached. Waiting ${Math.round(waitTime/1000)}s...`);
            await this.delay(waitTime);
            
            // Reset após espera
            this.tokensInCurrentMinute = 0;
            this.minuteStart = Date.now();
        }
        
        // Enforça delay mínimo entre requests
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < CHUNK_CONFIG.DELAY_BETWEEN_CHUNKS) {
            const delayNeeded = CHUNK_CONFIG.DELAY_BETWEEN_CHUNKS - timeSinceLastRequest;
            console.log(`⏳ Delay between chunks: ${Math.round(delayNeeded/1000)}s`);
            await this.delay(delayNeeded);
        }
        
        this.tokensInCurrentMinute += tokensToSend;
        this.lastRequestTime = Date.now();
    }
    
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

const rateLimitManager = new RateLimitManager();

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

// 🚀 FUNÇÃO OTIMIZADA: Divisão em chunks respeitando TPM
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
        chunks.push({
            index: chunkIndex,
            text: currentChunk.trim(),
            tokenCount: currentTokens,
            startPosition: startPos,
            endPosition: startPos + currentChunk.length
        });
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

// 🚀 FUNÇÃO COM RETRY E RATE LIMITING
async function analyzeChunkWithGroq(chunk: TextChunk, analysisType: string, totalChunks: number): Promise<string> {
    const { systemPrompt, userPrompt } = createOptimizedPrompt(chunk, analysisType, totalChunks);
    
    // Estima tokens do request completo
    const estimatedTokens = TokenEstimator.estimateTokens(systemPrompt + userPrompt) + 
                           (ANALYSIS_LIMITS[analysisType as keyof typeof ANALYSIS_LIMITS]?.responseTokens || 800);
    
    // Aplica rate limiting
    await rateLimitManager.enforceTPMLimit(estimatedTokens);

    const requestBody = {
        model: 'llama-3.1-8b-instant',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: ANALYSIS_LIMITS[analysisType as keyof typeof ANALYSIS_LIMITS]?.responseTokens || 800,
        top_p: 0.9,
        stream: false
    };

    // 🚀 RETRY COM BACKOFF EXPONENCIAL
    for (let attempt = 1; attempt <= RETRY_CONFIG.MAX_RETRIES; attempt++) {
        try {
            console.log(`🔄 Chunk ${chunk.index + 1}/${totalChunks} - Tentativa ${attempt}/${RETRY_CONFIG.MAX_RETRIES}`);
            
            const response = await fetch(GROQ_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (response.ok) {
                const data = await response.json();
                const result = data.choices?.[0]?.message?.content || `Erro ao processar chunk ${chunk.index + 1}`;
                console.log(`✅ Chunk ${chunk.index + 1} processado com sucesso`);
                return result;
            }

            // Se não for erro de rate limit, tenta próxima tentativa
            if (response.status === 429) {
                const retryAfter = response.headers.get('Retry-After');
                const delay = retryAfter ? parseInt(retryAfter) * 1000 : 
                             Math.min(RETRY_CONFIG.BASE_DELAY * Math.pow(RETRY_CONFIG.BACKOFF_MULTIPLIER, attempt - 1), RETRY_CONFIG.MAX_DELAY);
                
                console.log(`⏳ Rate limit hit. Waiting ${Math.round(delay/1000)}s before retry ${attempt + 1}...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }

            throw new Error(`HTTP ${response.status}: ${response.statusText}`);

        } catch (error) {
            console.error(`❌ Tentativa ${attempt} falhou para chunk ${chunk.index + 1}:`, error);
            
            if (attempt === RETRY_CONFIG.MAX_RETRIES) {
                throw new Error(`Erro na API Groq para chunk ${chunk.index + 1} após ${RETRY_CONFIG.MAX_RETRIES} tentativas: ${error}`);
            }
            
            // Backoff exponencial
            const delay = Math.min(RETRY_CONFIG.BASE_DELAY * Math.pow(RETRY_CONFIG.BACKOFF_MULTIPLIER, attempt - 1), RETRY_CONFIG.MAX_DELAY);
            console.log(`⏳ Aguardando ${Math.round(delay/1000)}s antes da próxima tentativa...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw new Error(`Falha completa no processamento do chunk ${chunk.index + 1}`);
}

//eslint-disable-next-line
async function consolidateAnalysis(chunkAnalyses: string[], analysisType: string, fileName: string): Promise<string> {
    if (chunkAnalyses.length === 1) {
        return chunkAnalyses[0];
    }

    const systemPrompt = `Consolidador jurídico. Integre ${chunkAnalyses.length} análises parciais em análise única e coerente.`;

    let userPrompt = `Consolide estas análises em uma única análise estruturada:\n\n`;
    
    chunkAnalyses.forEach((analysis, i) => {
        userPrompt += `=== SEÇÃO ${i + 1} ===\n${analysis}\n\n`;
    });

    const analysisTypeText = ANALYSIS_TYPES[analysisType as keyof typeof ANALYSIS_TYPES];
    userPrompt += `\nCrie ${analysisTypeText} consolidado eliminando redundâncias e organizando logicamente.`;

    // Estima tokens e aplica rate limiting
    const estimatedTokens = TokenEstimator.estimateTokens(systemPrompt + userPrompt) + 
                           ((ANALYSIS_LIMITS[analysisType as keyof typeof ANALYSIS_LIMITS]?.responseTokens || 800) + 500);
    
    await rateLimitManager.enforceTPMLimit(estimatedTokens);

    const requestBody = {
        model: 'llama-3.1-8b-instant',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: (ANALYSIS_LIMITS[analysisType as keyof typeof ANALYSIS_LIMITS]?.responseTokens || 800) + 500,
        top_p: 0.8,
        stream: false
    };

    const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        throw new Error(`Erro na consolidação: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'Erro ao consolidar análises';
}

// 🚀 FUNÇÃO PRINCIPAL OTIMIZADA
async function analyzeWithGroq(text: string, analysisType: string, fileName: string): Promise<{analysis: string, chunksProcessed: number, totalTokensUsed: number, processingTimeMinutes: number}> {
    const startTime = Date.now();
    const chunks = splitTextIntoChunks(text);
    
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
    
    // Processamento com múltiplos chunks
    console.log(`📦 Processando ${chunks.length} chunks com rate limiting...`);
    console.log(`⏰ Tempo estimado: ~${Math.ceil(chunks.length * CHUNK_CONFIG.DELAY_BETWEEN_CHUNKS / 1000 / 60)} minutos`);
    
    const chunkAnalyses: string[] = [];
    let totalTokensUsed = 0;
    
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        console.log(`🔄 Processando chunk ${i + 1}/${chunks.length} (~${chunk.tokenCount} tokens)...`);
        
        try {
            const chunkAnalysis = await analyzeChunkWithGroq(chunk, analysisType, chunks.length);
            chunkAnalyses.push(chunkAnalysis);
            
            // Calcular tokens usados neste chunk
            const chunkTokens = chunk.tokenCount + TokenEstimator.estimateTokens(chunkAnalysis);
            totalTokensUsed += chunkTokens;
            
            console.log(`✅ Chunk ${i + 1} concluído - ${chunkTokens} tokens usados`);
            
        } catch (error) {
            console.error(`❌ Erro no chunk ${i + 1}:`, error);
            chunkAnalyses.push(`[Erro ao processar seção ${i + 1}: Seção não pôde ser processada devido a erro técnico]`);
        }
    }
    
    console.log('🔄 Consolidando análises...');
    const consolidatedAnalysis = await consolidateAnalysis(chunkAnalyses, analysisType, fileName);
    const consolidationTokens = TokenEstimator.estimateTokens(consolidatedAnalysis);
    totalTokensUsed += consolidationTokens;
    
    const processingTime = (Date.now() - startTime) / 60000;
    console.log(`✅ Análise concluída - Total: ${totalTokensUsed} tokens em ${processingTime.toFixed(1)} minutos`);
    
    return {
        analysis: consolidatedAnalysis,
        chunksProcessed: chunks.length,
        totalTokensUsed,
        processingTimeMinutes: processingTime
    };
}

export async function POST(request: NextRequest) {
    try {
        if (!GROQ_API_KEY) {
            console.error('❌ GROQ_API_KEY não configurada');
            return NextResponse.json(
                {
                    error: 'Chave da API Groq não configurada',
                    resposta: 'Serviço temporariamente indisponível. Tente novamente mais tarde.',
                    sucesso: false
                },
                { status: 500 }
            );
        }

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

        // 🚀 VALIDAÇÃO DE TAMANHO DE ARQUIVO (novo)
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

            console.log('🔄 Iniciando análise com IA...', {
                fileName: file.name,
                fileSize: file.size,
                textLength: extractedText.length,
                analysisType,
                advogadoId
            });
            
            // 🚀 ANÁLISE OTIMIZADA COM RATE LIMITING
            const result = await analyzeWithGroq(extractedText, analysisType, file.name);

            console.log('💾 Salvando análise no Firestore...');
            const metadata = {
                fileName: file.name,
                analysisType: ANALYSIS_TYPES[analysisType as keyof typeof ANALYSIS_TYPES],
                modelo: 'llama-3.1-8b-instant',
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
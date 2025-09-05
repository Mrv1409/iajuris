// src/app/api/advogado-chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import type { AdvogadoData } from '@/types/advogado';
import { TokenMiddleware, TokenEstimator } from '@/middleware/token.middleware';

// Configuração para a API da Groq
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Função para buscar dados do advogado no Firebase
async function getAdvogadoData(slug: string): Promise<AdvogadoData | null> {
  try {
    console.log('Buscando advogado com slug:', slug);
    
    // Buscar por slug no Firebase
    const advogadosRef = collection(db, 'advogados');
    const q = query(advogadosRef, where('slug', '==', slug));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('Nenhum advogado encontrado com slug:', slug);
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    const data = doc.data() as AdvogadoData;
    
    console.log('Advogado encontrado:', data.nome);
    return {
      ...data,
      id: doc.id
    };
    
  } catch (error) {
    console.error('Erro ao buscar advogado no Firebase:', error);
    return null;
  }
}

// Função para determinar tratamento (Sr./Sra.)
function getUserTreatment(nome: string | undefined): string {
  if (!nome || nome.trim() === '' || nome === '[NOME_CLIENTE]') {
    return 'Sr(a)';
  }
  
  const nomeFormatado = nome.trim();
  if (nomeFormatado.length > 0) {
    return nomeFormatado;
  }
  
  return 'Sr(a)';
}

function generateAdvogadoPrompt(advogadoData: AdvogadoData): string {
  const especialidadesTexto = advogadoData.especialidades?.length > 0 ? advogadoData.especialidades.join(", ") : "direito";
  const experienciaTexto = advogadoData.experiencia || "vasta experiência";
  const localizacaoTexto = `${advogadoData.cidade || 'Brasil'}${advogadoData.estado ? ', ' + advogadoData.estado : ''}`;
  const telefoneTexto = advogadoData.telefone || "telefone disponível no escritório";
  
  return `Você é a assistente de inteligência artificial de ${advogadoData.nome}, advogado(a) especializado(a) em ${especialidadesTexto}.

INSTRUÇÕES ESPECÍFICAS:

1. PRIMEIRA INTERAÇÃO (isInicial=true) - Comece SEMPRE assim:
   "Olá, [NOME_CLIENTE]! Bem-vindo(a) ao escritório de ${advogadoData.nome}, que conta com ${experienciaTexto} em ${especialidadesTexto} e atende em ${localizacaoTexto}."

2. IDENTIFIQUE A ÁREA JURÍDICA da pergunta:
   - CIVIL: acidentes, contratos, família, indenizações, danos morais, vizinhança
   - PENAL: crimes, prisão, delegacia, processos criminais, flagrante
   - TRABALHISTA: demissão, FGTS, horas extras, rescisão, CLT
   - PREVIDENCIÁRIO: aposentadoria, INSS, benefícios, auxílios
   - CONSUMIDOR: compras defeituosas, serviços ruins, bancos
   - IMOBILIÁRIO: aluguel, compra/venda, financiamento

3. RESPONDA de forma:
   - SIMPLES (sem juridiquês - fale como se explicasse para um amigo)
   - EMPÁTICA ("Entendo sua situação", "Sinto muito pelo ocorrido")
   - ESPECÍFICA para a área jurídica identificada
   - OBJETIVA (máximo 4-5 linhas de explicação)

4. QUALIFIQUE O CASO perguntando 2-3 questões específicas:
   - Para ACIDENTES DE TRÂNSITO: "Você fez boletim de ocorrência? Tem seguro? Ficou com sequelas?"
   - Para CRIMES/PRISÃO: "Foi lavrado flagrante? A pessoa precisa de advogado urgente? Qual a acusação?"
   - Para QUESTÕES TRABALHISTAS: "Já foi demitido? Tem carteira assinada? Quantos anos trabalhou?"
   - Para INSS/APOSENTADORIA: "Já deu entrada no pedido? Tem quantos anos de contribuição?"
   - Para FAMÍLIA: "É divórcio consensual? Tem filhos menores? Há bens para dividir?"

5. SEMPRE termine oferecendo:
   "Gostaria de agendar uma consulta com ${advogadoData.nome} ou falar diretamente pelo WhatsApp: ${telefoneTexto}?"

6. Para interações subsequentes (não inicial), mantenha tom acolhedor mas sem repetir a introdução promocional.

7. SEMPRE mantenha TERCEIRA PESSOA:
   - ✅ "${advogadoData.nome} tem experiência em..."
   - ✅ "Nosso escritório pode ajudar..."  
   - ✅ "${advogadoData.nome} costuma orientar que..."
   - ❌ NUNCA diga "Eu tenho", "Eu posso", "Eu sou advogado"

DADOS DO PROFISSIONAL:
- Nome: ${advogadoData.nome}
- Especialidades: ${especialidadesTexto}
- Experiência: ${experienciaTexto}
- Localização: ${localizacaoTexto}
- Contato: ${telefoneTexto}
- Biografia: ${advogadoData.biografia || 'Profissional dedicado ao direito'}

Seja sempre a assistente pessoal de ${advogadoData.nome}, promovendo os serviços de forma natural e acolhedora.`;
}

export async function POST(request: NextRequest) {
  try {
    // Validação da chave da API
    if (!GROQ_API_KEY) {
      console.error('GROQ_API_KEY não configurada');
      return NextResponse.json(
        { 
          error: 'Chave da API Groq não configurada',
          resposta: 'Serviço temporariamente indisponível. Nossa equipe entrará em contato em breve.'
        },
        { status: 500 }
      );
    }

    // Parse do corpo da requisição
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Erro ao fazer parse do JSON:', parseError);
      return NextResponse.json(
        { 
          error: 'Dados inválidos enviados',
          resposta: 'Erro ao processar dados. Tente novamente.'
        },
        { status: 400 }
      );
    }

    const { mensagem, advogadoSlug, isInicial, clienteNome, clienteTelefone } = body;

    // Validação dos dados
    if (!mensagem || !advogadoSlug) {
      return NextResponse.json(
        { 
          error: 'Mensagem e slug do advogado são obrigatórios',
          resposta: 'Dados incompletos. Tente novamente.'
        },
        { status: 400 }
      );
    }

    // Buscar dados do advogado no Firebase
    const advogadoData = await getAdvogadoData(advogadoSlug);
    
    if (!advogadoData) {
      return NextResponse.json(
        { 
          error: 'Advogado não encontrado',
          resposta: 'Advogado não encontrado. Verifique o link e tente novamente.'
        },
        { status: 404 }
      );
    }

    // ✅ INTEGRAÇÃO DO SISTEMA DE TOKENS - VERIFICAÇÃO PRÉVIA
    const advogadoId = advogadoData.id!;
    const tokenCheck = await TokenMiddleware.checkTokens(advogadoId, 'CHAT_PUBLIC');
    
    if (!tokenCheck.success) {
      console.log('Limite de tokens excedido:', tokenCheck.error);
      
      // Resposta específica baseada no tipo de limite
      let errorMessage = '';
      if (tokenCheck.error.code === 'SUBSCRIPTION_INACTIVE') {
        errorMessage = 'Recebemos sua mensagem, entraremos em contato !!!';
      } else if (tokenCheck.error.code === 'DAILY_LIMIT') {
        errorMessage = `Limite diário de consultas atingido. Tente novamente amanhã ou entre em contato diretamente com ${advogadoData.nome} pelo WhatsApp: ${advogadoData.telefone || 'telefone disponível no escritório'}.`;
      } else if (tokenCheck.error.code === 'MINUTE_LIMIT') {
        errorMessage = `Muitas consultas em pouco tempo. Aguarde alguns minutos ou fale diretamente com ${advogadoData.nome} pelo WhatsApp: ${advogadoData.telefone || 'telefone disponível no escritório'}.`;
      } else {
        errorMessage = `Consulta indisponível no momento. Entre em contato diretamente com ${advogadoData.nome} pelo WhatsApp: ${advogadoData.telefone || 'telefone disponível no escritório'}.`;
      }

      const status = tokenCheck.error.code === 'SUBSCRIPTION_INACTIVE' ? 402 : 429;
      const response = NextResponse.json(
        { 
          error: tokenCheck.error.error,
          resposta: errorMessage,
          code: tokenCheck.error.code
        },
        { status }
      );

      // Headers informativos para rate limiting
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

    // Gerar prompt personalizado (modelo MVP com dados do Firebase)
    const systemPrompt = generateAdvogadoPrompt(advogadoData);
    const userTreatment = getUserTreatment(clienteNome);

    // Configurar mensagem do usuário
    let userPrompt = '';
    
    if (isInicial) {
      // Primeira interação com dados do formulário (modelo MVP)
      userPrompt = `Esta é a primeira interação. Cliente: ${userTreatment}${clienteTelefone ? `, telefone: ${clienteTelefone}` : ''}. 
      Situação apresentada: ${mensagem}
      
      LEMBRE-SE: Substitua [NOME_CLIENTE] por "${userTreatment}" e comece com a introdução promocional antes de responder à dúvida.`;
    } else {
      // Continuação da conversa
      userPrompt = mensagem || 'Olá, preciso de ajuda jurídica.';
    }

    // Configuração da requisição para a API da Groq
    const requestBody = {
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1200,
      top_p: 1,
      stream: false
    };

    // Estimar tokens do prompt para logs
    const promptTokens = TokenEstimator.estimateTokens(systemPrompt + userPrompt);
    console.log('Enviando requisição para Groq (SaaS):', { 
      advogadoSlug,
      advogadoNome: advogadoData.nome,
      isInicial,
      clienteNome: userTreatment,
      estimatedPromptTokens: promptTokens
    });

    // Requisição para a API da Groq
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    // Verificação da resposta
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro da API Groq:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      return NextResponse.json(
        { 
          error: 'Erro ao processar com a IA',
          resposta: `Nosso sistema de IA está temporariamente indisponível. Entre em contato diretamente com ${advogadoData.nome} pelo WhatsApp: ${advogadoData.telefone || 'telefone disponível no escritório'}.`
        },
        { status: 500 }
      );
    }

    // Parse da resposta
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('Erro ao fazer parse da resposta da Groq:', jsonError);
      return NextResponse.json(
        { 
          error: 'Erro ao processar resposta da IA',
          resposta: `Erro técnico temporário. Entre em contato diretamente com ${advogadoData.nome} pelo WhatsApp: ${advogadoData.telefone || 'telefone disponível no escritório'}.`
        },
        { status: 500 }
      );
    }

    const respostaIA = data.choices?.[0]?.message?.content || 
      `Desculpe, não consegui processar sua solicitação no momento. Entre em contato diretamente com ${advogadoData.nome} pelo WhatsApp: ${advogadoData.telefone || 'telefone disponível no escritório'}.`;

    // ✅ INTEGRAÇÃO DO SISTEMA DE TOKENS - INCREMENTO APÓS SUCESSO
    try {
      // Calcular tokens reais usados (prompt + resposta)
      const responseTokens = TokenEstimator.estimateTokens(respostaIA);
      const totalTokensUsed = promptTokens + responseTokens;
      
      // Registrar uso real de tokens
      await TokenMiddleware.incrementTokens(advogadoId, totalTokensUsed);
      
      console.log('Tokens registrados:', {
        advogadoId,
        promptTokens,
        responseTokens,
        totalTokensUsed
      });
    } catch (tokenError) {
      // Log do erro mas não falha a resposta
      console.error('Erro ao registrar tokens:', tokenError);
    }

    console.log('Resposta SaaS enviada com sucesso');
    return NextResponse.json({
      resposta: respostaIA,
      sucesso: true,
      metadata: {
        advogado: advogadoData.nome,
        especialidades: advogadoData.especialidades,
        localizacao: `${advogadoData.cidade || 'Brasil'}${advogadoData.estado ? ', ' + advogadoData.estado : ''}`,
        contato: `WhatsApp: ${advogadoData.telefone || 'disponível no escritório'}`,
        tratamentoUsuario: userTreatment
      }
    });

  } catch (error) {
    console.error('Erro geral no endpoint /api/advogado-chat:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        resposta: 'Desculpe, ocorreu um erro técnico. Nossa equipe entrará em contato em breve para ajudá-lo.'
      },
      { status: 500 }
    );
  }
}
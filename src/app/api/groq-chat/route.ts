import { NextRequest, NextResponse } from 'next/server';


// Configuração para a API da Groq
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

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

    const { mensagem, contexto, isInicial } = body;

    // Validação dos dados recebidos
    if (!mensagem && !contexto?.motivo) {
      return NextResponse.json(
        { 
          error: 'Mensagem ou contexto necessário',
          resposta: 'Dados incompletos. Tente novamente.'
        },
        { status: 400 }
      );
    }

    // Prompt personalizado para o contexto jurídico
    const systemPrompt = `Você é a IAJURIS, uma assistente de inteligência artificial especializada em direito brasileiro. Sua função é:

1. Responder dúvidas jurídicas em linguagem SIMPLES e ACESSÍVEL, sem juridiquês
2. Sempre ser empática e acolhedora
3. Após responder a dúvida, SEMPRE perguntar se a pessoa gostaria de:
    - Agendar uma consulta presencial
    - Falar com um advogado especializado
    - Receber mais informações sobre o caso

IMPORTANTE: 
- Use linguagem clara, como se estivesse explicando para um amigo
- Evite termos técnicos complexos
- Seja acolhedora e compreensiva
- Sempre ofereça próximos passos (agendamento/consulta)
- Mantenha respostas concisas mas completas

Áreas de especialização: Direito Civil, Trabalhista, Previdenciário, Família, Consumidor, Criminal.`;

    let userPrompt = '';
    
    if (isInicial && contexto) {
      // Primeira interação com dados do formulário
      userPrompt = `Olá! Sou ${contexto.nome}, meu telefone é ${contexto.telefone}. 
      Minha situação é: ${contexto.motivo}
      
      Por favor, me ajude a entender melhor minha situação jurídica.`;
    } else {
      // Continuação da conversa
      userPrompt = mensagem || 'Olá, preciso de ajuda jurídica.';
    }

    // Configuração da requisição para a API da Groq
    const requestBody = {
      model: 'llama3-8b-8192',
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
      max_tokens: 1000,
      top_p: 1,
      stream: false
    };

    console.log('Enviando requisição para Groq:', { 
      url: GROQ_API_URL, 
      hasApiKey: !!GROQ_API_KEY,
      bodyPreview: { ...requestBody, messages: requestBody.messages.map(m => ({ ...m, content: m.content.substring(0, 100) + '...' })) }
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
          resposta: 'Nosso sistema de IA está temporariamente indisponível. Nossa equipe entrará em contato em breve para ajudá-lo.'
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
          resposta: 'Erro técnico temporário. Nossa equipe entrará em contato em breve.'
        },
        { status: 500 }
      );
    }

    const respostaIA = data.choices?.[0]?.message?.content || 'Desculpe, não consegui processar sua solicitação no momento. Nossa equipe entrará em contato em breve.';

    // O bloco de salvamento de lead foi REMOVIDO daqui.
    // A lead é criada e atualizada no frontend (chat/page.tsx) agora.

    console.log('Resposta enviada com sucesso');
    return NextResponse.json({
      resposta: respostaIA,
      sucesso: true
    });

  } catch (error) {
    console.error('Erro geral no endpoint /api/groq-chat:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        resposta: 'Desculpe, ocorreu um erro técnico. Nossa equipe entrará em contato em breve para ajudá-lo.'
      },
      { status: 500 }
    );
  }
}
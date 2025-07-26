import { NextRequest, NextResponse } from 'next/server';

// Configuração para a API da Groq
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Informações do "escritório" (IAJuris) e advogados fictícios
const OFFICE_NAME = 'IAJuris';
const OFFICE_HISTORY_YEARS = 15;

// Advogados fictícios para as 5 áreas principais
const FICTITIOUS_LAWYERS = {
  'Direito Trabalhista': 'Dr. Ricardo Santos',
  'Direito Penal': 'Dra. Marina Oliveira',
  'Direito Civil': 'Dr. Fernando Silva',
  'Direito Previdenciário': 'Dra. Letícia Rocha',
  'Direito do Consumidor': 'Dr. Bruno Carvalho',
  'Outras Áreas': 'nossa equipe de especialistas'
};

// Função auxiliar para tentar identificar a área jurídica (expandida e melhorada)
function identifyLegalArea(text: string): keyof typeof FICTITIOUS_LAWYERS {
  const lowerText = text.toLowerCase();
  
  // Direito Trabalhista - palavras-chave expandidas
  if (lowerText.includes('trabalho') || lowerText.includes('emprego') || lowerText.includes('demissão') || 
      lowerText.includes('salário') || lowerText.includes('horas extras') || lowerText.includes('férias') ||
      lowerText.includes('rescisão') || lowerText.includes('clt') || lowerText.includes('carteira assinada') ||
      lowerText.includes('13º salário') || lowerText.includes('fgts') || lowerText.includes('justa causa') ||
      lowerText.includes('aviso prévio') || lowerText.includes('trabalhador') || lowerText.includes('patrão') ||
      lowerText.includes('empresa') || lowerText.includes('chefe') || lowerText.includes('contrato de trabalho')) {
    return 'Direito Trabalhista';
  }
  
  // Direito Penal - palavras-chave expandidas
  if (lowerText.includes('crime') || lowerText.includes('pena') || lowerText.includes('delegacia') || 
      lowerText.includes('processo criminal') || lowerText.includes('prisão') || lowerText.includes('roubo') ||
      lowerText.includes('furto') || lowerText.includes('agressão') || lowerText.includes('violência') ||
      lowerText.includes('lesão corporal') || lowerText.includes('ameaça') || lowerText.includes('difamação') ||
      lowerText.includes('calúnia') || lowerText.includes('injúria') || lowerText.includes('polícia') ||
      lowerText.includes('boletim de ocorrência') || lowerText.includes('advogado criminal')) {
    return 'Direito Penal';
  }
  
  // Direito Civil - palavras-chave expandidas
  if (lowerText.includes('contrato') || lowerText.includes('família') || lowerText.includes('sucessão') || 
      lowerText.includes('imobiliário') || lowerText.includes('herança') || lowerText.includes('divórcio') ||
      lowerText.includes('inventário') || lowerText.includes('testamento') || lowerText.includes('casamento') ||
      lowerText.includes('união estável') || lowerText.includes('pensão alimentícia') || lowerText.includes('guarda') ||
      lowerText.includes('partilha') || lowerText.includes('imóvel') || lowerText.includes('compra e venda') ||
      lowerText.includes('locação') || lowerText.includes('aluguel') || lowerText.includes('registro civil')) {
    return 'Direito Civil';
  }
  
  // Direito Previdenciário - palavras-chave expandidas
  if (lowerText.includes('aposentadoria') || lowerText.includes('inss') || lowerText.includes('benefício') || 
      lowerText.includes('auxílio') || lowerText.includes('previdência') || lowerText.includes('contribuição') ||
      lowerText.includes('benefício por incapacidade') || lowerText.includes('auxílio-doença') ||
      lowerText.includes('aposentadoria por idade') || lowerText.includes('aposentadoria por tempo') ||
      lowerText.includes('pensão por morte') || lowerText.includes('salário-maternidade') ||
      lowerText.includes('bpc') || lowerText.includes('loas') || lowerText.includes('perícia médica')) {
    return 'Direito Previdenciário';
  }
  
  // Direito do Consumidor - palavras-chave expandidas
  if (lowerText.includes('consumidor') || lowerText.includes('produto') || lowerText.includes('serviço') || 
      lowerText.includes('compra') || lowerText.includes('defeito') || lowerText.includes('garantia') ||
      lowerText.includes('devolução') || lowerText.includes('procon') || lowerText.includes('propaganda enganosa') ||
      lowerText.includes('cobrança indevida') || lowerText.includes('cartão de crédito') || lowerText.includes('banco') ||
      lowerText.includes('financiamento') || lowerText.includes('empréstimo') || lowerText.includes('serasa') ||
      lowerText.includes('spc') || lowerText.includes('nome sujo') || lowerText.includes('vício') ||
      lowerText.includes('estabelecimento comercial') || lowerText.includes('loja')) {
    return 'Direito do Consumidor';
  }
  
  return 'Outras Áreas';
}

// Função para determinar tratamento (Sr./Sra.)
function getUserTreatment(nome: string | undefined): string {
  if (!nome || nome.trim() === '') {
    return 'Sr(a)';
  }
  
  // Usar o nome se disponível, senão usar tratamento formal
  const nomeFormatado = nome.trim();
  if (nomeFormatado.length > 0) {
    return nomeFormatado;
  }
  
  return 'Sr(a)';
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

    // Identificar a área jurídica com base no motivo inicial ou na mensagem atual
    const relevantText = isInicial && contexto ? contexto.motivo : mensagem;
    const identifiedArea = identifyLegalArea(relevantText);
    const fictitiousLawyer = FICTITIOUS_LAWYERS[identifiedArea];
    const userTreatment = getUserTreatment(contexto?.nome);

    // Prompt personalizado para o contexto jurídico melhorado
    const systemPrompt = `Você é uma assistente de inteligência artificial do ${OFFICE_NAME}, um escritório de advocacia renomado especializado em direito brasileiro. 

IMPORTANTE - INSTRUÇÕES ESPECÍFICAS:
1. Se esta for a primeira interação (isInicial=true), você DEVE começar sua resposta EXATAMENTE com esta estrutura:
   "Muito bem-vindo(a), ${userTreatment}! Você fez uma excelente escolha em procurar o ${OFFICE_NAME}, que já conta com ${OFFICE_HISTORY_YEARS} anos de sólida experiência jurídica e possui profissionais altamente qualificados. Para acompanhar seu caso, contamos com a expertise ${identifiedArea === 'Outras Áreas' ? 'de nossa equipe especializada' : `de ${fictitiousLawyer}, especialista em ${identifiedArea}`}, que possui amplo conhecimento para melhor defender seus interesses."

2. Após esta introdução (apenas na primeira interação), responda à dúvida jurídica de forma:
   - SIMPLES e ACESSÍVEL, sem juridiquês
   - EMPÁTICA e ACOLHEDORA
   - CLARA, como se explicasse para um amigo

3. SEMPRE termine perguntando se gostaria de:
   - Agendar uma consulta presencial
   - Falar com um advogado especializado
   - Receber mais informações sobre o caso

4. Para interações subsequentes, mantenha o tom acolhedor mas sem repetir a introdução promocional.

Áreas de especialização: Direito Trabalhista, Direito Penal, Direito Civil, Direito Previdenciário, Direito do Consumidor.`;

    let userPrompt = '';
    
    if (isInicial && contexto) {
      // Primeira interação com dados do formulário
      userPrompt = `Esta é a primeira interação. Cliente: ${userTreatment}, telefone: ${contexto.telefone}. 
      Situação apresentada: ${contexto.motivo}
      
      LEMBRE-SE: Comece OBRIGATORIAMENTE com a introdução promocional completa do escritório e menção ao profissional especializado antes de responder à dúvida.`;
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
      max_tokens: 1200,
      top_p: 1,
      stream: false
    };

    console.log('Enviando requisição para Groq:', { 
      url: GROQ_API_URL, 
      hasApiKey: !!GROQ_API_KEY,
      isInicial,
      identifiedArea,
      userTreatment
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

    console.log('Resposta enviada com sucesso');
    return NextResponse.json({
      resposta: respostaIA,
      sucesso: true,
      metadata: {
        areaIdentificada: identifiedArea,
        advogadoAtribuido: fictitiousLawyer,
        tratamentoUsuario: userTreatment
      }
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
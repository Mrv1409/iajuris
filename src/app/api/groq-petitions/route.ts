import { NextRequest, NextResponse } from 'next/server';

// Configuração para a API da Groq
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Informações do escritório
const OFFICE_NAME = 'IAJuris';
const OFFICE_HISTORY_YEARS = 15;

// Tipos de documentos disponíveis
const DOCUMENT_TYPES = {
  'petição inicial': 'Petição Inicial',
  'contestação': 'Contestação',
  'recurso': 'Recurso',
  'embargos': 'Embargos de Declaração',
  'apelação': 'Apelação',
  'agravo': 'Agravo de Instrumento',
  'mandado de segurança': 'Mandado de Segurança',
  'habeas corpus': 'Habeas Corpus',
  'ação de cobrança': 'Ação de Cobrança',
  'ação trabalhista': 'Ação Trabalhista',
  'ação previdenciária': 'Ação Previdenciária',
  'ação consumerista': 'Ação de Direito do Consumidor',
  'divórcio': 'Ação de Divórcio',
  'inventário': 'Inventário',
  'outros': 'Documento Jurídico'
};

// Áreas jurídicas especializadas
const LEGAL_AREAS = {
  'civil': 'Direito Civil',
  'trabalhista': 'Direito Trabalhista',
  'penal': 'Direito Penal',
  'previdenciário': 'Direito Previdenciário',
  'consumidor': 'Direito do Consumidor',
  'família': 'Direito de Família',
  'tributário': 'Direito Tributário',
  'administrativo': 'Direito Administrativo',
  'constitucional': 'Direito Constitucional',
  'empresarial': 'Direito Empresarial'
};

// Função para identificar o tipo de documento
function identifyDocumentType(text: string): keyof typeof DOCUMENT_TYPES {
  const lowerText = text.toLowerCase();
  
  // Verifica cada tipo de documento
  for (const [key] of Object.entries(DOCUMENT_TYPES)) {
    if (lowerText.includes(key)) {
      return key as keyof typeof DOCUMENT_TYPES;
    }
  }
  
  return 'outros';
}

// Função para identificar a área jurídica
function identifyLegalArea(text: string): keyof typeof LEGAL_AREAS {
  const lowerText = text.toLowerCase();
  
  // Direito Trabalhista
  if (lowerText.includes('trabalho') || lowerText.includes('emprego') || lowerText.includes('clt') || 
      lowerText.includes('salário') || lowerText.includes('demissão') || lowerText.includes('rescisão')) {
    return 'trabalhista';
  }
  
  // Direito Penal
  if (lowerText.includes('crime') || lowerText.includes('penal') || lowerText.includes('prisão') || 
      lowerText.includes('habeas corpus') || lowerText.includes('criminal')) {
    return 'penal';
  }
  
  // Direito de Família
  if (lowerText.includes('divórcio') || lowerText.includes('família') || lowerText.includes('guarda') || 
      lowerText.includes('pensão alimentícia') || lowerText.includes('inventário')) {
    return 'família';
  }
  
  // Direito Previdenciário
  if (lowerText.includes('aposentadoria') || lowerText.includes('inss') || lowerText.includes('previdência') || 
      lowerText.includes('benefício') || lowerText.includes('auxílio')) {
    return 'previdenciário';
  }
  
  // Direito do Consumidor
  if (lowerText.includes('consumidor') || lowerText.includes('produto') || lowerText.includes('serviço') || 
      lowerText.includes('cobrança indevida') || lowerText.includes('banco')) {
    return 'consumidor';
  }
  
  return 'civil';
}

export async function POST(request: NextRequest) {
  try {
    // Validação da chave da API
    if (!GROQ_API_KEY) {
      console.error('GROQ_API_KEY não configurada');
      return NextResponse.json(
        { 
          error: 'Chave da API Groq não configurada',
          resposta: 'Serviço temporariamente indisponível. Tente novamente mais tarde.'
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
          resposta: 'Erro ao processar dados. Verifique os dados enviados e tente novamente.'
        },
        { status: 400 }
      );
    }

    const { 
      tipoDocumento, 
      areaJuridica, 
      descricaoCase, 
      dadosCliente, 
      dadosAdversario, 
      observacoes,
      instrucoes 
    } = body;

    // Validação dos dados obrigatórios
    if (!tipoDocumento || !descricaoCase) {
      return NextResponse.json(
        { 
          error: 'Dados obrigatórios não fornecidos',
          resposta: 'Tipo de documento e descrição do caso são obrigatórios.'
        },
        { status: 400 }
      );
    }

    // Identificação automática se não fornecida
    const finalDocumentType = identifyDocumentType(tipoDocumento);
    const finalLegalArea = areaJuridica || identifyLegalArea(descricaoCase);
    const documentName = DOCUMENT_TYPES[finalDocumentType];
    const areaName = LEGAL_AREAS[finalLegalArea as keyof typeof LEGAL_AREAS] || 'Direito Civil';

    // Prompt especializado para geração de petições jurídicas
    const systemPrompt = `Você é um assistente jurídico especializado do ${OFFICE_NAME}, um escritório com ${OFFICE_HISTORY_YEARS} anos de experiência. 

MISSÃO: Gerar petições e documentos jurídicos profissionais, tecnicamente corretos e bem fundamentados.

INSTRUÇÕES ESPECÍFICAS:
1. SEMPRE estruture o documento seguindo as normas jurídicas brasileiras
2. Use linguagem técnica adequada, mas clara e objetiva
3. Inclua fundamentação legal pertinente (leis, jurisprudências quando relevante)
4. Organize em seções lógicas com numeração adequada
5. Mantenha tom formal e respeitoso
6. Cite artigos de lei quando aplicável
7. Estruture argumentação de forma convincente e técnica

ESTRUTURA PADRÃO:
- Cabeçalho com identificação do juízo
- Qualificação das partes
- Dos fatos
- Do direito
- Dos pedidos
- Valor da causa (quando aplicável)
- Encerramento formal

ÁREAS DE ESPECIALIZAÇÃO: ${Object.values(LEGAL_AREAS).join(', ')}

IMPORTANTE: Gere um documento completo, profissional e tecnicamente correto.`;

    // Construção do prompt específico
    let userPrompt = `SOLICITO A ELABORAÇÃO DE: ${documentName}
ÁREA JURÍDICA: ${areaName}

DESCRIÇÃO DO CASO:
${descricaoCase}`;

    if (dadosCliente) {
      userPrompt += `\n\nDADOS DO CLIENTE/REQUERENTE:
${dadosCliente}`;
    }

    if (dadosAdversario) {
      userPrompt += `\n\nDADOS DA PARTE ADVERSA/REQUERIDO:
${dadosAdversario}`;
    }

    if (observacoes) {
      userPrompt += `\n\nOBSERVAÇÕES IMPORTANTES:
${observacoes}`;
    }

    if (instrucoes) {
      userPrompt += `\n\nINSTRUÇÕES ESPECÍFICAS:
${instrucoes}`;
    }

    userPrompt += `\n\nGere um documento jurídico completo, tecnicamente correto e profissional seguindo as melhores práticas jurídicas brasileiras.`;

    // Configuração da requisição para a API da Groq com modelo Qwen
    const requestBody = {
      model: 'llama3-8b-8192', // Modelo Qwen para documentos técnicos
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
      temperature: 0.3, // Temperatura baixa para maior precisão técnica
      max_tokens: 4000, // Mais tokens para documentos longos
      top_p: 0.9,
      stream: false
    };

    console.log('Enviando requisição para Groq (Petições):', { 
      url: GROQ_API_URL, 
      hasApiKey: !!GROQ_API_KEY,
      documentType: finalDocumentType,
      legalArea: finalLegalArea,
      model: 'llama3-8b-8192'
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
      console.error('Erro da API Groq (Petições):', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      return NextResponse.json(
        { 
          error: 'Erro ao processar com a IA',
          resposta: 'Nosso sistema de IA está temporariamente indisponível. Tente novamente em alguns minutos.'
        },
        { status: 500 }
      );
    }

    // Parse da resposta
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('Erro ao fazer parse da resposta da Groq (Petições):', jsonError);
      return NextResponse.json(
        { 
          error: 'Erro ao processar resposta da IA',
          resposta: 'Erro técnico temporário. Tente novamente.'
        },
        { status: 500 }
      );
    }

    const documentoGerado = data.choices?.[0]?.message?.content || 'Desculpe, não consegui gerar o documento no momento. Tente novamente.';

    console.log('Documento jurídico gerado com sucesso');
    return NextResponse.json({
      resposta: documentoGerado,
      sucesso: true,
      metadata: {
        tipoDocumento: documentName,
        areaJuridica: areaName,
        modelo: 'llama3-8b-8192',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Erro geral no endpoint /api/groq-petitions:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        resposta: 'Desculpe, ocorreu um erro técnico. Tente novamente mais tarde.'
      },
      { status: 500 }
    );
  }
}
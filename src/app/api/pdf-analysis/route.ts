import { NextRequest, NextResponse } from 'next/server';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';//eslint-disable-next-line
import formidable from 'formidable';
import fs from 'fs';
import pdfParse from 'pdf-parse';

// Configuração para a API da Groq
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Configuração Firebase (ajuste com suas credenciais)
const firebaseConfig = {
  // Suas configurações do Firebase
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app);

// Tipos de análise disponíveis
const ANALYSIS_TYPES = {
  'resumo': 'Resumo Executivo',
  'timeline': 'Cronologia do Processo',
  'partes': 'Identificação das Partes',
  'decisoes': 'Decisões Principais',
  'estrategia': 'Análise Estratégica',
  'completa': 'Análise Completa'
};

// Função para processar arquivo PDF
async function processPdfFile(filePath: string): Promise<string> {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    console.error('Erro ao processar PDF:', error);
    throw new Error('Erro ao extrair texto do PDF');
  }
}

// Função para upload no Firebase Storage
async function uploadToFirebase(filePath: string, fileName: string): Promise<string> {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const storageRef = ref(storage, `pdfs/${Date.now()}_${fileName}`);
    
    await uploadBytes(storageRef, fileBuffer);
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;
  } catch (error) {
    console.error('Erro no upload Firebase:', error);
    throw new Error('Erro ao fazer upload do arquivo');
  }
}

// Função para analisar texto com IA
async function analyzeWithGroq(text: string, analysisType: string): Promise<string> {
  const systemPrompt = `Você é um assistente jurídico especializado em análise de processos judiciais.

MISSÃO: Analisar documentos processuais e fornecer insights estruturados e precisos.

INSTRUÇÕES:
1. Use linguagem jurídica adequada mas clara
2. Seja objetivo e preciso
3. Identifique informações relevantes
4. Mantenha estrutura organizada
5. Foque nos aspectos mais importantes

ÁREAS DE ESPECIALIZAÇÃO: Direito Civil, Trabalhista, Penal, Previdenciário, Consumidor, Família, Tributário`;

  let userPrompt = '';

  switch (analysisType) {
    case 'resumo':
      userPrompt = `FAÇA UM RESUMO EXECUTIVO do seguinte documento processual:

${text}

FORNEÇA:
1. Resumo em 3-4 parágrafos
2. Natureza da ação
3. Objeto principal da demanda
4. Status atual do processo

Mantenha foco nos pontos essenciais.`;
      break;

    case 'timeline':
      userPrompt = `CRIE UMA CRONOLOGIA DETALHADA do seguinte processo:

${text}

IDENTIFIQUE E ORGANIZE:
1. Datas importantes (distribuição, citação, audiências, decisões)
2. Principais marcos processuais
3. Prazos vencidos e futuros
4. Sequência lógica dos eventos

Organize em ordem cronológica.`;
      break;

    case 'partes':
      userPrompt = `IDENTIFIQUE AS PARTES ENVOLVIDAS no seguinte processo:

${text}

EXTRAIA:
1. Parte Autora (nome, qualificação, representação)
2. Parte Ré (nome, qualificação, representação)
3. Advogados de cada parte
4. Terceiros interessados (se houver)
5. Órgão julgador

Organize as informações de forma clara.`;
      break;

    case 'decisoes':
      userPrompt = `EXTRAIA AS PRINCIPAIS DECISÕES do seguinte processo:

${text}

IDENTIFIQUE:
1. Decisões interlocutórias importantes
2. Sentenças
3. Acórdãos
4. Despachos relevantes
5. Fundamentação das decisões principais

Foque nas decisões que impactam o mérito da causa.`;
      break;

    case 'estrategia':
      userPrompt = `FAÇA UMA ANÁLISE ESTRATÉGICA do seguinte processo:

${text}

ANALISE:
1. Pontos favoráveis à parte autora
2. Pontos favoráveis à parte ré
3. Argumentos mais fortes de cada lado
4. Possíveis fragilidades processuais
5. Sugestões estratégicas para próximos passos

Seja imparcial na análise.`;
      break;

    case 'completa':
      userPrompt = `FAÇA UMA ANÁLISE COMPLETA do seguinte processo:

${text}

FORNEÇA:
1. RESUMO EXECUTIVO (2-3 parágrafos)
2. CRONOLOGIA PRINCIPAL (principais marcos)
3. PARTES ENVOLVIDAS (identificação básica)
4. DECISÕES RELEVANTES (principais julgados)
5. ANÁLISE ESTRATÉGICA (pontos favoráveis/desfavoráveis)
6. PRÓXIMOS PASSOS SUGERIDOS

Organize de forma estruturada e profissional.`;
      break;

    default:
      userPrompt = `Analise o seguinte documento processual e forneça um resumo estruturado:\n\n${text}`;
  }

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
    temperature: 0.3,
    max_tokens: 4000,
    top_p: 0.9,
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
    throw new Error('Erro na API Groq');
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'Erro ao processar análise';
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

    // Parse do formulário com arquivo
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const analysisType = formData.get('analysisType') as string || 'completa';
    const clientId = formData.get('clientId') as string;

    if (!file) {
      return NextResponse.json(
        { 
          error: 'Arquivo não fornecido',
          resposta: 'Por favor, selecione um arquivo PDF para análise.'
        },
        { status: 400 }
      );
    }

    // Validação do tipo de arquivo
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { 
          error: 'Tipo de arquivo inválido',
          resposta: 'Apenas arquivos PDF são aceitos.'
        },
        { status: 400 }
      );
    }

    // Salvamento temporário do arquivo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const tempFilePath = `/tmp/${Date.now()}_${file.name}`;
    fs.writeFileSync(tempFilePath, buffer);

    try {
      // 1. Extrair texto do PDF
      console.log('Extraindo texto do PDF...');
      const extractedText = await processPdfFile(tempFilePath);

      if (!extractedText || extractedText.trim().length < 100) {
        return NextResponse.json(
          { 
            error: 'PDF vazio ou ilegível',
            resposta: 'O arquivo PDF não contém texto suficiente para análise. Verifique se o arquivo não está corrompido ou se é uma imagem escaneada.'
          },
          { status: 400 }
        );
      }

      // 2. Upload para Firebase Storage
      console.log('Fazendo upload para Firebase...');
      const fileUrl = await uploadToFirebase(tempFilePath, file.name);

      // 3. Análise com IA
      console.log('Analisando com IA...');
      const analysis = await analyzeWithGroq(extractedText, analysisType);

      // 4. Salvar resultado no Firestore
      const analysisDoc = {
        clientId: clientId || null,
        fileName: file.name,
        fileUrl: fileUrl,
        analysisType: ANALYSIS_TYPES[analysisType as keyof typeof ANALYSIS_TYPES] || 'Análise Completa',
        analysis: analysis,
        extractedText: extractedText.substring(0, 5000), // Primeiros 5000 caracteres
        createdAt: new Date(),
        fileSize: file.size
      };

      const docRef = await addDoc(collection(db, 'pdf_analyses'), analysisDoc);

      console.log('Análise de PDF concluída com sucesso');
      return NextResponse.json({
        resposta: analysis,
        sucesso: true,
        metadata: {
          documentId: docRef.id,
          fileName: file.name,
          analysisType: ANALYSIS_TYPES[analysisType as keyof typeof ANALYSIS_TYPES],
          fileUrl: fileUrl,
          modelo: 'llama3-8b-8192',
          timestamp: new Date().toISOString()
        }
      });

    } finally {
      // Limpeza do arquivo temporário
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }

  } catch (error) {
    console.error('Erro geral no endpoint /api/pdf-analysis:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        resposta: 'Desculpe, ocorreu um erro ao processar o arquivo. Tente novamente mais tarde.'
      },
      { status: 500 }
    );
  }
}
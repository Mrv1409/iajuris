import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  doc, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/firebase/firestore';

// ✅ TIPOS CORRIGIDOS - PADRONIZADO PARA advogadoId
export interface PeticaoData {
  advogadoId: string; // ✅ Padronizado
  tipoDocumento: string;
  titulo: string;
  conteudo: string;
  criadoEm: Timestamp;
  nomeCliente?: string;
  provedorIA: string;
}

export interface PeticaoComId extends PeticaoData {
  id: string;
}

// Função para gerar título automático baseado no tipo e caso
function gerarTituloAutomatico(tipoDocumento: string, descricaoCase: string, dadosCliente?: string): string {
  const tipo = tipoDocumento.charAt(0).toUpperCase() + tipoDocumento.slice(1);
  
  // Extrai nome do cliente se disponível
  let nomeCliente = '';
  if (dadosCliente) {
    const linhas = dadosCliente.split('\n');
    const primeiraLinha = linhas[0]?.trim();
    if (primeiraLinha && primeiraLinha.length > 0) {
      // Pega as primeiras 2-3 palavras como nome
      const palavras = primeiraLinha.split(' ').slice(0, 3);
      nomeCliente = palavras.join(' ');
    }
  }
  
  // Extrai palavras-chave da descrição do caso
  const palavrasChave = descricaoCase
    .split(' ')
    .filter(palavra => palavra.length > 4)
    .slice(0, 2)
    .join(' ');
  
  // Monta título inteligente
  if (nomeCliente) {
    return `${tipo} - ${nomeCliente} - ${palavrasChave}`.substring(0, 100);
  } else {
    return `${tipo} - ${palavrasChave}`.substring(0, 100);
  }
}

// Função para extrair nome do cliente dos dados
function extrairNomeCliente(dadosCliente?: string): string {
  if (!dadosCliente) return '';
  
  const linhas = dadosCliente.split('\n');
  const primeiraLinha = linhas[0]?.trim();
  
  if (primeiraLinha && primeiraLinha.length > 0) {
    // Remove possíveis prefixos como "Nome:", "Cliente:", etc.
    const nome = primeiraLinha
      .replace(/^(nome|cliente|requerente):\s*/i, '')
      .trim();
    
    // Pega apenas as primeiras 3 palavras para não ficar muito longo
    return nome.split(' ').slice(0, 3).join(' ');
  }
  
  return '';
}

// ✅ SALVAR PETIÇÃO CORRIGIDA - USA advogadoId CORRETAMENTE
export async function salvarPeticao(dados: {
  advogadoId: string;
  tipoDocumento: string;
  conteudo: string;
  descricaoCase: string;
  dadosCliente?: string;
  provedorIA?: string;
}): Promise<string> {
  try {
    const titulo = gerarTituloAutomatico(dados.tipoDocumento, dados.descricaoCase, dados.dadosCliente);
    const nomeCliente = extrairNomeCliente(dados.dadosCliente);
    
    const peticaoData: PeticaoData = {
      advogadoId: dados.advogadoId, // ✅ CORRIGIDO: Usa o advogadoId recebido
      tipoDocumento: dados.tipoDocumento,
      titulo,
      conteudo: dados.conteudo,
      criadoEm: Timestamp.now(),
      nomeCliente: nomeCliente || undefined,
      provedorIA: dados.provedorIA || 'groq'
    };

    const docRef = await addDoc(collection(db, 'peticoes'), peticaoData);
    console.log('Petição salva com sucesso:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Erro ao salvar petição:', error);
    throw new Error('Erro ao salvar documento. Tente novamente.');
  }
}

// ✅ LISTAR PETIÇÕES CORRIGIDA - BUSCA POR advogadoId
export async function listarPeticoesPorAdvogado(advogadoId: string): Promise<PeticaoComId[]> {
  try {
    const q = query(
      collection(db, 'peticoes'),
      where('advogadoId', '==', advogadoId),
    );

    const querySnapshot = await getDocs(q);
    const peticoes: PeticaoComId[] = [];

    querySnapshot.forEach((doc) => {
      peticoes.push({
        id: doc.id,
        ...doc.data() as PeticaoData
      });
    });

    return peticoes;
  } catch (error) {
    console.error('Erro ao listar petições:', error);
    throw new Error('Erro ao carregar documentos. Tente novamente.');
  }
}

// Excluir petição
export async function excluirPeticao(peticaoId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'peticoes', peticaoId));
    console.log('Petição excluída com sucesso:', peticaoId);
  } catch (error) {
    console.error('Erro ao excluir petição:', error);
    throw new Error('Erro ao excluir documento. Tente novamente.');
  }
}

// Buscar petições por texto (título ou tipo)
export async function buscarPeticoes(
  advogadoId: string, 
  textoBusca: string
): Promise<PeticaoComId[]> {
  try {
    // Primeiro pega todas as petições do advogado
    const todasPeticoes = await listarPeticoesPorAdvogado(advogadoId);
    
    // Filtra localmente por título ou tipo (Firebase não tem busca full-text nativa)
    const termosBusca = textoBusca.toLowerCase().split(' ');
    
    const peticoesFiltradas = todasPeticoes.filter(peticao => {
      const textoParaBusca = `${peticao.titulo} ${peticao.tipoDocumento} ${peticao.nomeCliente || ''}`.toLowerCase();
      return termosBusca.every(termo => textoParaBusca.includes(termo));
    });
    
    return peticoesFiltradas;
  } catch (error) {
    console.error('Erro ao buscar petições:', error);
    throw new Error('Erro na busca. Tente novamente.');
  }
}
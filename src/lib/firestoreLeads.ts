import { db } from '@/firebase/firestore';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, orderBy, getDocs, where, arrayUnion, serverTimestamp, getDoc } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore'; // Importar Timestamp do firebase/firestore para tipagem de data

export interface Message {
  tipo: 'user' | 'ai';
  mensagem: string;
  timestamp: string; // ISOString para consistência
}

export interface Lead {
  id?: string;
  nome: string;
  telefone: string;
  motivo: string;
  primeiraResposta?: string; // Pode ser a primeira resposta da IA
  
  dataRegistro: string; // Data inicial de criação da lead (ISOString)
  dataUltimaInteracao?: string; // Data da última mensagem no chat (ISOString)
  
  categoria?: string;
  
  // Para a intenção do cliente (definido no CHAT)
  tipoSolicitacaoCliente?: 'agendamento' | 'contato_advogado' | 'apenas_duvida'; 
  preferenciaAgendamentoCliente?: string; // Ex: "amanhã pela manhã", "15/07 às 14h"

  // Status de Atendimento (gerenciado na Dashboard pelo advogado)
  statusAtendimento: 'novo' | 'contatado' | 'agendado' | 'finalizado' | 'cancelado'; // Adicionado 'contatado' e 'cancelado' para mais flexibilidade
  
  observacoes?: string;
  
  historico: Message[]; // Array de mensagens do chat

  // Campos para detalhes do agendamento CONFIRMADO (preenchidos pelo ADVOGADO na Dashboard)
  dataAgendamentoConfirmado?: Timestamp | null; // Usar Timestamp do Firebase para datas de agendamento que podem ser usadas para queries
  localAgendamentoConfirmado?: string; // Ex: "Escritório", "Online", "Endereço do cliente"
  linkAgendamentoConfirmado?: string; // URL para reunião online (Zoom, Google Meet, etc.)
  advogadoResponsavelId?: string; // ID do advogado que irá atender
  advogadoResponsavelNome?: string; // Nome do advogado
}

// Salvar novo lead (usado uma única vez ao iniciar o formulário no chat)
// Agora retorna o ID do documento criado para que a ChatPage possa usá-lo
export async function createLead(leadData: Omit<Lead, 'id' | 'dataRegistro' | 'statusAtendimento' | 'historico' | 'dataUltimaInteracao' | 'tipoSolicitacaoCliente'>): Promise<string> {
  try {
    const leadToSave: Partial<Lead> = { // Usamos Partial para flexibilidade na criação
      ...leadData,
      dataRegistro: new Date().toISOString(), // Data de criação inicial
      dataUltimaInteracao: new Date().toISOString(), // Primeira interação
      statusAtendimento: 'novo', // Status inicial
      tipoSolicitacaoCliente: 'apenas_duvida', // Cliente inicia apenas com dúvida
      historico: [], // Começa com histórico vazio
      categoria: categorizarCaso(leadData.motivo),
    };

    const docRef = await addDoc(collection(db, 'leads'), leadToSave);
    console.log('Nova lead criada com ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Erro ao criar nova lead:', error);
    throw error;
  }
}

// Atualizar lead existente (usado tanto pelo chat quanto pela dashboard)
export async function updateLead(leadId: string, updates: Partial<Lead>) {
  try {
    const leadRef = doc(db, 'leads', leadId);
    await updateDoc(leadRef, {
        ...updates,
        dataUltimaAtualizacao: serverTimestamp() // Opcional: para rastrear a última modificação no documento
    });
    console.log('Lead atualizado:', leadId);
  } catch (error) {
    console.error('Erro ao atualizar lead:', error);
    throw error;
  }
}

export const deleteLead = async (leadId: string) => {
  try {
    const leadRef = doc(db, 'leads', leadId);
    await deleteDoc(leadRef);
    console.log(`Lead com ID ${leadId} deletada com sucesso.`);
  } catch (error) {
    console.error(`Erro ao deletar lead com ID ${leadId}:`, error);
    throw error; // Re-lançar o erro para que o componente possa tratá-lo
  }
};

// Buscar um único lead por ID
export async function getLeadById(leadId: string): Promise<Lead | null> {
    try {
        const docRef = doc(db, 'leads', leadId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return {
                id: docSnap.id,
                ...docSnap.data()
            } as Lead;
        } else {
            console.log("No such document!");
            return null;
        }
    } catch (error) {
        console.error("Error fetching lead:", error);
        throw error;
    }
}


// Buscar todos os leads
export async function getAllLeads(): Promise<Lead[]> {
  try {
    const q = query(collection(db, 'leads'), orderBy('dataRegistro', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const leads: Lead[] = [];
    querySnapshot.forEach((doc) => {
      leads.push({
        id: doc.id,
        ...doc.data()
      } as Lead);
    });
    
    return leads;
  } catch (error) {
    console.error('Erro ao buscar leads:', error);
    throw error;
  }
}

// Buscar leads por status
export async function getLeadsByStatus(status: Lead['statusAtendimento']): Promise<Lead[]> {
  try {
    const q = query(
      collection(db, 'leads'),
      where('statusAtendimento', '==', status),
      orderBy('dataRegistro', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    const leads: Lead[] = [];
    querySnapshot.forEach((doc) => {
      leads.push({
        id: doc.id,
        ...doc.data()
      } as Lead);
    });
    
    return leads;
  } catch (error) {
    console.error('Erro ao buscar leads por status:', error);
    throw error;
  }
}

// Buscar leads interessados em agendamento (mantendo sua função)
export async function getLeadsInteressados(): Promise<Lead[]> {
  try {
    const q = query(
      collection(db, 'leads'),
      where('tipoSolicitacaoCliente', '==', 'agendamento'), // Agora usando o novo campo
      orderBy('dataRegistro', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    const leads: Lead[] = [];
    querySnapshot.forEach((doc) => {
      leads.push({
        id: doc.id,
        ...doc.data()
      } as Lead);
    });
    
    return leads;
  } catch (error) {
    console.error('Erro ao buscar leads interessados:', error);
    throw error;
  }
}

// Adicionar mensagem ao histórico de forma correta (usando arrayUnion)
export async function addMensagemHistorico(
  leadId: string, 
  tipo: 'user' | 'ai', 
  mensagem: string
) {
  try {
    const leadRef = doc(db, 'leads', leadId);
    const novaMensagem: Message = { // Usamos a interface Message
      tipo,
      mensagem,
      timestamp: new Date().toISOString()
    };

    await updateDoc(leadRef, {
      historico: arrayUnion(novaMensagem), // Adiciona a nova mensagem ao array 'historico'
      dataUltimaInteracao: new Date().toISOString() // Atualiza a data da última interação
    });
    
    console.log('Mensagem adicionada ao histórico do lead:', leadId);
  } catch (error) {
    console.error('Erro ao adicionar mensagem:', error);
    throw error;
  }
}

// Marcar interesse em agendamento (pode ser usado na dashboard ou para atualizar a solicitação do cliente)
export async function marcarInteresseAgendamento(leadId: string, preferencia?: string) {
  try {
    const updates: Partial<Lead> = {
      tipoSolicitacaoCliente: 'agendamento',
      statusAtendimento: 'contatado' // Ou 'agendado' se já houver uma data definida pelo advogado
    };
    if (preferencia) {
        updates.preferenciaAgendamentoCliente = preferencia;
    }
    await updateLead(leadId, updates);
    console.log('Interesse em agendamento marcado para lead:', leadId);
  } catch (error) {
    console.error('Erro ao marcar interesse:', error);
    throw error;
  }
}

// Função auxiliar para categorizar casos
function categorizarCaso(motivo: string): string {
  const categorias = {
    'trabalhista': ['trabalho', 'emprego', 'demissão', 'rescisão', 'salário', 'horas extras', 'fgts'],
    'civil': ['contrato', 'dívida', 'cobrança', 'indenização', 'danos', 'responsabilidade'],
    'familia': ['divórcio', 'separação', 'pensão', 'guarda', 'alimentos', 'casamento'],
    'consumidor': ['compra', 'produto', 'serviço', 'defeito', 'propaganda', 'cobrança indevida'],
    'previdenciario': ['aposentadoria', 'benefício', 'inss', 'auxílio', 'revisão'],
    'criminal': ['crime', 'processo criminal', 'delegacia', 'prisão', 'denúncia'],
    'imobiliario': ['imóvel', 'aluguel', 'compra e venda', 'propriedade'],
    'tributario': ['imposto', 'receita', 'contribuinte']
  };

  const motivoLower = motivo.toLowerCase();
  
  for (const [categoria, palavras] of Object.entries(categorias)) {
    if (palavras.some(palavra => motivoLower.includes(palavra))) {
      return categoria;
    }
  }
  
  return 'geral';
}
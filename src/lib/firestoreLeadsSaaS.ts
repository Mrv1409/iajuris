import { 
    collection, 
    addDoc, 
    updateDoc, 
    doc, 
    getDocs, 
    query, 
    where, 
    orderBy, 
    serverTimestamp,
    Timestamp 
  } from 'firebase/firestore';
  import { db } from '@/firebase/firestore';
  
  // Tipos para Leads SaaS
  export interface MessageSaaS {
    tipo: 'user' | 'ai';
    mensagem: string;
    timestamp: string;
  }
  
  export interface LeadSaaS {
    id: string;
    // Dados básicos do cliente
    nome: string;
    telefone: string;
    motivo: string;
    
    // Identificação do advogado
    advogadoId: string;
    advogadoSlug: string;
    advogadoNome: string;
    
    // Status e controle
    statusAtendimento: 'novo' | 'em_andamento' | 'contatado' | 'finalizado';
    tipoSolicitacaoCliente?: 'agendamento' | 'contato_advogado';
    preferenciaAgendamentoCliente?: string;
    
    // Datas
    dataRegistro: Timestamp;
    dataUltimaInteracao: Timestamp;
    
    // Histórico de mensagens
    historico: MessageSaaS[];
  }
  
  // Criar nova lead para advogado específico
  export const createLeadSaaS = async (
    leadData: Omit<LeadSaaS, 'id' | 'dataRegistro' | 'dataUltimaInteracao' | 'statusAtendimento' | 'historico'>
  ): Promise<string> => {
    try {
      const newLead = {
        ...leadData,
        statusAtendimento: 'novo' as const,
        dataRegistro: serverTimestamp(),
        dataUltimaInteracao: serverTimestamp(),
        historico: [] as MessageSaaS[]
      };
  
      const docRef = await addDoc(collection(db, 'leads-saas'), newLead);
      console.log('✅ Lead SaaS criada com ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Erro ao criar lead SaaS:', error);
      throw error;
    }
  };
  
  // Atualizar lead existente
  export const updateLeadSaaS = async (
    leadId: string, 
    updates: Partial<Omit<LeadSaaS, 'id' | 'dataRegistro'>>
  ): Promise<void> => {
    try {
      const leadRef = doc(db, 'leads-saas', leadId);
      
      const updateData = {
        ...updates,
        dataUltimaInteracao: serverTimestamp()
      };
      
      await updateDoc(leadRef, updateData);
      console.log('✅ Lead SaaS atualizada:', leadId);
    } catch (error) {
      console.error('❌ Erro ao atualizar lead SaaS:', error);
      throw error;
    }
  };
  
  // Adicionar mensagem ao histórico da lead
  export const addMensagemHistoricoSaaS = async (
    leadId: string,
    tipo: 'user' | 'ai',
    mensagem: string
  ): Promise<void> => {
    try {
      const leadRef = doc(db, 'leads-saas', leadId);
      
      // Primeiro, buscar o histórico atual
      const leadDoc = await getDocs(query(
        collection(db, 'leads-saas'),
        where('__name__', '==', leadId)
      ));
      
      if (!leadDoc.empty) {
        const currentData = leadDoc.docs[0].data() as LeadSaaS;
        const currentHistorico = currentData.historico || [];
        
        // Adicionar nova mensagem
        const novaMensagem: MessageSaaS = {
          tipo,
          mensagem,
          timestamp: new Date().toISOString()
        };
        
        const updatedHistorico = [...currentHistorico, novaMensagem];
        
        // Atualizar com novo histórico
        await updateDoc(leadRef, {
          historico: updatedHistorico,
          dataUltimaInteracao: serverTimestamp()
        });
        
        console.log('✅ Mensagem adicionada ao histórico SaaS:', leadId);
      }
    } catch (error) {
      console.error('❌ Erro ao adicionar mensagem ao histórico SaaS:', error);
      throw error;
    }
  };
  
  // Buscar leads de um advogado específico
  export const getLeadsByAdvogado = async (advogadoId: string): Promise<LeadSaaS[]> => {
    try {
      const q = query(
        collection(db, 'leads-saas'),
        where('advogadoId', '==', advogadoId),
        orderBy('dataUltimaInteracao', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      const leads: LeadSaaS[] = [];
      querySnapshot.forEach((doc) => {
        leads.push({
          id: doc.id,
          ...doc.data()
        } as LeadSaaS);
      });
      
      console.log(`✅ Encontradas ${leads.length} leads para advogado:`, advogadoId);
      return leads;
    } catch (error) {
      console.error('❌ Erro ao buscar leads do advogado:', error);
      throw error;
    }
  };
  
  // Buscar leads de um advogado por slug
  export const getLeadsByAdvogadoSlug = async (advogadoSlug: string): Promise<LeadSaaS[]> => {
    try {
      const q = query(
        collection(db, 'leads-saas'),
        where('advogadoSlug', '==', advogadoSlug),
        orderBy('dataUltimaInteracao', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      const leads: LeadSaaS[] = [];
      querySnapshot.forEach((doc) => {
        leads.push({
          id: doc.id,
          ...doc.data()
        } as LeadSaaS);
      });
      
      console.log(`✅ Encontradas ${leads.length} leads para slug:`, advogadoSlug);
      return leads;
    } catch (error) {
      console.error('❌ Erro ao buscar leads por slug:', error);
      throw error;
    }
  };
  
  // Buscar uma lead específica
  export const getLeadSaaS = async (leadId: string): Promise<LeadSaaS | null> => {
    try {
      const q = query(
        collection(db, 'leads-saas'),
        where('__name__', '==', leadId)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data()
        } as LeadSaaS;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Erro ao buscar lead SaaS:', error);
      throw error;
    }
  };
  
  // Estatísticas rápidas para dashboard do advogado
  export const getAdvogadoStats = async (advogadoId: string) => {
    try {
      const leads = await getLeadsByAdvogado(advogadoId);
      
      const stats = {
        totalLeads: leads.length,
        leadsNovos: leads.filter(l => l.statusAtendimento === 'novo').length,
        leadsEmAndamento: leads.filter(l => l.statusAtendimento === 'em_andamento').length,
        leadsContatados: leads.filter(l => l.statusAtendimento === 'contatado').length,
        agendamentosRequisitados: leads.filter(l => l.tipoSolicitacaoCliente === 'agendamento').length,
        contatosRequisitados: leads.filter(l => l.tipoSolicitacaoCliente === 'contato_advogado').length
      };
      
      console.log('✅ Stats calculadas para advogado:', advogadoId, stats);
      return stats;
    } catch (error) {
      console.error('❌ Erro ao calcular stats:', error);
      throw error;
    }
  };
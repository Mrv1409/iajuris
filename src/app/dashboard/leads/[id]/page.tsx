'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/firestore';

// Atualiza a interface Lead para refletir a estrutura do Firestore
interface Lead {
  id: string;
  nome: string;
  telefone: string;
  motivo: string;
  timestamp: Timestamp; // Data de registro da lead (Timestamp do Firestore)
  status?: 'novo' | 'contatado' | 'agendado' | 'finalizado';
  
  // NOME CORRETO para o histórico da conversa com a IA
  historico?: Array<{
    remetente: 'user' | 'ai';
    mensagem: string;
    timestamp: Timestamp; // Assumindo que o timestamp no histórico também é um Timestamp
  }>;
  
  observacoes?: string;

  // Adicione aqui os campos de agendamento se eles forem salvos no Firestore
  // e você quiser exibi-los nesta página
  tipoSolicitacaoCliente?: 'apenas_duvida' | 'agendamento' | 'contato_advogado';
  preferenciaAgendamentoCliente?: string;
}

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    if (params.id) {
      fetchLead(params.id as string);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);
  
  const fetchLead = async (id: string) => {
    try {
      console.log(`Fetching lead with ID: ${id}`); // Log para depuração
      const docRef = doc(db, 'leads', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const leadData = {
          id: docSnap.id,
          nome: data.nome,
          telefone: data.telefone,
          motivo: data.motivo,
          timestamp: data.timestamp as Timestamp,
          status: data.status || 'novo',
          
          // EXTRAI O CAMPO 'historico' (e não 'conversaIA')
          historico: data.historico || [], 
          
          observacoes: data.observacoes || '',
          tipoSolicitacaoCliente: data.tipoSolicitacaoCliente || 'apenas_duvida',
          preferenciaAgendamentoCliente: data.preferenciaAgendamentoCliente || ''
        } as Lead;
        
        console.log('Lead data fetched:', leadData); // Log para ver os dados completos
        setLead(leadData);
        setObservacoes(leadData.observacoes || '');
      } else {
        console.error('Lead não encontrada para o ID:', id);
        router.push('/dashboard/leads');
      }
    } catch (error) {
      console.error('Erro ao buscar lead:', error);
      router.push('/dashboard/leads');
    } finally {
      setLoading(false);
    }
  };

  const updateLeadStatus = async (newStatus: string) => {
    if (!lead) return;
    
    setUpdating(true);
    try {
      await updateDoc(doc(db, 'leads', lead.id), {
        status: newStatus,
        observacoes: observacoes, // Garante que as observações atuais também sejam salvas
        updatedAt: new Date() // Adiciona um campo de atualização para rastreamento
      });
      // Atualiza o estado local para refletir a mudança
      setLead({ ...lead, status: newStatus as 'novo' | 'contatado' | 'agendado' | 'finalizado', observacoes });
      console.log(`Status da lead ${lead.id} atualizado para: ${newStatus}`);
    } catch (error) {
      console.error('Erro ao atualizar lead:', error);
    } finally {
      setUpdating(false);
    }
  };

  const saveObservacoes = async () => {
    if (!lead) return;
    
    setUpdating(true);
    try {
      await updateDoc(doc(db, 'leads', lead.id), {
        observacoes: observacoes,
        updatedAt: new Date() // Adiciona um campo de atualização para rastreamento
      });
      // Atualiza o estado local
      setLead({ ...lead, observacoes: observacoes });
      console.log(`Observações da lead ${lead.id} salvas.`);
    } catch (error) {
      console.error('Erro ao salvar observações:', error);
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return 'Data não disponível';
    
    let date;
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) { // Caso seja um objeto Date direto
      date = timestamp;
    } else { // Fallback, caso o formato não seja o esperado
      console.warn('Timestamp em formato inesperado:', timestamp);
      date = new Date(); // Usa a data atual como fallback
    }
    
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatMessageTimestamp = (timestamp: Timestamp) => {
    if (!timestamp) return '';
    let date;
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } else {
      date = new Date(); // Fallback
    }
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      novo: { color: '#10b981', bg: '#10b98120', text: 'Novo' },
      contatado: { color: '#f59e0b', bg: '#f59e0b20', text: 'Contatado' },
      agendado: { color: '#3b82f6', bg: '#3b82f620', text: 'Agendado' },
      finalizado: { color: '#6b7280', bg: '#6b728020', text: 'Finalizado' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.novo;
    
    return (
      <span 
        className="px-3 py-1 rounded-full text-sm font-medium"
        style={{ 
          color: config.color, 
          backgroundColor: config.bg 
        }}
      >
        {config.text}
      </span>
    );
  };

  const openWhatsApp = () => {
    if (!lead) return;
    const message = `Olá ${lead.nome}! Sou do escritório jurídico. Vi que você teve uma consulta com nossa IA sobre: "${lead.motivo}". Gostaria de agendar uma consulta presencial?`;
    const url = `https://wa.me/55${lead.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const callPhone = () => {
    if (!lead) return;
    window.open(`tel:${lead.telefone}`, '_self');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#b0825a] mx-auto mb-4"></div>
          <p>Carregando detalhes da lead...</p>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-12 text-white">
        <h3 className="text-xl font-semibold mb-2">Lead não encontrada</h3>
        <Link href="/dashboard/leads" className="text-[#b0825a] hover:underline">
          ← Voltar para lista de leads
        </Link>
      </div>
    );
  }

  return (
    <div className="text-white min-h-screen p-6 bg-dark-bg-primary"> {/* Adicionado bg */}
      {/* Header */}
      <div className="mb-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-brand-accent">👤 Detalhes da Lead</h1> {/* Ajustado cor */}
            <p className="text-text-secondary"> {/* Ajustado cor */}
              Informações completas do atendimento
            </p>
          </div>
          <Link 
            href="/dashboard/leads"
            className="px-4 py-2 bg-dark-bg-card-hover hover:bg-[#5a5955] rounded-lg transition-colors text-text-white" // Ajustado cores
          >
            ← Voltar à Lista
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {/* Informações Principais */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dados Pessoais */}
          <div className="bg-dark-bg-card border border-text-secondary rounded-xl p-6"> {/* Ajustado cores */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-brand-accent">📋 Dados Pessoais</h2> {/* Ajustado cor */}
              {getStatusBadge(lead.status!)}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Nome</label> {/* Ajustado cor */}
                <p className="text-lg font-semibold text-text-white">{lead.nome}</p> {/* Ajustado cor */}
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Telefone</label> {/* Ajustado cor */}
                <p className="text-lg font-semibold text-text-white">{lead.telefone}</p> {/* Ajustado cor */}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text-secondary mb-1">Data do Atendimento</label> {/* Ajustado cor */}
                <p className="text-lg font-semibold text-text-white">{formatDate(lead.timestamp)}</p> {/* Ajustado cor */}
              </div>
              {/* Adicione os campos de agendamento aqui */}
              {lead.tipoSolicitacaoCliente && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-text-secondary mb-1">Tipo de Solicitação</label>
                  <p className="text-lg font-semibold text-text-white">
                    {lead.tipoSolicitacaoCliente === 'agendamento' && 'Agendamento de Consulta'}
                    {lead.tipoSolicitacaoCliente === 'contato_advogado' && 'Solicitou Contato Direto com Advogado'}
                    {lead.tipoSolicitacaoCliente === 'apenas_duvida' && 'Apenas Dúvida (Inicialmente)'}
                  </p>
                </div>
              )}
              {lead.preferenciaAgendamentoCliente && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-text-secondary mb-1">Preferência de Agendamento</label>
                  <p className="text-lg font-semibold text-text-white">{lead.preferenciaAgendamentoCliente}</p>
                </div>
              )}
            </div>
          </div>

          {/* Motivo da Consulta */}
          <div className="bg-dark-bg-card border border-text-secondary rounded-xl p-6"> {/* Ajustado cores */}
            <h2 className="text-xl font-semibold text-brand-accent mb-4">⚖️ Motivo da Consulta</h2> {/* Ajustado cor */}
            <div className="bg-dark-bg-input rounded-lg p-4"> {/* Ajustado cor */}
              <p className="text-text-white leading-relaxed">{lead.motivo}</p> {/* Ajustado cor */}
            </div>
          </div>

          {/* Histórico da Conversa com IA - Agora usando 'historico' */}
          {lead.historico && lead.historico.length > 0 && (
            <div className="bg-dark-bg-card border border-text-secondary rounded-xl p-6"> {/* Ajustado cores */}
              <h2 className="text-xl font-semibold text-brand-accent mb-4">🤖 Conversa com IA</h2> {/* Ajustado cor */}
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar"> {/* Adicionado custom-scrollbar */}
                {lead.historico.map((msg, index) => (
                  <div key={index} className={`flex ${msg.remetente === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                      msg.remetente === 'user' 
                        ? 'bg-brand-accent text-text-white rounded-br-none' // Ajustado cores
                        : 'bg-dark-bg-input text-text-white rounded-bl-none' // Ajustado cores
                    }`}>
                      <div className="text-xs opacity-75 mb-1">
                        {msg.remetente === 'user' ? 'Cliente' : 'IA Jurídica'} ({formatMessageTimestamp(msg.timestamp)})
                      </div>
                      <p className="text-sm leading-relaxed">{msg.mensagem}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Observações */}
          <div className="bg-dark-bg-card border border-text-secondary rounded-xl p-6"> {/* Ajustado cores */}
            <h2 className="text-xl font-semibold text-brand-accent mb-4">📝 Observações</h2> {/* Ajustado cor */}
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Adicione observações sobre este cliente..."
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-text-secondary bg-dark-bg-input text-text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-accent resize-none" // Ajustado cores
            />
            <button
              onClick={saveObservacoes}
              disabled={updating}
              className="mt-3 px-4 py-2 bg-brand-accent hover:bg-[#9a7049] rounded-lg transition-colors disabled:opacity-50 text-text-white" // Ajustado cores
            >
              {updating ? 'Salvando...' : 'Salvar Observações'}
            </button>
          </div>
        </div>

        {/* Sidebar - Ações */}
        <div className="space-y-6">
          {/* Ações Rápidas */}
          <div className="bg-dark-bg-card border border-text-secondary rounded-xl p-6"> {/* Ajustado cores */}
            <h2 className="text-xl font-semibold text-brand-accent mb-4">🚀 Ações Rápidas</h2> {/* Ajustado cor */}
            
            <div className="space-y-3">
              <button
                onClick={openWhatsApp}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#25d366] hover:bg-[#1ea952] rounded-lg transition-colors text-white font-medium"
              >
                <span>📱</span>
                WhatsApp
              </button>
              
              <button
                onClick={callPhone}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#3b82f6] hover:bg-[#2563eb] rounded-lg transition-colors text-white font-medium"
              >
                <span>📞</span>
                Ligar
              </button>
              
              <button
                onClick={() => navigator.clipboard.writeText(lead.telefone)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#6b7280] hover:bg-[#4b5563] rounded-lg transition-colors text-white font-medium"
              >
                <span>📋</span>
                Copiar Telefone
              </button>
            </div>
          </div>

          {/* Alterar Status */}
          <div className="bg-dark-bg-card border border-text-secondary rounded-xl p-6"> {/* Ajustado cores */}
            <h2 className="text-xl font-semibold text-brand-accent mb-4">📊 Alterar Status</h2> {/* Ajustado cor */}
            
            <div className="space-y-3">
              <button
                onClick={() => updateLeadStatus('novo')}
                disabled={updating || lead.status === 'novo'}
                className="w-full px-4 py-2 bg-[#10b981] hover:bg-[#059669] rounded-lg transition-colors text-white font-medium disabled:opacity-50"
              >
                {updating ? 'Atualizando...' : 'Marcar como Novo'}
              </button>
              
              <button
                onClick={() => updateLeadStatus('contatado')}
                disabled={updating || lead.status === 'contatado'}
                className="w-full px-4 py-2 bg-[#f59e0b] hover:bg-[#d97706] rounded-lg transition-colors text-white font-medium disabled:opacity-50"
              >
                {updating ? 'Atualizando...' : 'Marcar como Contatado'}
              </button>
              
              <button
                onClick={() => updateLeadStatus('agendado')}
                disabled={updating || lead.status === 'agendado'}
                className="w-full px-4 py-2 bg-[#3b82f6] hover:bg-[#2563eb] rounded-lg transition-colors text-white font-medium disabled:opacity-50"
              >
                {updating ? 'Atualizando...' : 'Marcar como Agendado'}
              </button>
              
              <button
                onClick={() => updateLeadStatus('finalizado')}
                disabled={updating || lead.status === 'finalizado'}
                className="w-full px-4 py-2 bg-[#6b7280] hover:bg-[#4b5563] rounded-lg transition-colors text-white font-medium disabled:opacity-50"
              >
                {updating ? 'Atualizando...' : 'Marcar como Finalizado'}
              </button>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="bg-dark-bg-card border border-text-secondary rounded-xl p-6"> {/* Ajustado cores */}
            <h2 className="text-xl font-semibold text-brand-accent mb-4">📈 Estatísticas</h2> {/* Ajustado cor */}
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-text-secondary">Mensagens na conversa:</span> {/* Ajustado cor */}
                <span className="font-semibold text-text-white">{lead.historico?.length || 0}</span> {/* Ajustado para historico */}
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Status atual:</span> {/* Ajustado cor */}
                <span className="font-semibold text-text-white">{lead.status}</span> {/* Ajustado cor */}
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Tem observações:</span> {/* Ajustado cor */}
                <span className="font-semibold text-text-white">{lead.observacoes ? 'Sim' : 'Não'}</span> {/* Ajustado cor */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
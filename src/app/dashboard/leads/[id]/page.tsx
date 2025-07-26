'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { ArrowLeft, User, Phone, MessageSquare, Clipboard, TrendingUp, Bell } from 'lucide-react'; // Importando ícones para uso

// Atualiza a interface Lead para refletir a estrutura do Firestore
interface Lead {
  id: string;
  nome: string;
  telefone: string;
  motivo: string;
  timestamp: Timestamp; // Data de registro da lead (Timestamp do Firestore)
  status?: 'novo' | 'contatado' | 'agendado' | 'finalizado' | 'cancelado'; // Adicionado 'cancelado'
  
  historico?: Array<{
    remetente: 'user' | 'ai';
    mensagem: string;
    timestamp: Timestamp; // Assumindo que o timestamp no histórico também é um Timestamp
  }>;
  
  observacoes?: string;

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
      console.log(`Fetching lead with ID: ${id}`);
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
          historico: data.historico || [], 
          observacoes: data.observacoes || '',
          tipoSolicitacaoCliente: data.tipoSolicitacaoCliente || 'apenas_duvida',
          preferenciaAgendamentoCliente: data.preferenciaAgendamentoCliente || ''
        } as Lead;
        
        console.log('Lead data fetched:', leadData);
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

  const updateLeadStatus = async (newStatus: Lead['status']) => { // Usando o tipo Lead['status']
    if (!lead) return;
    
    setUpdating(true);
    try {
      await updateDoc(doc(db, 'leads', lead.id), {
        status: newStatus,
        observacoes: observacoes, 
        updatedAt: new Date() 
      });
      setLead({ ...lead, status: newStatus, observacoes });
      console.log(`Status da lead ${lead.id} atualizado para: ${newStatus}`);
    } catch (error) {
      console.error('Erro ao atualizar lead:', error);
      alert('Erro ao atualizar status da lead. Por favor, tente novamente.');
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
        updatedAt: new Date() 
      });
      setLead({ ...lead, observacoes: observacoes });
      console.log(`Observações da lead ${lead.id} salvas.`);
    } catch (error) {
      console.error('Erro ao salvar observações:', error);
      alert('Erro ao salvar observações. Por favor, tente novamente.');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return 'Data não disponível';
    
    let date;
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) { 
      date = timestamp;
    } else { 
      console.warn('Timestamp em formato inesperado:', timestamp);
      date = new Date(); 
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
      date = new Date(); 
    }
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status: Lead['status']) => { // Usando o tipo Lead['status']
    const statusConfig = {
      novo: { 
        color: '#22c55e', 
        bg: 'linear-gradient(135deg, #22c55e20 0%, #22c55e30 100%)', 
        text: 'Novo',
        borderColor: '#22c55e40' // Adicionado para consistência
      },
      contatado: { 
        color: '#b0825a', 
        bg: 'linear-gradient(135deg, #b0825a20 0%, #b0825a30 100%)', 
        text: 'Contatado',
        borderColor: '#b0825a40' // Adicionado para consistência
      },
      agendado: { 
        color: '#3b82f6', 
        bg: 'linear-gradient(135deg, #3b82f620 0%, #3b82f630 100%)', 
        text: 'Agendado',
        borderColor: '#3b82f640' // Adicionado para consistência
      },
      finalizado: { 
        color: '#6e6d6b', 
        bg: 'linear-gradient(135deg, #6e6d6b20 0%, #6e6d6b30 100%)', 
        text: 'Finalizado',
        borderColor: '#6e6d6b40' // Adicionado para consistência
      },
      cancelado: { // Adicionado status 'cancelado'
        color: '#ef4444', 
        bg: 'linear-gradient(135deg, #ef444420 0%, #ef444430 100%)', 
        text: 'Cancelado',
        borderColor: '#ef444440' // Adicionado para consistência
      }
    };
    
    const config = statusConfig[status || 'novo']; // Fallback para 'novo' se status for undefined
    
    return (
      <span 
        className="px-4 py-2 rounded-full text-xs font-semibold border shadow-sm backdrop-blur-sm" // Ajustado padding e border-radius
        style={{ 
          color: config.color, 
          background: config.bg,
          borderColor: config.borderColor
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

  const copyToClipboard = (text: string) => {
    // Usando document.execCommand para compatibilidade em iframes
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      alert('Telefone copiado para a área de transferência!'); // Substituir por um modal customizado em produção
    } catch (err) {
      console.error('Falha ao copiar:', err);
      alert('Erro ao copiar telefone. Por favor, tente manualmente.');
    }
    document.body.removeChild(textarea);
  };

  if (loading) {
    return (
      <main className="min-h-screen relative overflow-hidden flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 30%, #2a2a2a 60%, #3a2a1a 100%)' }}>
        {/* Elementos decorativos */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-[#b0825a] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-[#b0825a] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-1000" />
        
        <div className="relative z-10 text-center p-8 rounded-2xl backdrop-blur-sm" 
          style={{ 
            backgroundColor: 'rgba(20, 20, 20, 0.8)',
            border: '1px solid rgba(176, 130, 90, 0.2)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)' 
          }}>
          <div className="relative mb-8">
            <div className="w-20 h-20 border-4 border-[#b0825a]/30 rounded-full animate-spin border-t-[#b0825a] mx-auto"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-[#b0825a]/20 rounded-full animate-pulse mx-auto"></div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Carregando detalhes da lead...</h2>
          <p className="text-[#d4d4d4]">Aguarde um momento</p>
        </div>
      </main>
    );
  }

  if (!lead) {
    return (
      <main className="min-h-screen relative overflow-hidden flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 30%, #2a2a2a 60%, #3a2a1a 100%)' }}>
        {/* Elementos decorativos */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-[#b0825a] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-[#b0825a] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-1000" />
        
        <div className="relative z-10 text-center p-8 rounded-2xl backdrop-blur-sm" 
          style={{ 
            backgroundColor: 'rgba(20, 20, 20, 0.8)',
            border: '1px solid rgba(176, 130, 90, 0.2)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)' 
          }}>
          <h3 className="text-2xl font-bold text-white mb-4">Lead não encontrada</h3>
          <Link href="/dashboard/leads" 
            className="group flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg mx-auto"
            style={{ 
              background: 'linear-gradient(135deg, #b0825a 0%, #8b6942 50%, #6d532a 100%)',
              boxShadow: '0 10px 25px rgba(176, 130, 90, 0.3)',
              color: '#ffffff'
            }}
          >
            <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            Voltar para lista de leads
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 30%, #2a2a2a 60%, #3a2a1a 100%)' }}>
      
      {/* Elementos decorativos */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-[#b0825a] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
      <div className="absolute bottom-20 right-20 w-72 h-72 bg-[#b0825a] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-1000" />

      {/* Container principal de conteúdo */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-8">
        {/* Header da Página */}
        <div className="mb-8 max-w-7xl mx-auto p-6 rounded-2xl backdrop-blur-sm border"
          style={{ 
            backgroundColor: 'rgba(20, 20, 20, 0.8)',
            borderColor: 'rgba(176, 130, 90, 0.2)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
          }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-white">
                <User className="inline-block w-8 h-8 mr-3 text-[#b0825a]" /> Detalhes da Lead
              </h1>
              <p className="text-lg sm:text-xl font-light opacity-80" style={{ color: '#d4d4d4' }}>
                Informações completas do atendimento
              </p>
            </div>
            <Link 
              href="/dashboard/leads"
              className="group flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg"
              style={{ 
                background: 'linear-gradient(135deg, #b0825a 0%, #8b6942 50%, #6d532a 100%)',
                boxShadow: '0 10px 25px rgba(176, 130, 90, 0.3)',
                color: '#ffffff'
              }}
            >
              <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
              Voltar à Lista
            </Link>
          </div>
        </div>

        {/* Grid de Conteúdo Principal e Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {/* Informações Principais */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dados Pessoais */}
            <div className="p-6 rounded-2xl backdrop-blur-sm border"
              style={{ 
                backgroundColor: 'rgba(20, 20, 20, 0.8)',
                borderColor: 'rgba(176, 130, 90, 0.2)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
              }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">
                  <User className="inline-block w-6 h-6 mr-2 text-[#b0825a]" /> Dados Pessoais
                </h2>
                {getStatusBadge(lead.status!)}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#d4d4d4' }}>Nome</label>
                  <p className="text-lg font-semibold text-white">{lead.nome}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#d4d4d4' }}>Telefone</label>
                  <p className="text-lg font-semibold text-white">{lead.telefone}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1" style={{ color: '#d4d4d4' }}>Data do Atendimento</label>
                  <p className="text-lg font-semibold text-white">{formatDate(lead.timestamp)}</p>
                </div>
                {lead.tipoSolicitacaoCliente && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1" style={{ color: '#d4d4d4' }}>Tipo de Solicitação</label>
                    <p className="text-lg font-semibold text-white">
                      {lead.tipoSolicitacaoCliente === 'agendamento' && 'Agendamento de Consulta'}
                      {lead.tipoSolicitacaoCliente === 'contato_advogado' && 'Solicitou Contato Direto com Advogado'}
                      {lead.tipoSolicitacaoCliente === 'apenas_duvida' && 'Apenas Dúvida (Inicialmente)'}
                    </p>
                  </div>
                )}
                {lead.preferenciaAgendamentoCliente && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1" style={{ color: '#d4d4d4' }}>Preferência de Agendamento</label>
                    <p className="text-lg font-semibold text-white">{lead.preferenciaAgendamentoCliente}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Motivo da Consulta */}
            <div className="p-6 rounded-2xl backdrop-blur-sm border"
              style={{ 
                backgroundColor: 'rgba(20, 20, 20, 0.8)',
                borderColor: 'rgba(176, 130, 90, 0.2)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
              }}>
              <h2 className="text-xl font-semibold text-white mb-4">
                <MessageSquare className="inline-block w-6 h-6 mr-2 text-[#b0825a]" /> Motivo da Consulta
              </h2>
              <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(40, 40, 40, 0.8)', border: '1px solid #6e6d6b' }}>
                <p className="text-white leading-relaxed">{lead.motivo}</p>
              </div>
            </div>

            {/* Histórico da Conversa com IA */}
            {lead.historico && lead.historico.length > 0 && (
              <div className="p-6 rounded-2xl backdrop-blur-sm border"
                style={{ 
                  backgroundColor: 'rgba(20, 20, 20, 0.8)',
                  borderColor: 'rgba(176, 130, 90, 0.2)',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                }}>
                <h2 className="text-xl font-semibold text-white mb-4">
                  <Bell className="inline-block w-6 h-6 mr-2 text-[#b0825a]" /> Conversa com IA
                </h2>
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                  {lead.historico.map((msg, index) => (
                    <div key={index} className={`flex ${msg.remetente === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-xl shadow-md ${ // Ajustado rounded e shadow
                        msg.remetente === 'user' 
                          ? 'bg-gradient-to-br from-[#b0825a] via-[#8b6942] to-[#6d532a] text-white rounded-br-none' // Gradiente dourado
                          : 'bg-[rgba(40,40,40,0.8)] text-white rounded-bl-none border border-[#6e6d6b]' // Cor de input com borda
                      }`}>
                        <div className="text-xs opacity-75 mb-1" style={{ color: msg.remetente === 'user' ? 'rgba(255,255,255,0.8)' : '#d4d4d4' }}>
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
            <div className="p-6 rounded-2xl backdrop-blur-sm border"
              style={{ 
                backgroundColor: 'rgba(20, 20, 20, 0.8)',
                borderColor: 'rgba(176, 130, 90, 0.2)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
              }}>
              <h2 className="text-xl font-semibold text-white mb-4">
                <Clipboard className="inline-block w-6 h-6 mr-2 text-[#b0825a]" /> Observações
              </h2>
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Adicione observações sobre este cliente..."
                rows={4}
                className="w-full p-4 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-[#b0825a] focus:border-transparent transform focus:scale-[1.02] resize-none"
                style={{ backgroundColor: 'rgba(40, 40, 40, 0.8)', borderColor: '#6e6d6b', color: '#ffffff',  }}
              />
              <button
                onClick={saveObservacoes}
                disabled={updating}
                className="mt-4 w-full py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:opacity-90 active:scale-95 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                style={{ 
                  background: 'linear-gradient(135deg, #b0825a 0%, #8b6942 50%, #6d532a 100%)',
                  boxShadow: '0 10px 25px rgba(176, 130, 90, 0.3)',
                  color: '#ffffff'
                }}
              >
                {updating ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    Salvando...
                  </div>
                ) : (
                  'Salvar Observações'
                )}
              </button>
            </div>
          </div>

          {/* Sidebar - Ações */}
          <div className="space-y-6">
            {/* Ações Rápidas */}
            <div className="p-6 rounded-2xl backdrop-blur-sm border"
              style={{ 
                backgroundColor: 'rgba(20, 20, 20, 0.8)',
                borderColor: 'rgba(176, 130, 90, 0.2)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
              }}>
              <h2 className="text-xl font-semibold text-white mb-4">
                <TrendingUp className="inline-block w-6 h-6 mr-2 text-[#b0825a]" /> Ações Rápidas
              </h2>
              
              <div className="space-y-3">
                <button
                  onClick={openWhatsApp}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg"
                  style={{ 
                    background: 'linear-gradient(135deg, #25d366 0%, #1da84d 50%, #178a3f 100%)', // Gradiente WhatsApp
                    boxShadow: '0 10px 25px rgba(37, 211, 102, 0.3)',
                    color: '#ffffff'
                  }}
                >
                  <Phone className="w-5 h-5" />
                  WhatsApp
                </button>
                
                <button
                  onClick={callPhone}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg"
                  style={{ 
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)', // Gradiente Azul
                    boxShadow: '0 10px 25px rgba(59, 130, 246, 0.3)',
                    color: '#ffffff'
                  }}
                >
                  <Phone className="w-5 h-5" />
                  Ligar
                </button>
                
                <button
                  onClick={() => copyToClipboard(lead.telefone)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg"
                  style={{ 
                    background: 'linear-gradient(135deg, #6e6d6b 0%, #5a5955 50%, #4b4a45 100%)', // Gradiente Cinza
                    boxShadow: '0 10px 25px rgba(110, 109, 107, 0.3)',
                    color: '#ffffff'
                  }}
                >
                  <Clipboard className="w-5 h-5" />
                  Copiar Telefone
                </button>
              </div>
            </div>

            {/* Alterar Status */}
            <div className="p-6 rounded-2xl backdrop-blur-sm border"
              style={{ 
                backgroundColor: 'rgba(20, 20, 20, 0.8)',
                borderColor: 'rgba(176, 130, 90, 0.2)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
              }}>
              <h2 className="text-xl font-semibold text-white mb-4">
                <TrendingUp className="inline-block w-6 h-6 mr-2 text-[#b0825a]" /> Alterar Status
              </h2>
              
              <div className="space-y-3">
                <button
                  onClick={() => updateLeadStatus('novo')}
                  disabled={updating || lead.status === 'novo'}
                  className="w-full py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                  style={{ 
                    background: 'linear-gradient(135deg, #22c55e 0%, #1ea84d 50%, #178a3f 100%)', // Gradiente Verde
                    boxShadow: '0 10px 25px rgba(34, 197, 94, 0.3)',
                    color: '#ffffff'
                  }}
                >
                  {updating && lead.status !== 'novo' ? 'Atualizando...' : 'Marcar como Novo'}
                </button>
                
                <button
                  onClick={() => updateLeadStatus('contatado')}
                  disabled={updating || lead.status === 'contatado'}
                  className="w-full py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                  style={{ 
                    background: 'linear-gradient(135deg, #b0825a 0%, #8b6942 50%, #6d532a 100%)', // Gradiente Dourado
                    boxShadow: '0 10px 25px rgba(176, 130, 90, 0.3)',
                    color: '#ffffff'
                  }}
                >
                  {updating && lead.status !== 'contatado' ? 'Atualizando...' : 'Marcar como Contatado'}
                </button>
                
                <button
                  onClick={() => updateLeadStatus('agendado')}
                  disabled={updating || lead.status === 'agendado'}
                  className="w-full py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                  style={{ 
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)', // Gradiente Azul
                    boxShadow: '0 10px 25px rgba(59, 130, 246, 0.3)',
                    color: '#ffffff'
                  }}
                >
                  {updating && lead.status !== 'agendado' ? 'Atualizando...' : 'Marcar como Agendado'}
                </button>
                
                <button
                  onClick={() => updateLeadStatus('finalizado')}
                  disabled={updating || lead.status === 'finalizado'}
                  className="w-full py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                  style={{ 
                    background: 'linear-gradient(135deg, #6e6d6b 0%, #5a5955 50%, #4b4a45 100%)', // Gradiente Cinza
                    boxShadow: '0 10px 25px rgba(110, 109, 107, 0.3)',
                    color: '#ffffff'
                  }}
                >
                  {updating && lead.status !== 'finalizado' ? 'Atualizando...' : 'Marcar como Finalizado'}
                </button>

                <button
                  onClick={() => updateLeadStatus('cancelado')} // Novo botão para status 'cancelado'
                  disabled={updating || lead.status === 'cancelado'}
                  className="w-full py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                  style={{ 
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)', // Gradiente Vermelho
                    boxShadow: '0 10px 25px rgba(239, 68, 68, 0.3)',
                    color: '#ffffff'
                  }}
                >
                  {updating && lead.status !== 'cancelado' ? 'Atualizando...' : 'Marcar como Cancelado'}
                </button>
              </div>
            </div>

            {/* Estatísticas */}
            <div className="p-6 rounded-2xl backdrop-blur-sm border"
              style={{ 
                backgroundColor: 'rgba(20, 20, 20, 0.8)',
                borderColor: 'rgba(176, 130, 90, 0.2)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
              }}>
              <h2 className="text-xl font-semibold text-white mb-4">
                <TrendingUp className="inline-block w-6 h-6 mr-2 text-[#b0825a]" /> Estatísticas
              </h2>
              
              <div className="space-y-3" style={{ color: '#d4d4d4' }}>
                <div className="flex justify-between">
                  <span>Mensagens na conversa:</span>
                  <span className="font-semibold text-white">{lead.historico?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status atual:</span>
                  <span className="font-semibold text-white">{lead.status}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tem observações:</span>
                  <span className="font-semibold text-white">{lead.observacoes ? 'Sim' : 'Não'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS para animações customizadas */}
      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 0.1;
            transform: scale(1);
          }
          50% {
            opacity: 0.2;
            transform: scale(1.05);
          }
        }

        .animation-delay-1000 {
          animation-delay: 1s;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-3000 {
          animation-delay: 3s;
        }
        .animate-pulse {
          animation: pulse 3s ease-in-out infinite;
        }

        /* Custom scrollbar for chat history */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(40, 40, 40, 0.8); /* Cor da trilha da barra de rolagem */
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #b0825a; /* Cor do "polegar" da barra de rolagem */
          border-radius: 10px;
          border: 2px solid rgba(40, 40, 40, 0.8); /* Borda para destacá-lo da trilha */
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #8b6942; /* Cor no hover */
        }
      `}</style>
    </main>
  );
}
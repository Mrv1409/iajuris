'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';//eslint-disable-next-line
import { ArrowLeft, Send, Calendar, Phone, MapPin, Award, MessageCircle, CheckCircle2, Clock, User, Sparkles, Scale, Gavel, LogOut, Briefcase } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { 
  createLeadSaaS, 
  addMensagemHistoricoSaaS, 
  updateLeadSaaS, 
  MessageSaaS, 
  LeadSaaS 
} from '@/lib/firestoreLeadsSaaS';

// Tipo para dados do advogado
type AdvogadoData = {
  id: string;
  nome: string;
  especialidades: string[];
  experiencia: string;
  cidade: string;
  contato: string;
  biografia: string;
  slug: string;
  dataCriacao: string;
  // Campos de personalização
  corPrimaria?: string;
  corSecundaria?: string;
  corTerciaria?: string;
  fotoPerfilUrl?: string;
  logoUrl?: string;
};

// Sistema de personalização ABSOLUTA - VERSÃO CORRIGIDA
const usePersonalizacao = (advogadoData: AdvogadoData | null) => {
  if (!advogadoData) {
    return {
      isPersonalizado: false,
      temFoto: false,
      temLogo: false,
      cssVars: {},
      cores: {
        // PADRÃO OFICIAL - CORES SÓLIDAS
        background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #2a2a2a 100%)',
        headerBg: '#141414',
        cardBg: '#141414',
        cardInternoBg: '#282828',
        inputBg: '#282828',
        primary: '#b0825a',
        primaryHover: '#8b6942',
        primaryLight: 'rgba(176, 130, 90, 0.3)',
        primaryShadow: '0 10px 25px rgba(176, 130, 90, 0.3)',
        border: 'rgba(176, 130, 90, 0.2)',
        orb: '#b0825a'
      }
    };
  }

  const isPersonalizado = !!(advogadoData.corPrimaria && advogadoData.corSecundaria && advogadoData.corTerciaria);
  const temFoto = !!advogadoData.fotoPerfilUrl;
  const temLogo = !!advogadoData.logoUrl;
  
  // MAPEAMENTO CORRIGIDO - SEM TRANSPARÊNCIAS PROBLEMÁTICAS
  const cores = isPersonalizado ? {
    // PERSONALIZADO: corPrimaria = background, corSecundaria = cards, corTerciaria = detalhes
    background: `linear-gradient(135deg, ${advogadoData.corPrimaria} 0%, ${advogadoData.corPrimaria}f0 50%, ${advogadoData.corPrimaria}e0 100%)`,
    headerBg: advogadoData.corPrimaria, // Cor sólida
    cardBg: advogadoData.corSecundaria, // Cor sólida
    cardInternoBg: `${advogadoData.corSecundaria}e0`, // Levemente transparente apenas para cards internos
    inputBg: `${advogadoData.corSecundaria}f0`, // Quase sólido para inputs
    primary: advogadoData.corTerciaria,
    primaryHover: `${advogadoData.corTerciaria}dd`,
    primaryLight: `${advogadoData.corTerciaria}40`,
    primaryShadow: `0 10px 25px ${advogadoData.corTerciaria}40`,
    border: `${advogadoData.corTerciaria}40`,
    orb: advogadoData.corTerciaria
  } : {
    // PADRÃO OFICIAL - MANTIDO EXATAMENTE IGUAL
    background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #2a2a2a 100%)',
    headerBg: '#141414',
    cardBg: '#141414',
    cardInternoBg: '#282828',
    inputBg: '#282828',
    primary: '#b0825a',
    primaryHover: '#8b6942',
    primaryLight: 'rgba(176, 130, 90, 0.3)',
    primaryShadow: '0 10px 25px rgba(176, 130, 90, 0.3)',
    border: 'rgba(176, 130, 90, 0.2)',
    orb: '#b0825a'
  };

  // CSS VARIABLES PARA GARANTIR APLICAÇÃO
  const cssVars = isPersonalizado ? {
    '--cor-primaria': advogadoData.corPrimaria,
    '--cor-secundaria': advogadoData.corSecundaria, 
    '--cor-terciaria': advogadoData.corTerciaria,
    '--cor-primaria-hover': `${advogadoData.corPrimaria}dd`,
    '--cor-secundaria-hover': `${advogadoData.corSecundaria}dd`,
    '--cor-terciaria-hover': `${advogadoData.corTerciaria}dd`,
    '--cor-primaria-light': `${advogadoData.corPrimaria}40`,
    '--cor-secundaria-light': `${advogadoData.corSecundaria}40`,
    '--cor-terciaria-light': `${advogadoData.corTerciaria}40`,
    // GARANTIA DE BACKGROUND
    '--bg-main': advogadoData.corPrimaria,
    '--bg-card': advogadoData.corSecundaria,
    '--bg-element': `${advogadoData.corSecundaria}e0`
  } : {
    // PADRÃO OFICIAL
    '--bg-main': '#1a1a1a',
    '--bg-card': '#141414',
    '--bg-element': '#282828'
  };
  
  return { isPersonalizado, temFoto, temLogo, cssVars, cores };
};

export default function AdvogadoPublicPage() {
  const params = useParams();
  const advogadoSlug = params?.advogado as string;
  
  const [advogadoData, setAdvogadoData] = useState<AdvogadoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  //eslint-disable-next-line
  const { isPersonalizado, temFoto, temLogo, cssVars, cores } = usePersonalizacao(advogadoData);
  
  // Estados do formulário inicial
  const [formularioEnviado, setFormularioEnviado] = useState(false);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [motivo, setMotivo] = useState('');
  
  // Estados do chat
  const [conversaIA, setConversaIA] = useState<MessageSaaS[]>([]);
  const [mensagemAtual, setMensagemAtual] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [mostrarOpcoesAcao, setMostrarOpcoesAcao] = useState(false);
  const [solicitacaoAgendamento, setSolicitacaoAgendamento] = useState(false);
  const chatAreaRef = useRef<HTMLDivElement>(null);

  // Buscar dados do advogado no Firebase
  useEffect(() => {
    const fetchAdvogadoData = async () => {
      if (!advogadoSlug) {
        setError('Slug do advogado não encontrado');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const q = query(
          collection(db, 'advogados'), 
          where('slug', '==', advogadoSlug)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          setError('Advogado não encontrado');
        } else {
          const doc = querySnapshot.docs[0];
          const data = {
            id: doc.id,
            ...doc.data()
          } as AdvogadoData;
          
          setAdvogadoData(data);
        }
      } catch (error) {
        console.error('Erro ao buscar advogado:', error);
        setError('Erro ao carregar dados do advogado');
      } finally {
        setLoading(false);
      }
    };

    fetchAdvogadoData();
  }, [advogadoSlug]);

  // Auto-scroll do chat
  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [conversaIA]);

  // Submissão do formulário inicial
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!advogadoData) return;
    
    setCarregando(true);

    try {
      const newLeadData: Omit<LeadSaaS, 'id' | 'dataRegistro' | 'dataUltimaInteracao' | 'statusAtendimento' | 'historico'> = { 
        nome, 
        telefone, 
        motivo,
        advogadoId: advogadoData.id,
        advogadoSlug: advogadoData.slug,
        advogadoNome: advogadoData.nome
      };
      
      const newLeadId = await createLeadSaaS(newLeadData);
      setLeadId(newLeadId);
      
      const respostaInicialIA = await gerarRespostaIA(motivo, true);
      
      const aiMessage: MessageSaaS = { 
        tipo: 'ai', 
        mensagem: respostaInicialIA, 
        timestamp: new Date().toISOString() 
      };
      setConversaIA([aiMessage]);
      await addMensagemHistoricoSaaS(newLeadId, 'ai', respostaInicialIA);

      setFormularioEnviado(true);
      setMostrarOpcoesAcao(true);

    } catch (error) {
      console.error('Erro ao processar formulário:', error);
      const errorMessage: MessageSaaS = { 
        tipo: 'ai', 
        mensagem: 'Desculpe, houve um erro técnico ao iniciar o atendimento. Nossa equipe entrará em contato em breve.', 
        timestamp: new Date().toISOString() 
      };
      setConversaIA([errorMessage]);
      setFormularioEnviado(true);
    } finally {
      setCarregando(false);
    }
  };

  // Função para gerar resposta da IA
  const gerarRespostaIA = async (pergunta: string, isInicial: boolean = false): Promise<string> => {
    try {
      const response = await fetch('/api/advogado-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mensagem: pergunta,
          advogadoSlug: advogadoSlug,
          clienteNome: nome,
          clienteTelefone: telefone,
          isInicial: isInicial
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.resposta || 'Desculpe, não consegui processar sua solicitação.';
    } catch (error) {
      console.error('Erro ao gerar resposta da IA:', error);
      return `Desculpe, houve um erro. Entre em contato diretamente pelo ${advogadoData?.contato}.`;
    }
  };

  // Enviar mensagem normal
  const enviarMensagem = async () => {
    if (!mensagemAtual.trim() || !leadId) return;

    const novaMensagem = mensagemAtual;
    setMensagemAtual('');
    setCarregando(true);
    setMostrarOpcoesAcao(false);

    const userMessage: MessageSaaS = { 
      tipo: 'user', 
      mensagem: novaMensagem, 
      timestamp: new Date().toISOString() 
    };
    setConversaIA(prev => [...prev, userMessage]);
    await addMensagemHistoricoSaaS(leadId, 'user', novaMensagem);

    try {
      const respostaIA = await gerarRespostaIA(novaMensagem);
      
      const aiMessage: MessageSaaS = { 
        tipo: 'ai', 
        mensagem: respostaIA, 
        timestamp: new Date().toISOString() 
      };
      setConversaIA(prev => [...prev, aiMessage]);
      await addMensagemHistoricoSaaS(leadId, 'ai', respostaIA);

      if (!solicitacaoAgendamento) {
        setMostrarOpcoesAcao(true); 
      }

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      const errorMessage: MessageSaaS = { 
        tipo: 'ai', 
        mensagem: 'Desculpe, houve um erro. Tente novamente.', 
        timestamp: new Date().toISOString() 
      };
      setConversaIA(prev => [...prev, errorMessage]);
      await addMensagemHistoricoSaaS(leadId, 'ai', errorMessage.mensagem);
    } finally {
      setCarregando(false);
    }
  };

  // Opções de ação (Agendamento ou Contato)
  const handleOpcaoAcao = async (tipo: 'agendamento' | 'contato_advogado') => {
    if (!leadId) return;
    setCarregando(true);
    setMostrarOpcoesAcao(false);

    let userActionMessage = '';
    let aiResponseMessage = '';
    let leadUpdates: Partial<LeadSaaS> = {};

    if (tipo === 'agendamento') {
      userActionMessage = 'Gostaria de agendar uma consulta.';
      aiResponseMessage = `Ótimo! Para agendarmos sua consulta com ${advogadoData?.nome}, qual a data e o período (manhã/tarde/noite) de sua preferência? Por exemplo: "Amanhã à tarde" ou "Dia 20/08 de manhã".`;
      setSolicitacaoAgendamento(true);
      leadUpdates = { tipoSolicitacaoCliente: 'agendamento', statusAtendimento: 'contatado' };
    } else {
      userActionMessage = `Prefiro falar diretamente com ${advogadoData?.nome}.`;
      aiResponseMessage = `Entendido! Encaminhei seus dados para ${advogadoData?.nome}. Em breve ele entrará em contato com você via telefone ou WhatsApp para prosseguir com seu atendimento. Agradecemos seu interesse!`;
      leadUpdates = { tipoSolicitacaoCliente: 'contato_advogado', statusAtendimento: 'contatado' };
    }

    const userMsg: MessageSaaS = { tipo: 'user', mensagem: userActionMessage, timestamp: new Date().toISOString() };
    const aiMsg: MessageSaaS = { tipo: 'ai', mensagem: aiResponseMessage, timestamp: new Date().toISOString() };
    setConversaIA(prev => [...prev, userMsg, aiMsg]);
    
    await addMensagemHistoricoSaaS(leadId, 'user', userActionMessage);
    await addMensagemHistoricoSaaS(leadId, 'ai', aiResponseMessage);
    await updateLeadSaaS(leadId, leadUpdates);

    setCarregando(false);
  };

  // Confirmação de agendamento
  const handleAgendamentoConfirmado = async () => {
    if (!mensagemAtual.trim() || !leadId) return;

    const dataHoraPreferencial = mensagemAtual;
    setMensagemAtual('');
    setCarregando(true);
    setSolicitacaoAgendamento(false);

    const userConfirmationMessage = `Minha preferência é: ${dataHoraPreferencial}.`;
    const aiFinalMessage = `Confirmado! Sua preferência de agendamento para "${dataHoraPreferencial}" foi registrada. ${advogadoData?.nome} entrará em contato em breve para confirmar os detalhes e formalizar sua consulta. Agradecemos seu interesse!`;

    const userMsg: MessageSaaS = { tipo: 'user', mensagem: userConfirmationMessage, timestamp: new Date().toISOString() };
    const aiMsg: MessageSaaS = { tipo: 'ai', mensagem: aiFinalMessage, timestamp: new Date().toISOString() };
    setConversaIA(prev => [...prev, userMsg, aiMsg]);

    await addMensagemHistoricoSaaS(leadId, 'user', userConfirmationMessage);
    await addMensagemHistoricoSaaS(leadId, 'ai', aiFinalMessage);
    
    await updateLeadSaaS(leadId, {
      preferenciaAgendamentoCliente: dataHoraPreferencial,
      tipoSolicitacaoCliente: 'agendamento',
      statusAtendimento: 'contatado'
    });

    setCarregando(false);
  };

  // Loading state - CORRIGIDO
  if (loading) {
    return (
      <div 
        className="min-h-screen relative overflow-hidden"
        style={{
          ...cssVars,
          // GARANTIA: Background sempre aplicado
          background: cores.background
        } as React.CSSProperties}
      >
        <div 
          className="absolute top-20 left-20 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"
          style={{ backgroundColor: cores.orb }}
        />
        <div 
          className="absolute bottom-20 right-20 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"
          style={{ backgroundColor: cores.orb }}
        />
        
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div 
              className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-6"
              style={{
                borderColor: cores.primary,
                borderTopColor: 'transparent'
              }}
            />
            <h2 className="text-xl font-semibold text-white mb-2">Carregando...</h2>
            <p className="text-[#d4d4d4]">Preparando seu atendimento</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state - CORRIGIDO
  if (error || !advogadoData) {
    return (
      <div 
        className="min-h-screen relative overflow-hidden"
        style={{
          ...cssVars,
          // GARANTIA: Background sempre aplicado
          background: cores.background
        } as React.CSSProperties}
      >
        <div 
          className="absolute top-20 right-20 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl opacity-20"
          style={{ backgroundColor: cores.orb }}
        />
        
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="w-16 h-16 bg-red-500/20 border-2 border-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl text-red-500">✕</span>
            </div>
            <h1 className="text-2xl font-semibold text-white mb-4">Advogado não encontrado</h1>
            <p className="text-[#d4d4d4] mb-8">
              {error || 'Verifique o link e tente novamente.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // COMPONENTE PRINCIPAL - CORRIGIDO
  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{
        ...cssVars,
        // GARANTIA: Background SEMPRE aplicado corretamente
        background: cores.background
      } as React.CSSProperties}
    >
      {/* Elementos decorativos - Background Orbs */}
      <div 
        className="absolute top-20 left-20 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"
        style={{ backgroundColor: cores.orb }}
      />
      <div 
        className="absolute bottom-20 right-20 w-72 h-72 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"
        style={{ backgroundColor: cores.orb }}
      />

      {/* Header - CORRIGIDO: backgroundColor sempre aplicada */}
      <div 
        className="relative z-10 px-4 sm:px-6 lg:px-8 py-4 border-b backdrop-blur-sm"
        style={{ 
          backgroundColor: cores.headerBg, // Garantia de cor sólida
          borderColor: cores.border
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-6">
            
            {/* ESQUERDA: Informações do usuário - VAZIO para simetria */}
            <div className="order-2 lg:order-1 lg:flex-1 justify-start">
              {/* Mantido vazio para simetria visual */}
            </div>

            {/* CENTRO: Logo IAJURIS - CORRIGIDO: Agora realmente centralizada */}
            <div className="flex items-center justify-center order-1 lg:order-2 lg:flex-1">
              <Scale 
                className="w-6 h-6 mr-2" 
                style={{ color: cores.primary, opacity: 0.7, fontSize: '1.4rem' }} 
              />
              <h1 
                className="text-xl sm:text-2xl md:text-3xl font-bold text-shadow-lg"
                style={{ color: cores.primary }}
              >
                IAJURIS
              </h1>
              <Gavel 
                className="w-6 h-6 ml-2" 
                style={{ color: cores.primary, opacity: 0.7, fontSize: '1.2rem' }} 
              />
            </div>

            {/* DIREITA: Nome do profissional */}
            <div className="order-3 lg:order-3 lg:flex-1 flex justify-end">
              <div 
                className="flex items-center gap-2 sm:gap-3 px-3 py-2 sm:px-4 sm:py-3 rounded-xl border"
                style={{ 
                  backgroundColor: cores.cardInternoBg,
                  borderColor: cores.border
                }}
              >
                <div 
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: cores.primary }}
                >
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
                </div>
                <div className="text-xs sm:text-sm">
                  <p className="text-white font-semibold">{advogadoData.nome}</p>
                  <p className="text-[#d4d4d4] text-xs">{advogadoData.especialidades[0] || 'Advocacia'}</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Container Principal */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {!formularioEnviado ? (
          /* SEÇÃO DE CAPTURA - LAYOUT EM COLUNA ÚNICA */
          <div className="space-y-8">
            
            {/* Card de Informações do Advogado - CORRIGIDO */}
            <div 
              className="rounded-2xl p-6 sm:p-8 shadow-2xl transition-all duration-300 border backdrop-filter backdrop-blur-8px"
              style={{ 
                backgroundColor: cores.cardBg, // COR SÓLIDA para cards
                borderColor: cores.border,
                backdropFilter: 'blur(8px)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
              }}
            >
              {/* Header do Perfil */}
              <div className="text-center mb-8">
                {temFoto ? (//eslint-disable-next-line
                  <img 
                    src={advogadoData.fotoPerfilUrl} 
                    alt={advogadoData.nome}
                    className="w-48 h-48 sm:w-32 sm:h-32 rounded-2xl object-cover mx-auto mb-4 border-2 shadow-lg"
                    style={{
                      borderColor: cores.primary
                    }}
                  />
                ) : (
                  <div 
                    className="w-48 h-48 sm:w-32 sm:h-32 rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 shadow-lg"
                    style={{
                      backgroundColor: cores.primary,
                      borderColor: cores.primary
                    }}
                  >
                    <User className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
                  </div>
                )}
                
                <h3 
                  className="text-2xl sm:text-3xl font-bold mb-2"
                  style={{ color: cores.primary }}
                >
                  {advogadoData.nome}
                </h3>

                {/* Biografia - Logo abaixo do nome */}
                {advogadoData.biografia && (
                  <div className="mb-6">
                    <p className="text-gray-300 leading-relaxed text-sm sm:text-base max-w-2xl mx-auto">
                      {advogadoData.biografia}
                    </p>
                  </div>
                )}
                
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  {advogadoData.especialidades.map((esp, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 rounded-full text-xs sm:text-sm font-medium text-white shadow-sm"
                      style={{
                        backgroundColor: cores.primary
                      }}
                    >
                      {esp}
                    </span>
                  ))}
                </div>
              </div>

              {/* Informações em Grid - Mais compacto */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div 
                  className="flex items-center gap-3 p-3 sm:p-4 rounded-xl"
                  style={{ backgroundColor: cores.cardInternoBg }}
                >
                  <MapPin 
                    className="w-4 h-4 sm:w-5 sm:h-5" 
                    style={{ color: cores.primary }} 
                  />
                  <div>
                    <p className="font-medium text-white text-sm">Localização</p>
                    <p className="text-xs text-[#d4d4d4]">{advogadoData.cidade}</p>
                  </div>
                </div>
                
                <div 
                  className="flex items-center gap-3 p-3 sm:p-4 rounded-xl"
                  style={{ backgroundColor: cores.cardInternoBg }}
                >
                  <Award 
                    className="w-4 h-4 sm:w-5 sm:h-5" 
                    style={{ color: cores.primary }} 
                  />
                  <div>
                    <p className="font-medium text-white text-sm">Experiência</p>
                    <p className="text-xs text-[#d4d4d4]">{advogadoData.experiencia}</p>
                  </div>
                </div>
                
                <div 
                  className="flex items-center gap-3 p-3 sm:p-4 rounded-xl sm:col-span-1 col-span-full"
                  style={{ backgroundColor: cores.cardInternoBg }}
                >
                  <Phone 
                    className="w-4 h-4 sm:w-5 sm:h-5" 
                    style={{ color: cores.primary }} 
                  />
                  <div>
                    <p className="font-medium text-white text-sm">Contato</p>
                    <p className="text-xs text-[#d4d4d4]">{advogadoData.contato}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card do Formulário - CORRIGIDO */}
            <div 
              className="rounded-2xl p-6 sm:p-8 shadow-2xl transition-all duration-300 border backdrop-filter backdrop-blur-8px"
              style={{ 
                backgroundColor: cores.cardBg, // COR SÓLIDA para cards
                borderColor: cores.border,
                backdropFilter: 'blur(8px)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
              }}
            >
              {/* Header do Formulário */}
              <div className="text-center mb-8">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md"
                  style={{
                    backgroundColor: cores.primary
                  }}
                >
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                  Consulta Jurídica
                </h2>
                <p className="text-[#d4d4d4] text-base sm:text-lg">
                  Inicie sua conversa com {advogadoData.nome}
                </p>
              </div>

              {/* Formulário */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label 
                    htmlFor="nome" 
                    className="block text-sm font-semibold mb-3 text-white"
                  >
                    Nome Completo
                  </label>
                  <input
                    id="nome"
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Digite seu nome completo"
                    required
                    className="w-full p-4 rounded-xl border text-white placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300"
                    style={{
                      backgroundColor: cores.inputBg,
                      borderColor: cores.border,
                      '--tw-ring-color': cores.primary
                    } as React.CSSProperties}
                  />
                </div>

                <div>
                  <label 
                    htmlFor="telefone" 
                    className="block text-sm font-semibold mb-3 text-white"
                  >
                    Telefone/WhatsApp
                  </label>
                  <input
                    id="telefone"
                    type="tel"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="(XX) XXXXX-XXXX"
                    required
                    className="w-full p-4 rounded-xl border text-white placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300"
                    style={{
                      backgroundColor: cores.inputBg,
                      borderColor: cores.border,
                      '--tw-ring-color': cores.primary
                    } as React.CSSProperties}
                  />
                </div>

                <div>
                  <label 
                    htmlFor="motivo" 
                    className="block text-sm font-semibold mb-3 text-white"
                  >
                    Descreva sua Situação Jurídica
                  </label>
                  <textarea
                    id="motivo"
                    rows={4}
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    required
                    placeholder="Descreva detalhadamente sua dúvida ou situação jurídica..."
                    className="w-full p-4 rounded-xl border text-white placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:border-transparent resize-none transition-all duration-300"
                    style={{
                      backgroundColor: cores.inputBg,
                      borderColor: cores.border,
                      '--tw-ring-color': cores.primary
                    } as React.CSSProperties}
                  />
                </div>

                <button
                  type="submit"
                  disabled={carregando}
                  className="w-full py-4 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  style={{
                    backgroundColor: cores.primary,
                    boxShadow: cores.primaryShadow
                  }}
                >
                  {carregando ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      Iniciando conversa...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <MessageCircle className="w-5 h-5" />
                      Conversar com {advogadoData.nome}
                    </div>
                  )}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* SEÇÃO DE CHAT - CORRIGIDA */
          <div className="space-y-6">
            
            {/* Container do Chat - CORRIGIDO */}
            <div 
              className="rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 border backdrop-filter backdrop-blur-8px"
              style={{ 
                backgroundColor: cores.cardBg, // COR SÓLIDA
                borderColor: cores.border,
                backdropFilter: 'blur(8px)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
              }}
            >
              
              {/* Header do Chat */}
              <div 
                className="p-6 border-b"
                style={{ borderColor: cores.border }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
                      style={{
                        backgroundColor: cores.primary
                      }}
                    >
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        Conversa com {advogadoData.nome}
                      </h2>
                      <p className="text-[#d4d4d4] text-sm flex items-center gap-2">
                        <CheckCircle2 
                          className="w-4 h-4" 
                          style={{ color: cores.primary }} 
                        />
                        Olá, {nome}! Como posso ajudá-lo?
                      </p>
                    </div>
                  </div>
                  
                  {/* Status Indicator */}
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-[#d4d4d4]">Online</span>
                  </div>
                </div>
              </div>

              {/* Área de Mensagens */}
              <div 
                ref={chatAreaRef} 
                className="h-96 p-6 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent"
              >
                {conversaIA.map((msg, index) => (
                  <div key={index} className={`flex ${msg.tipo === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className="flex items-end gap-3 max-w-[85%]">
                      {msg.tipo === 'ai' && (
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: cores.primary
                          }}
                        >
                          <span className="text-xs font-bold text-white">AI</span>
                        </div>
                      )}
                      
                      <div 
                        className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                          msg.tipo === 'user' 
                            ? 'text-white rounded-br-sm' 
                            : 'text-white border rounded-bl-sm'
                        }`}
                        style={msg.tipo === 'user' ? {
                          backgroundColor: cores.primary
                        } : {
                          backgroundColor: cores.cardInternoBg,
                          borderColor: cores.border
                        }}
                      >
                        <p className="whitespace-pre-wrap">{msg.mensagem}</p>
                        <div className="text-xs opacity-70 mt-2">
                          {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                      
                      {msg.tipo === 'user' && (
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: cores.primary
                          }}
                        >
                          <User className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {carregando && (
                  <div className="flex justify-start">
                    <div className="flex items-end gap-3">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{
                          backgroundColor: cores.primary
                        }}
                      >
                        <span className="text-xs font-bold text-white">AI</span>
                      </div>
                      <div 
                        className="px-4 py-3 rounded-2xl border"
                        style={{ 
                          backgroundColor: cores.cardInternoBg,
                          borderColor: cores.border
                        }}
                      >
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div 
                              className="w-2 h-2 rounded-full animate-bounce"
                              style={{ backgroundColor: cores.primary }}
                            />
                            <div 
                              className="w-2 h-2 rounded-full animate-bounce delay-100"
                              style={{ backgroundColor: cores.primary }}
                            />
                            <div 
                              className="w-2 h-2 rounded-full animate-bounce delay-200"
                              style={{ backgroundColor: cores.primary }}
                            />
                          </div>
                          <span className="text-xs text-[#d4d4d4]">Analisando...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Área de Input */}
              <div 
                className="border-t p-6"
                style={{ borderColor: cores.border }}
              >
                {mostrarOpcoesAcao && !solicitacaoAgendamento && !carregando ? (
                  /* Opções de Ação */
                  <div className="space-y-4">
                    <p className="text-sm text-[#d4d4d4] text-center">
                      Como gostaria de prosseguir?
                    </p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <button
                        onClick={() => handleOpcaoAcao('agendamento')}
                        className="flex items-center justify-center gap-3 px-6 py-4 text-white rounded-xl font-medium transition-all duration-300 hover:scale-[1.02] shadow-md"
                        style={{
                          backgroundColor: cores.primary
                        }}
                      >
                        <Calendar className="w-5 h-5" />
                        Agendar Consulta
                      </button>
                      <button
                        onClick={() => handleOpcaoAcao('contato_advogado')}
                        className="flex items-center justify-center gap-3 px-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-all duration-300 hover:scale-[1.02] shadow-md"
                      >
                        <Phone className="w-5 h-5" />
                        Falar Direto
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Input de Mensagem */
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={mensagemAtual}
                      onChange={(e) => setMensagemAtual(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !carregando) {
                          if (solicitacaoAgendamento) {
                            handleAgendamentoConfirmado();
                          } else {
                            enviarMensagem();
                          }
                        }
                      }}
                      placeholder={
                        solicitacaoAgendamento 
                          ? "Ex: Amanhã à tarde, Dia 20/08 de manhã..." 
                          : "Digite sua mensagem..."
                      }
                      className="flex-1 p-4 rounded-xl border text-white placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300"
                      style={{
                        backgroundColor: cores.inputBg,
                        borderColor: cores.border,
                        '--tw-ring-color': cores.primary
                      } as React.CSSProperties}
                      disabled={carregando}
                    />
                    <button
                      onClick={solicitacaoAgendamento ? handleAgendamentoConfirmado : enviarMensagem}
                      disabled={carregando || !mensagemAtual.trim()}
                      className="px-6 py-4 rounded-xl font-medium text-white transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 shadow-md"
                      style={{
                        backgroundColor: cores.primary
                      }}
                    >
                      {carregando ? (
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Call-to-Action do WhatsApp - CORRIGIDO */}
            <div 
              className="rounded-2xl p-6 text-center shadow-2xl transition-all duration-300 border backdrop-filter backdrop-blur-8px"
              style={{ 
                backgroundColor: cores.cardBg, // COR SÓLIDA
                borderColor: cores.border,
                backdropFilter: 'blur(8px)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
              }}
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <Clock 
                  className="w-5 h-5" 
                  style={{ color: cores.primary }} 
                />
                <h3 className="text-lg font-semibold text-white">
                  Precisa de um atendimento mais rápido?
                </h3>
              </div>
              <p className="text-[#d4d4d4] mb-6">
                Fale diretamente com {advogadoData.nome} via WhatsApp para um atendimento personalizado e imediato.
              </p>
              <a 
                href={`https://wa.me/${advogadoData.contato.replace(/\D/g, '')}?text=Olá ${advogadoData.nome}, vim através do seu site e gostaria de conversar sobre minha situação jurídica.`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-[1.02] shadow-lg"
              >
                <Phone className="w-5 h-5" />
                WhatsApp {advogadoData.contato}
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Footer - CORRIGIDO */}
      <footer className="relative z-10 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div 
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium backdrop-blur-sm border"
              style={{ 
                backgroundColor: cores.cardBg, // COR SÓLIDA
                borderColor: cores.border
              }}
            >
              <Sparkles 
                className="w-4 h-4" 
                style={{ color: cores.primary }} 
              />
              <span className="text-[#d4d4d4]">Powered by</span>
              <span 
                className="font-bold"
                style={{ color: cores.primary }}
              >
                IAJuris SaaS
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
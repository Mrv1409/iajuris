'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Link } from 'lucide-react';
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

// 🎨 SISTEMA LIMPO DE CORES PERSONALIZADA
const usePersonalizacao = (advogadoData: AdvogadoData | null) => {
  if (!advogadoData) {
    return {
      isPersonalizado: false,
      temFoto: false,
      temLogo: false,
      cssVars: {}
    };
  }

  const isPersonalizado = !!(advogadoData.corPrimaria || advogadoData.corSecundaria || advogadoData.corTerciaria);
  const temFoto = !!advogadoData.fotoPerfilUrl;
  const temLogo = !!advogadoData.logoUrl;
  
  // 🚀 CSS Custom Properties - Sistema Limpo
  const cssVars = isPersonalizado ? {
    '--cor-primaria': advogadoData.corPrimaria || '#b0825a',
    '--cor-secundaria': advogadoData.corSecundaria || '#8b6942', 
    '--cor-terciaria': advogadoData.corTerciaria || '#d4af37',
    
    // Variações automáticas para efeitos
    '--cor-primaria-hover': `${advogadoData.corPrimaria || '#b0825a'}dd`,
    '--cor-primaria-light': `${advogadoData.corPrimaria || '#b0825a'}40`,
    '--cor-secundaria-light': `${advogadoData.corSecundaria || '#8b6942'}60`,
    '--cor-terciaria-light': `${advogadoData.corTerciaria || '#d4af37'}80`,
    
    // Gradientes limpos
    '--gradiente-fundo': `linear-gradient(135deg, ${advogadoData.corPrimaria || '#b0825a'} 0%, #000000 50%, ${advogadoData.corSecundaria || '#8b6942'} 100%)`,
    '--gradiente-botao': `linear-gradient(135deg, ${advogadoData.corPrimaria || '#b0825a'}, ${advogadoData.corSecundaria || '#8b6942'})`,
    '--sombra-primaria': `0 10px 25px ${advogadoData.corPrimaria || '#b0825a'}40`,
    '--sombra-secundaria': `0 5px 15px ${advogadoData.corSecundaria || '#8b6942'}30`
  } : {};
  
  return { isPersonalizado, temFoto, temLogo, cssVars };
};

export default function AdvogadoPublicPage() {
  const params = useParams();
  const advogadoSlug = params?.advogado as string;
  
  const [advogadoData, setAdvogadoData] = useState<AdvogadoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  //eslint-disable-next-line
  const { isPersonalizado, temFoto, temLogo, cssVars } = usePersonalizacao(advogadoData);
  
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
      // Criar lead SaaS para este advogado
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
      
      // Gerar resposta inicial da IA
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
          contexto: isInicial ? { nome, telefone, motivo, advogadoNome: advogadoData?.nome } : null,
          historico: conversaIA,
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

  // Loading state
  if (loading) {
    return (
      <main 
        className={`min-h-screen relative overflow-hidden ${isPersonalizado ? 'personalizado' : 'padrao'}`}
        style={cssVars as React.CSSProperties}
      >
        {/* 🎨 Background Limpo - Padrão ou Personalizado */}
        <div 
          className="absolute inset-0"
          style={{
            background: isPersonalizado 
              ? 'var(--gradiente-fundo)'
              : 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #3a2a1a 100%)'
          }}
        />
        
        {/* 🌟 Elementos Decorativos Limpos */}
        {isPersonalizado ? (
          <>
            <div 
              className="absolute top-20 right-20 w-80 h-80 rounded-full filter blur-3xl opacity-30 animate-pulse"
              style={{ backgroundColor: 'var(--cor-secundaria)' }}
            />
            <div 
              className="absolute bottom-20 left-20 w-64 h-64 rounded-full filter blur-3xl opacity-20 animate-pulse animation-delay-2000"
              style={{ backgroundColor: 'var(--cor-primaria)' }}
            />
          </>
        ) : (
          <>
            <div className="absolute top-20 left-20 w-72 h-72 bg-amber-900/20 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
            <div className="absolute bottom-20 right-20 w-72 h-72 bg-amber-800/20 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000" />
          </>
        )}
        
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div 
              className="w-20 h-20 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-6"
              style={{
                borderColor: isPersonalizado ? 'var(--cor-primaria)' : '#b0825a',
                borderTopColor: 'transparent'
              }}
            />
            <h2 className="text-2xl font-bold text-white mb-2">Carregando...</h2>
            <p className="text-gray-300 text-lg">Buscando informações do advogado</p>
            <div 
              className="w-24 h-0.5 mx-auto mt-4 rounded-full"
              style={{
                background: isPersonalizado 
                  ? `linear-gradient(to right, transparent, var(--cor-primaria), transparent)`
                  : 'linear-gradient(to right, transparent, #b0825a, transparent)'
              }}
            />
          </div>
        </div>
      </main>
    );
  }

  // Error state
  if (error || !advogadoData) {
    return (
      <main 
        className={`min-h-screen relative overflow-hidden ${isPersonalizado ? 'personalizado' : 'padrao'}`}
        style={cssVars as React.CSSProperties}
      >
        <div 
          className="absolute inset-0"
          style={{
            background: isPersonalizado 
              ? 'var(--gradiente-fundo)'
              : 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #3a2a1a 100%)'
          }}
        />
        
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="w-20 h-20 bg-red-500/20 border-2 border-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">❌</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Advogado não encontrado</h1>
            <p className="text-gray-300 mb-2">
              Não foi possível encontrar o advogado <span 
                className="font-semibold"
                style={{ color: isPersonalizado ? 'var(--cor-terciaria)' : '#b0825a' }}
              >/{advogadoSlug}</span>
            </p>
            <p className="text-gray-400 text-sm mb-8">
              {error || 'Verifique o link e tente novamente.'}
            </p>
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-xl"
              style={{
                background: isPersonalizado 
                  ? 'var(--gradiente-botao)'
                  : 'linear-gradient(135deg, #b0825a, #8b6942)',
                boxShadow: isPersonalizado ? 'var(--sombra-primaria)' : '0 10px 25px rgba(176, 130, 90, 0.4)'
              }}
            >
              <span>🏠</span>
              Voltar ao Início
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main 
      className={`min-h-screen relative overflow-hidden ${isPersonalizado ? 'personalizado' : 'padrao'}`}
      style={cssVars as React.CSSProperties}
    >
      {/* 🎨 Background Principal - Sistema Limpo */}
      <div 
        className="absolute inset-0"
        style={{
          background: isPersonalizado 
            ? 'var(--gradiente-fundo)'
            : 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #3a2a1a 100%)'
        }}
      />
      
      {/* 🌟 Elementos Decorativos - Limpos e Elegantes */}
      {isPersonalizado ? (
        <>
          <div 
            className="absolute top-20 right-20 w-80 h-80 rounded-full filter blur-3xl opacity-30 animate-pulse"
            style={{ backgroundColor: 'var(--cor-secundaria)' }}
          />
          <div 
            className="absolute bottom-20 left-20 w-64 h-64 rounded-full filter blur-3xl opacity-20 animate-pulse animation-delay-2000"
            style={{ backgroundColor: 'var(--cor-primaria)' }}
          />
          <div 
            className="absolute top-1/2 left-1/2 w-48 h-48 rounded-full filter blur-2xl opacity-15 animate-pulse animation-delay-4000 transform -translate-x-1/2 -translate-y-1/2"
            style={{ backgroundColor: 'var(--cor-terciaria)' }}
          />
        </>
      ) : (
        <>
          <div className="absolute top-20 left-20 w-72 h-72 bg-amber-900/20 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
          <div className="absolute bottom-20 right-20 w-72 h-72 bg-amber-800/20 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000" />
        </>
      )}

      {/* Header com informações do advogado */}
      <div 
        className="relative z-10 px-4 sm:px-6 lg:px-8 py-8 border-b backdrop-blur-sm"
        style={{
          backgroundColor: isPersonalizado ? 'var(--cor-primaria-light)' : 'rgba(20, 20, 20, 0.6)',
          borderColor: isPersonalizado ? 'var(--cor-secundaria-light)' : 'rgba(110, 109, 107, 0.2)'
        }}
      >
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            {/* Foto personalizada ou ícone padrão */}
            {temFoto ? (//eslint-disable-next-line
              <img 
                src={advogadoData.fotoPerfilUrl} 
                alt={advogadoData.nome}
                className="w-20 h-20 rounded-full object-cover border-2"
                style={{
                  borderColor: isPersonalizado ? 'var(--cor-terciaria)' : '#b0825a',
                  boxShadow: isPersonalizado ? 'var(--sombra-secundaria)' : '0 8px 25px rgba(176, 130, 90, 0.4)'
                }}
              />
            ) : (
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center border-2"
                style={{
                  background: isPersonalizado 
                    ? 'var(--gradiente-botao)'
                    : 'linear-gradient(135deg, #b0825a, #8b6942, #6d532a)',
                  borderColor: isPersonalizado ? 'var(--cor-terciaria)' : '#b0825a',
                  boxShadow: isPersonalizado ? 'var(--sombra-primaria)' : '0 8px 25px rgba(176, 130, 90, 0.4)'
                }}
              >
                <span className="text-3xl">👨‍💼</span>
              </div>
            )}
            <div className="text-left">
              <h1 
                className="text-4xl md:text-5xl font-bold drop-shadow-lg"
                style={{
                  color: isPersonalizado ? 'var(--cor-terciaria)' : '#b0825a',
                  textShadow: isPersonalizado 
                    ? '0 2px 8px var(--cor-terciaria-light)'
                    : '0 2px 8px rgba(176, 130, 90, 0.4)'
                }}
              >
                {advogadoData.nome}
              </h1>
              <p className="text-xl text-gray-200 mt-2 drop-shadow">
                {advogadoData.especialidades.join(" • ")}
              </p>
            </div>
          </div>
          
          {/* Linha decorativa */}
          <div 
            className="w-32 h-1 mx-auto mb-6 rounded-full"
            style={{
              background: isPersonalizado 
                ? `linear-gradient(to right, transparent, var(--cor-primaria), var(--cor-secundaria), transparent)`
                : 'linear-gradient(to right, transparent, #b0825a, #8b6942, transparent)',
              boxShadow: isPersonalizado ? 'var(--sombra-secundaria)' : '0 2px 8px rgba(176, 130, 90, 0.6)'
            }}
          />
          
          <div className="max-w-3xl mx-auto">
            <p className="text-lg text-gray-200 mb-6 leading-relaxed drop-shadow-sm">
              {advogadoData.biografia}
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <div 
                className="flex items-center gap-2 px-5 py-3 rounded-xl border backdrop-blur-sm transition-all duration-300 hover:scale-105"
                style={{
                  backgroundColor: isPersonalizado ? 'var(--cor-primaria-light)' : 'rgba(20, 20, 20, 0.6)',
                  borderColor: isPersonalizado ? 'var(--cor-secundaria-light)' : '#6e6d6b',
                  boxShadow: isPersonalizado ? 'var(--sombra-secundaria)' : '0 8px 32px rgba(0, 0, 0, 0.3)'
                }}
              >
                <span>📍</span>
                <span 
                  className="font-semibold"
                  style={{ color: isPersonalizado ? 'var(--cor-terciaria)' : '#b0825a' }}
                >
                  {advogadoData.cidade}
                </span>
              </div>
              <div 
                className="flex items-center gap-2 px-5 py-3 rounded-xl border backdrop-blur-sm transition-all duration-300 hover:scale-105"
                style={{
                  backgroundColor: isPersonalizado ? 'var(--cor-primaria-light)' : 'rgba(20, 20, 20, 0.6)',
                  borderColor: isPersonalizado ? 'var(--cor-secundaria-light)' : '#6e6d6b',
                  boxShadow: isPersonalizado ? 'var(--sombra-secundaria)' : '0 8px 32px rgba(0, 0, 0, 0.3)'
                }}
              >
                <span>⏱️</span>
                <span 
                  className="font-semibold"
                  style={{ color: isPersonalizado ? 'var(--cor-terciaria)' : '#b0825a' }}
                >
                  {advogadoData.experiencia} de experiência
                </span>
              </div>
              <div 
                className="flex items-center gap-2 px-5 py-3 rounded-xl border backdrop-blur-sm transition-all duration-300 hover:scale-105"
                style={{
                  backgroundColor: isPersonalizado ? 'var(--cor-primaria-light)' : 'rgba(20, 20, 20, 0.6)',
                  borderColor: isPersonalizado ? 'var(--cor-secundaria-light)' : '#6e6d6b',
                  boxShadow: isPersonalizado ? 'var(--sombra-secundaria)' : '0 8px 32px rgba(0, 0, 0, 0.3)'
                }}
              >
                <span>📱</span>
                <span 
                  className="font-semibold"
                  style={{ color: isPersonalizado ? 'var(--cor-terciaria)' : '#b0825a' }}
                >
                  {advogadoData.contato}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!formularioEnviado ? (
          /* FORMULÁRIO DE CAPTURA */
          <div className="max-w-2xl mx-auto">
            <div 
              className="rounded-2xl p-8 shadow-2xl transition-all duration-300 backdrop-blur-xl border-2"
              style={{
                backgroundColor: isPersonalizado ? 'var(--cor-primaria-light)' : 'rgba(40, 40, 40, 0.9)',
                borderColor: isPersonalizado ? 'var(--cor-secundaria)' : '#6e6d6b',
                boxShadow: isPersonalizado ? 'var(--sombra-primaria)' : '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}
            >
              <div className="text-center mb-8">
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border-2"
                  style={{
                    backgroundColor: isPersonalizado ? 'var(--cor-secundaria)' : '#b0825a',
                    borderColor: isPersonalizado ? 'var(--cor-terciaria)' : '#b0825a',
                    boxShadow: isPersonalizado ? 'var(--sombra-secundaria)' : '0 8px 25px rgba(176, 130, 90, 0.6)'
                  }}
                >
                  <span className="text-3xl">💬</span>
                </div>
                <h3 className="text-3xl font-bold text-white mb-3 drop-shadow-lg">
                  Converse com {advogadoData.nome}
                </h3>
                <p className="text-gray-200 text-lg">
                  Preencha os dados para iniciar seu atendimento especializado
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label 
                    htmlFor="nome" 
                    className="block text-sm font-semibold mb-3 drop-shadow"
                    style={{ color: isPersonalizado ? 'var(--cor-terciaria)' : '#b0825a' }}
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
                    className="w-full p-4 rounded-xl border text-white placeholder-gray-400 focus:outline-none focus:ring-2 transform transition-all duration-300 focus:scale-[1.02] backdrop-blur-sm"
                    style={{
                      backgroundColor: isPersonalizado ? 'var(--cor-primaria-light)' : 'rgba(40, 40, 40, 0.8)',
                      borderColor: isPersonalizado ? 'var(--cor-secundaria-light)' : '#6e6d6b',
                      '--tw-ring-color': isPersonalizado ? 'var(--cor-terciaria)' : '#b0825a',
                      boxShadow: isPersonalizado ? 'var(--sombra-secundaria)' : '0 4px 16px rgba(0, 0, 0, 0.3)'
                    } as React.CSSProperties}
                  />
                </div>

                <div>
                  <label 
                    htmlFor="telefone" 
                    className="block text-sm font-semibold mb-3 drop-shadow"
                    style={{ color: isPersonalizado ? 'var(--cor-terciaria)' : '#b0825a' }}
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
                    className="w-full p-4 rounded-xl border text-white placeholder-gray-400 focus:outline-none focus:ring-2 transform transition-all duration-300 focus:scale-[1.02] backdrop-blur-sm"
                    style={{
                      backgroundColor: isPersonalizado ? 'var(--cor-primaria-light)' : 'rgba(40, 40, 40, 0.8)',
                      borderColor: isPersonalizado ? 'var(--cor-secundaria-light)' : '#6e6d6b',
                      '--tw-ring-color': isPersonalizado ? 'var(--cor-terciaria)' : '#b0825a',
                      boxShadow: isPersonalizado ? 'var(--sombra-secundaria)' : '0 4px 16px rgba(0, 0, 0, 0.3)'
                    } as React.CSSProperties}
                  />
                </div>

                <div>
                  <label 
                    htmlFor="motivo" 
                    className="block text-sm font-semibold mb-3 drop-shadow"
                    style={{ color: isPersonalizado ? 'var(--cor-terciaria)' : '#b0825a' }}
                  >
                    Descreva sua Situação Jurídica
                  </label>
                  <textarea
                    id="motivo"
                    rows={4}
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    required
                    placeholder={`Descreva sua dúvida jurídica para ${advogadoData.nome}...`}
                    className="w-full p-4 rounded-xl border text-white placeholder-gray-400 focus:outline-none focus:ring-2 transform transition-all duration-300 resize-none focus:scale-[1.02] backdrop-blur-sm"
                    style={{
                      backgroundColor: isPersonalizado ? 'var(--cor-primaria-light)' : 'rgba(40, 40, 40, 0.8)',
                      borderColor: isPersonalizado ? 'var(--cor-secundaria-light)' : '#6e6d6b',
                      '--tw-ring-color': isPersonalizado ? 'var(--cor-terciaria)' : '#b0825a',
                      boxShadow: isPersonalizado ? 'var(--sombra-secundaria)' : '0 4px 16px rgba(0, 0, 0, 0.3)'
                    } as React.CSSProperties}
                  />
                </div>

                <button
                  type="submit"
                  disabled={carregando}
                  className="w-full py-4 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-105 hover:opacity-90 active:scale-95 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                  style={{
                    background: isPersonalizado ? 'var(--gradiente-botao)' : 'linear-gradient(135deg, #b0825a, #8b6942, #6d532a)',
                    boxShadow: isPersonalizado ? 'var(--sombra-primaria)' : '0 15px 35px rgba(176, 130, 90, 0.5)'
                  }}
                >
                  {carregando ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      Processando...
                    </div>
                  ) : (
                    `Iniciar Conversa com ${advogadoData.nome}`
                  )}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* INTERFACE DE CHAT */
          <div>
            {/* Saudação */}
            <div 
              className="rounded-2xl p-8 mb-8 text-center transition-all duration-300 backdrop-blur-xl border-2"
              style={{
                backgroundColor: isPersonalizado ? 'var(--cor-primaria-light)' : 'rgba(20, 20, 20, 0.8)',
                borderColor: isPersonalizado ? 'var(--cor-secundaria-light)' : '#6e6d6b',
                boxShadow: isPersonalizado ? 'var(--sombra-secundaria)' : '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center border-2"
                  style={{
                    backgroundColor: isPersonalizado ? 'var(--cor-secundaria)' : '#b0825a',
                    borderColor: isPersonalizado ? 'var(--cor-terciaria)' : '#b0825a',
                    boxShadow: isPersonalizado ? 'var(--sombra-secundaria)' : '0 8px 25px rgba(176, 130, 90, 0.6)'
                  }}
                >
                  <span className="text-2xl">👋</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
                  Olá, {nome}!
                </h2>
              </div>
              <p className="text-gray-200 text-lg drop-shadow">
                {advogadoData.nome} analisará sua situação e fornecerá orientações especializadas.
              </p>
            </div>

            {/* Chat Interface */}
            <div 
              className="rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 backdrop-blur-xl border-2"
              style={{
                backgroundColor: isPersonalizado ? 'var(--cor-primaria-light)' : 'rgba(40, 40, 40, 0.9)',
                borderColor: isPersonalizado ? 'var(--cor-secundaria)' : '#6e6d6b',
                boxShadow: isPersonalizado ? 'var(--sombra-primaria)' : '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}
            >
              {/* Área de Conversa */}
              <div 
                ref={chatAreaRef} 
                className="p-6 max-h-96 overflow-y-auto space-y-4"
                style={{
                  backgroundColor: isPersonalizado ? 'var(--cor-primaria-light)' : '#1a1a1a',
                  borderTop: isPersonalizado ? '1px solid var(--cor-secundaria-light)' : '1px solid rgba(110, 109, 107, 0.3)'
                }}
              >
                {conversaIA.map((msg, index) => (
                  <div key={index} className={`flex ${msg.tipo === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div 
                      className={`max-w-xs lg:max-w-md px-5 py-4 rounded-2xl shadow-lg text-white ${
                        msg.tipo === 'user' ? 'rounded-br-md' : 'rounded-bl-md border backdrop-blur-sm'
                      }`}
                      style={msg.tipo === 'user' ? {
                        background: isPersonalizado ? 'var(--gradiente-botao)' : 'linear-gradient(135deg, #b0825a, #8b6942, #6d532a)',
                        boxShadow: isPersonalizado ? 'var(--sombra-primaria)' : '0 8px 25px rgba(176, 130, 90, 0.4)'
                      } : {
                        backgroundColor: isPersonalizado ? 'var(--cor-primaria-light)' : 'rgba(20, 20, 20, 0.8)',
                        borderColor: isPersonalizado ? 'var(--cor-secundaria-light)' : '#6e6d6b',
                        boxShadow: isPersonalizado ? 'var(--sombra-secundaria)' : '0 8px 32px rgba(0, 0, 0, 0.3)'
                      }}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.mensagem}</p>
                    </div>
                  </div>
                ))}

                {carregando && (
                  <div className="flex justify-start">
                    <div 
                      className="px-5 py-4 rounded-2xl rounded-bl-md border backdrop-blur-sm"
                      style={{
                        backgroundColor: isPersonalizado ? 'var(--cor-primaria-light)' : 'rgba(20, 20, 20, 0.8)',
                        borderColor: isPersonalizado ? 'var(--cor-secundaria-light)' : '#6e6d6b',
                        boxShadow: isPersonalizado ? 'var(--sombra-secundaria)' : '0 8px 32px rgba(0, 0, 0, 0.3)'
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex space-x-1">
                          <div 
                            className="w-3 h-3 rounded-full animate-pulse"
                            style={{ backgroundColor: isPersonalizado ? 'var(--cor-terciaria)' : '#b0825a' }}
                          />
                          <div 
                            className="w-3 h-3 rounded-full animate-pulse delay-100"
                            style={{ backgroundColor: isPersonalizado ? 'var(--cor-terciaria)' : '#b0825a' }}
                          />
                          <div 
                            className="w-3 h-3 rounded-full animate-pulse delay-200"
                            style={{ backgroundColor: isPersonalizado ? 'var(--cor-terciaria)' : '#b0825a' }}
                          />
                        </div>
                        <span className="text-sm text-gray-200">{advogadoData.nome} está analisando...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input de mensagem ou Opções de Ação */}
              <div 
                className="p-6 border-t"
                style={{
                  backgroundColor: isPersonalizado ? 'var(--cor-primaria-light)' : '#1a1a1a',
                  borderColor: isPersonalizado ? 'var(--cor-secundaria-light)' : 'rgba(110, 109, 107, 0.4)'
                }}
              >
                {mostrarOpcoesAcao && !solicitacaoAgendamento && !carregando ? (
                  <div className="space-y-4">
                    <div className="text-center mb-4">
                      <p className="text-gray-200 text-sm mb-3">
                        Como gostaria de prosseguir?
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => handleOpcaoAcao('agendamento')}
                        className="flex-1 flex items-center justify-center gap-3 px-6 py-4 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-xl"
                        style={{
                          background: isPersonalizado ? 'var(--gradiente-botao)' : 'linear-gradient(135deg, #b0825a, #8b6942, #6d532a)',
                          boxShadow: isPersonalizado ? 'var(--sombra-primaria)' : '0 15px 35px rgba(176, 130, 90, 0.5)'
                        }}
                      >
                        <span className="text-xl">📅</span>
                        <div className="text-left">
                          <div className="text-sm font-semibold">Agendar Consulta</div>
                          <div className="text-xs opacity-90">Marcar horário presencial</div>
                        </div>
                      </button>
                      <button
                        onClick={() => handleOpcaoAcao('contato_advogado')}
                        className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-br from-[#25d366] via-[#1eb355] to-[#128c7e] text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-xl"
                      >
                        <span className="text-xl">💬</span>
                        <div className="text-left">
                          <div className="text-sm font-semibold">Falar com Advogado</div>
                          <div className="text-xs opacity-90">Contato direto via WhatsApp</div>
                        </div>
                      </button>
                    </div>
                  </div>
                ) : solicitacaoAgendamento ? (
                  <div className="space-y-4">
                    <div className="text-center mb-4">
                      <p className="text-gray-200 text-sm">
                        Informe sua preferência de data e horário:
                      </p>
                    </div>
                    <div className="flex gap-4">
                      <input
                        type="text"
                        value={mensagemAtual}
                        onChange={(e) => setMensagemAtual(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !carregando && handleAgendamentoConfirmado()}
                        placeholder="Ex: Amanhã à tarde, Dia 20/08 de manhã..."
                        className="flex-1 p-4 rounded-xl border text-white placeholder-gray-400 focus:outline-none focus:ring-2 transform transition-all duration-300 focus:scale-[1.02] backdrop-blur-sm"
                        style={{
                          backgroundColor: isPersonalizado ? 'var(--cor-primaria-light)' : 'rgba(40, 40, 40, 0.8)',
                          borderColor: isPersonalizado ? 'var(--cor-secundaria-light)' : '#6e6d6b',
                          '--tw-ring-color': isPersonalizado ? 'var(--cor-terciaria)' : '#b0825a',
                          boxShadow: isPersonalizado ? 'var(--sombra-secundaria)' : '0 4px 16px rgba(0, 0, 0, 0.3)'
                        } as React.CSSProperties}
                        disabled={carregando}
                      />
                      <button
                        onClick={handleAgendamentoConfirmado}
                        disabled={carregando || !mensagemAtual.trim()}
                        className="px-8 py-4 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-105 hover:opacity-90 active:scale-95 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                        style={{
                          background: isPersonalizado ? 'var(--gradiente-botao)' : 'linear-gradient(135deg, #b0825a, #8b6942, #6d532a)',
                          boxShadow: isPersonalizado ? 'var(--sombra-primaria)' : '0 15px 35px rgba(176, 130, 90, 0.5)'
                        }}
                      >
                        {carregando ? (
                          <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          'Confirmar'
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-4">
                    <input
                      type="text"
                      value={mensagemAtual}
                      onChange={(e) => setMensagemAtual(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !carregando && enviarMensagem()}
                      placeholder={`Continue sua conversa com ${advogadoData.nome}...`}
                      className="flex-1 p-4 rounded-xl border text-white placeholder-gray-400 focus:outline-none focus:ring-2 transform transition-all duration-300 focus:scale-[1.02] backdrop-blur-sm"
                      style={{
                        backgroundColor: isPersonalizado ? 'var(--cor-primaria-light)' : 'rgba(40, 40, 40, 0.8)',
                        borderColor: isPersonalizado ? 'var(--cor-secundaria-light)' : '#6e6d6b',
                        '--tw-ring-color': isPersonalizado ? 'var(--cor-terciaria)' : '#b0825a',
                        boxShadow: isPersonalizado ? 'var(--sombra-secundaria)' : '0 4px 16px rgba(0, 0, 0, 0.3)'
                      } as React.CSSProperties}
                      disabled={carregando}
                    />
                    <button
                      onClick={enviarMensagem}
                      disabled={carregando || !mensagemAtual.trim()}
                      className="px-8 py-4 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-105 hover:opacity-90 active:scale-95 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                      style={{
                        background: isPersonalizado ? 'var(--gradiente-botao)' : 'linear-gradient(135deg, #b0825a, #8b6942, #6d532a)',
                        boxShadow: isPersonalizado ? 'var(--sombra-primaria)' : '0 15px 35px rgba(176, 130, 90, 0.5)'
                      }}
                    >
                      {carregando ? (
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        'Enviar'
                      )}
                    </button>
                  </div>
                )}
                <div className="mt-3 text-xs text-gray-400 text-center">
                  {solicitacaoAgendamento ? 'Informe sua preferência de agendamento' : 'Pressione Enter para enviar • Powered by IAJuris SaaS'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Informações de contato - apenas após formulário enviado */}
        {formularioEnviado && (
          <div className="mt-8 text-center">
            <div 
              className="inline-block rounded-2xl p-6 transition-all duration-300 hover:scale-105 backdrop-blur-xl border-2"
              style={{
                backgroundColor: isPersonalizado ? 'var(--cor-primaria-light)' : 'rgba(20, 20, 20, 0.8)',
                borderColor: isPersonalizado ? 'var(--cor-secundaria-light)' : '#6e6d6b',
                boxShadow: isPersonalizado ? 'var(--sombra-secundaria)' : '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}
            >
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white mb-2 drop-shadow">
                  Precisa de um atendimento mais rápido?
                </h3>
                <p className="text-gray-200 text-sm">
                  Entre em contato diretamente via WhatsApp
                </p>
              </div>
              <a 
                href={`https://wa.me/${advogadoData.contato.replace(/\D/g, '')}?text=Olá ${advogadoData.nome}, vim através do seu site e gostaria de conversar sobre minha situação jurídica.`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-br from-[#25d366] via-[#1eb355] to-[#128c7e] text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-xl"
              >
                <span className="text-xl">📱</span>
                <div className="text-left">
                  <div className="text-sm">WhatsApp</div>
                  <div className="text-xs opacity-90">{advogadoData.contato}</div>
                </div>
              </a>
            </div>
          </div>
        )}

        {/* Footer com informações da plataforma */}
        <div className="mt-12 text-center">
          <div className="text-xs text-gray-400">
            Esta página é powered by <span 
              className="font-semibold"
              style={{ color: isPersonalizado ? 'var(--cor-terciaria)' : '#b0825a' }}
            >IAJuris SaaS</span>
          </div>
        </div>
      </div>
    </main>
  );
}
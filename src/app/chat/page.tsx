'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link'; // Importar Link do Next.js
import { createLead, addMensagemHistorico, updateLead, Message, Lead } from '@/lib/firestoreLeads';

export default function ChatPage() {
  const [formularioEnviado, setFormularioEnviado] = useState(false);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [motivo, setMotivo] = useState('');
  const [conversaIA, setConversaIA] = useState<Message[]>([]);
  const [mensagemAtual, setMensagemAtual] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [mostrarOpcoesAcao, setMostrarOpcoesAcao] = useState(false);
  const [solicitacaoAgendamento, setSolicitacaoAgendamento] = useState(false);
  const chatAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [conversaIA]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCarregando(true);

    try {
      const newLeadData: Omit<Lead, 'id' | 'dataRegistro' | 'statusAtendimento' | 'historico' | 'dataUltimaInteracao' | 'tipoSolicitacaoCliente' | 'preferenciaAgendamentoCliente'> = { nome, telefone, motivo };
      const newLeadId = await createLead(newLeadData);
      setLeadId(newLeadId);
      
      const respostaInicialIA = await gerarRespostaIA(motivo, true);
      
      const aiMessage: Message = { tipo: 'ai', mensagem: respostaInicialIA, timestamp: new Date().toISOString() };
      setConversaIA([aiMessage]);
      await addMensagemHistorico(newLeadId, 'ai', respostaInicialIA);

      setFormularioEnviado(true);
      setMostrarOpcoesAcao(true);

    } catch (error) {
      console.error('Erro ao processar formulário:', error);
      const errorMessage: Message = { tipo: 'ai', mensagem: 'Desculpe, houve um erro técnico ao iniciar o atendimento. Nossa equipe entrará em contato em breve.', timestamp: new Date().toISOString() };
      setConversaIA([errorMessage]);
      setFormularioEnviado(true);
    } finally {
      setCarregando(false);
    }
  };

  const gerarRespostaIA = async (pergunta: string, isInicial: boolean = false): Promise<string> => {
    try {
      const response = await fetch('/api/groq-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mensagem: pergunta,
          contexto: isInicial ? { nome, telefone, motivo } : null,
          historico: conversaIA
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return data.resposta || 'Desculpe, não consegui processar sua solicitação.';
    } catch (error) {
      console.error('Erro ao gerar resposta da IA:', error);
      return 'Desculpe, houve um erro. Nossa equipe entrará em contato em breve.';
    }
  };

  const enviarMensagem = async () => {
    if (!mensagemAtual.trim() || !leadId) return;

    const novaMensagem = mensagemAtual;
    setMensagemAtual('');
    setCarregando(true);
    setMostrarOpcoesAcao(false);

    const userMessage: Message = { tipo: 'user', mensagem: novaMensagem, timestamp: new Date().toISOString() };
    setConversaIA(prev => [...prev, userMessage]);
    await addMensagemHistorico(leadId, 'user', novaMensagem);

    try {
      const respostaIA = await gerarRespostaIA(novaMensagem);
      
      const aiMessage: Message = { tipo: 'ai', mensagem: respostaIA, timestamp: new Date().toISOString() };
      setConversaIA(prev => [...prev, aiMessage]);
      await addMensagemHistorico(leadId, 'ai', respostaIA);

      if (!solicitacaoAgendamento) {
        setMostrarOpcoesAcao(true); 
      }

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      const errorMessage: Message = { tipo: 'ai', mensagem: 'Desculpe, houve um erro. Tente novamente.', timestamp: new Date().toISOString() };
      setConversaIA(prev => [...prev, errorMessage]);
      await addMensagemHistorico(leadId, 'ai', errorMessage.mensagem);
    } finally {
      setCarregando(false);
    }
  };

  const handleOpcaoAcao = async (tipo: 'agendamento' | 'contato_advogado') => {
    if (!leadId) return;
    setCarregando(true);
    setMostrarOpcoesAcao(false);

    let userActionMessage = '';
    let aiResponseMessage = '';
    let leadUpdates: Partial<Lead> = {};

    if (tipo === 'agendamento') {
      userActionMessage = 'Gostaria de agendar uma visita.';
      aiResponseMessage = 'Ótimo! Para agendarmos, qual a data e o período (manhã/tarde/noite) de sua preferência? Por exemplo: "Amanhã à tarde" ou "Dia 20/07 de manhã".';
      setSolicitacaoAgendamento(true);
      leadUpdates = { tipoSolicitacaoCliente: 'agendamento', statusAtendimento: 'contatado' };
    } else { // 'contato_advogado'
      userActionMessage = 'Prefiro falar com um advogado.';
      aiResponseMessage = 'Entendido! Encaminhei seus dados para nossa equipe jurídica. Em breve um de nossos advogados entrará em contato com você via telefone ou WhatsApp para prosseguir com seu atendimento. Agradecemos seu interesse!';
      leadUpdates = { tipoSolicitacaoCliente: 'contato_advogado', statusAtendimento: 'contatado' };
    }

    const userMsg: Message = { tipo: 'user', mensagem: userActionMessage, timestamp: new Date().toISOString() };
    const aiMsg: Message = { tipo: 'ai', mensagem: aiResponseMessage, timestamp: new Date().toISOString() };
    setConversaIA(prev => [...prev, userMsg, aiMsg]);
    
    await addMensagemHistorico(leadId, 'user', userActionMessage);
    await addMensagemHistorico(leadId, 'ai', aiResponseMessage);
    await updateLead(leadId, leadUpdates);

    setCarregando(false);
  };

  const handleAgendamentoConfirmado = async () => {
    if (!mensagemAtual.trim() || !leadId) return;

    const dataHoraPreferencial = mensagemAtual;
    setMensagemAtual('');
    setCarregando(true);
    setSolicitacaoAgendamento(false);

    const userConfirmationMessage = `Minha preferência é: ${dataHoraPreferencial}.`;
    const aiFinalMessage = `Confirmado! Sua preferência de agendamento para "${dataHoraPreferencial}" foi registrada. Em breve, nossa equipe entrará em contato para confirmar os detalhes e formalizar a sua reunião. Agradecemos seu interesse.`;

    const userMsg: Message = { tipo: 'user', mensagem: userConfirmationMessage, timestamp: new Date().toISOString() };
    const aiMsg: Message = { tipo: 'ai', mensagem: aiFinalMessage, timestamp: new Date().toISOString() };
    setConversaIA(prev => [...prev, userMsg, aiMsg]);

    await addMensagemHistorico(leadId, 'user', userConfirmationMessage);
    await addMensagemHistorico(leadId, 'ai', aiFinalMessage);
    
    await updateLead(leadId, {
      preferenciaAgendamentoCliente: dataHoraPreferencial,
      tipoSolicitacaoCliente: 'agendamento',
      statusAtendimento: 'contatado'
    });

    setCarregando(false);
  };

  return (
    // Background Principal com gradiente e orbs decorativos
    <main className="min-h-screen relative overflow-hidden">
      {/* Background gradiente */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#000000] via-[#1a1a1a] to-[#3a2a1a]" />
      
      {/* Elementos decorativos - Background Orbs */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-[#b0825a] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
      <div className="absolute bottom-20 right-20 w-72 h-72 bg-[#b0825a] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000" />

      {/* Header com logo IAJURIS e Botão Voltar para Dashboard */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-8 border-b border-[#6e6d6b] border-opacity-20 backdrop-blur-sm"
           style={{ backgroundColor: 'rgba(20, 20, 20, 0.8)' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between"> {/* Adicionado flex e justify-between */}
          {/* Botão Voltar para Dashboard */}
          <Link 
            href="/dashboard" // Caminho para a Dashboard
            className="group flex items-center px-4 py-2 rounded-xl border transition-all duration-300 hover:scale-105 active:scale-95 font-semibold"
            style={{ 
              background: 'linear-gradient(135deg, #b0825a 0%, #8b6942 50%, #6d532a 100%)', // Gradiente Dourado
              borderColor: 'rgba(176, 130, 90, 0.2)', // Borda dourada sutil
              boxShadow: '0 10px 25px rgba(176, 130, 90, 0.3)' // Sombra dourada
            }}
          >
            <span className="text-white font-medium text-sm sm:text-base">
              Voltar
            </span>
          </Link>

          {/* Título Centralizado IAJURIS */}
          <div className="flex-grow text-center"> {/* flex-grow para ocupar espaço e text-center para centralizar */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-3xl text-[#b0825a]" style={{ opacity: 0.7, fontSize: '2.5rem' }}>⚖️</span>
                <h1 className="text-4xl md:text-5xl font-bold text-[#b0825a] text-shadow-lg">
                  IAJURIS
                </h1>
              </div>
            </div>
            {/* Separador - Linha dourada sutil */}
            <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-[#b0825a] to-transparent mx-auto mb-6"></div>
            <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4">
              Inteligência Artificial Jurídica
            </h2>
            <p className="text-lg text-[#d4d4d4] opacity-80 font-light max-w-3xl mx-auto leading-relaxed">
              Converse com nossa IA especializada e receba orientações jurídicas personalizadas
            </p>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {!formularioEnviado ? (
          <div className="max-w-2xl mx-auto">
            {/* Formulário de Captura - Aplicando Container Principal e Inputs */}
            <div 
              className="rounded-2xl p-8 shadow-2xl transition-all duration-300"
              style={{ 
                backgroundColor: 'rgba(20, 20, 20, 0.8)', 
                border: '1px solid rgba(176, 130, 90, 0.2)', 
                backdropFilter: 'blur(8px)', 
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)' 
              }}
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-[#b0825a] rounded-full flex items-center justify-center mx-auto mb-4" style={{ boxShadow: '0 5px 15px rgba(176, 130, 90, 0.4)' }}> {/* Ícone do formulário com sombra dourada */}
                  <span className="text-2xl">🤖</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Inicie seu Atendimento
                </h3>
                <p className="text-[#d4d4d4]">
                  Preencha os dados para começar a conversar com nossa IA.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="nome" className="block text-sm font-semibold mb-3 text-[#b0825a]"> {/* Cor da label */}
                    Nome Completo
                  </label>
                  <input
                    id="nome"
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Digite seu nome completo"
                    required
                    className="w-full p-4 rounded-xl bg-[rgba(40,40,40,0.8)] border border-[#6e6d6b] text-white placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#b0825a] transform transition-all duration-300 focus:scale-[1.02]" // Estilo de input
                  />
                </div>

                <div>
                  <label htmlFor="telefone" className="block text-sm font-semibold mb-3 text-[#b0825a]"> {/* Cor da label */}
                    Telefone/WhatsApp
                  </label>
                  <input
                    id="telefone"
                    type="tel"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="(XX) XXXXX-XXXX"
                    required
                    className="w-full p-4 rounded-xl bg-[rgba(40,40,40,0.8)] border border-[#6e6d6b] text-white placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#b0825a] transform transition-all duration-300 focus:scale-[1.02]" // Estilo de input
                  />
                </div>

                <div>
                  <label htmlFor="motivo" className="block text-sm font-semibold mb-3 text-[#b0825a]"> {/* Cor da label */}
                    Descreva sua Situação
                  </label>
                  <textarea
                    id="motivo"
                    rows={4}
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    required
                    placeholder="Descreva sua dúvida jurídica ou situação que precisa de orientação..."
                    className="w-full p-4 rounded-xl bg-[rgba(40,40,40,0.8)] border border-[#6e6d6b] text-white placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#b0825a] transform transition-all duration-300 resize-none focus:scale-[1.02]" // Estilo de input
                  />
                </div>

                <button
                  type="submit"
                  disabled={carregando}
                  // Gradiente Dourado para botões principais
                  className="w-full py-4 rounded-xl font-semibold bg-gradient-to-br from-[#b0825a] via-[#8b6942] to-[#6d532a] text-white transition-all duration-300 transform hover:scale-105 hover:opacity-90 active:scale-95 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                  style={{ boxShadow: '0 10px 25px rgba(176, 130, 90, 0.3)' }}
                >
                  {carregando ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      Processando...
                    </div>
                  ) : (
                    'Iniciar Atendimento com IA'
                  )}
                </button>
              </form>
            </div>

            {/* Cards de Benefícios - Aplicando Container Principal */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <div 
                className="rounded-xl p-6 text-center transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl"
                style={{ 
                  backgroundColor: 'rgba(20, 20, 20, 0.8)', 
                  border: '1px solid rgba(176, 130, 90, 0.2)', 
                  backdropFilter: 'blur(8px)', 
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)' 
                }}
              >
                <div className="w-12 h-12 bg-[#b0825a] rounded-full flex items-center justify-center mx-auto mb-4" style={{ boxShadow: '0 5px 15px rgba(176, 130, 90, 0.4)' }}>
                  <span className="text-2xl text-white">⚡</span> {/* Ícone branco */}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Resposta Imediata</h3>
                <p className="text-[#d4d4d4] text-sm">IA responde em segundos</p>
              </div>

              <div 
                className="rounded-xl p-6 text-center transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl"
                style={{ 
                  backgroundColor: 'rgba(20, 20, 20, 0.8)', 
                  border: '1px solid rgba(176, 130, 90, 0.2)', 
                  backdropFilter: 'blur(8px)', 
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)' 
                }}
              >
                <div className="w-12 h-12 bg-[#b0825a] rounded-full flex items-center justify-center mx-auto mb-4" style={{ boxShadow: '0 5px 15px rgba(176, 130, 90, 0.4)' }}>
                  <span className="text-2xl text-white">🛡️</span> {/* Ícone branco */}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Dados Seguros</h3>
                <p className="text-[#d4d4d4] text-sm">Informações protegidas</p>
              </div>

              <div 
                className="rounded-xl p-6 text-center transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl"
                style={{ 
                  backgroundColor: 'rgba(20, 20, 20, 0.8)', 
                  border: '1px solid rgba(176, 130, 90, 0.2)', 
                  backdropFilter: 'blur(8px)', 
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)' 
                }}
              >
                <div className="w-12 h-12 bg-[#b0825a] rounded-full flex items-center justify-center mx-auto mb-4" style={{ boxShadow: '0 5px 15px rgba(176, 130, 90, 0.4)' }}>
                  <span className="text-2xl text-white">👥</span> {/* Ícone branco */}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Suporte Humano</h3>
                <p className="text-[#d4d4d4] text-sm">Especialistas disponíveis</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto">
            {/* Saudação - Aplicando Container Principal */}
            <div 
              className="rounded-2xl p-8 mb-8 text-center transition-all duration-300"
              style={{ 
                backgroundColor: 'rgba(20, 20, 20, 0.8)', 
                border: '1px solid rgba(176, 130, 90, 0.2)', 
                backdropFilter: 'blur(8px)', 
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)' 
              }}
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-12 h-12 bg-[#b0825a] rounded-full flex items-center justify-center" style={{ boxShadow: '0 5px 15px rgba(176, 130, 90, 0.4)' }}>
                  <span className="text-xl">👋</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white">
                  Olá, {nome}!
                </h2>
              </div>
              <p className="text-[#d4d4d4] text-lg">
                Vou analisar sua situação e fornecer orientações em linguagem clara e acessível.
              </p>
            </div>

            {/* Interface de Chat - Aplicando Container Principal */}
            <div 
              className="rounded-2xl overflow-hidden shadow-2xl transition-all duration-300"
              style={{ 
                backgroundColor: 'rgba(20, 20, 20, 0.8)', 
                border: '1px solid rgba(176, 130, 90, 0.2)', 
                backdropFilter: 'blur(8px)', 
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)' 
              }}
            >
              
              {/* Área de Conversa */}
              <div ref={chatAreaRef} className="p-6 max-h-96 overflow-y-auto space-y-4 bg-[#1a1a1a]"> {/* Fundo da área de chat */}
                {conversaIA.map((msg, index) => (
                  <div key={index} className={`flex ${msg.tipo === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-5 py-4 rounded-2xl shadow-lg ${
                      msg.tipo === 'user' 
                        ? 'bg-gradient-to-br from-[#b0825a] via-[#8b6942] to-[#6d532a] text-white rounded-br-md' // Balão do usuário com gradiente dourado
                        : 'bg-[rgba(40,40,40,0.8)] text-white rounded-bl-md border border-[#6e6d6b]' // Balão da IA com cor de input
                    }`}>
                      <p className="text-sm leading-relaxed">{msg.mensagem}</p>
                    </div>
                  </div>
                ))}

                {carregando && (
                  <div className="flex justify-start">
                    <div className="px-5 py-4 rounded-2xl rounded-bl-md bg-[rgba(40,40,40,0.8)] border border-[#6e6d6b]"> {/* Balão de IA digitando */}
                      <div className="flex items-center space-x-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-[#b0825a] rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-[#b0825a] rounded-full animate-pulse delay-100"></div>
                          <div className="w-2 h-2 bg-[#b0825a] rounded-full animate-pulse delay-200"></div>
                        </div>
                        <span className="text-sm text-[#d4d4d4]">IA está digitando...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input de mensagem ou Opções de Ação */}
              <div className="p-6 bg-[#1a1a1a] border-t border-[#6e6d6b] border-opacity-20"> {/* Fundo da área de input */}
                {mostrarOpcoesAcao && !solicitacaoAgendamento && !carregando ? (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={() => handleOpcaoAcao('contato_advogado')}
                      // Botão principal com gradiente dourado
                      className="flex-1 py-4 rounded-xl font-semibold bg-gradient-to-br from-[#b0825a] via-[#8b6942] to-[#6d532a] text-white transition-all duration-300 transform hover:scale-105 hover:opacity-90 active:scale-95 shadow-xl"
                      style={{ boxShadow: '0 10px 25px rgba(176, 130, 90, 0.3)' }}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <span className="text-xl">👨‍💼</span>
                        Falar com um Advogado
                      </span>
                    </button>
                    <button
                      onClick={() => handleOpcaoAcao('agendamento')}
                      // Botão principal com gradiente dourado
                      className="flex-1 py-4 rounded-xl font-semibold bg-gradient-to-br from-[#b0825a] via-[#8b6942] to-[#6d532a] text-white transition-all duration-300 transform hover:scale-105 hover:opacity-90 active:scale-95 shadow-xl"
                      style={{ boxShadow: '0 10px 25px rgba(176, 130, 90, 0.3)' }}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <span className="text-xl">📅</span>
                        Agendar uma Visita
                      </span>
                    </button>
                  </div>
                ) : solicitacaoAgendamento ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Ex: 'amanhã pela manhã' ou '15/07 às 14h'"
                      value={mensagemAtual}
                      onChange={(e) => setMensagemAtual(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !carregando && handleAgendamentoConfirmado()}
                      className="w-full p-4 rounded-xl bg-[rgba(40,40,40,0.8)] border border-[#6e6d6b] text-white placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#b0825a] transform transition-all duration-300 focus:scale-[1.02]" // Estilo de input
                      disabled={carregando}
                    />
                    <button
                      onClick={handleAgendamentoConfirmado}
                      disabled={carregando || !mensagemAtual.trim()}
                      // Botão principal com gradiente dourado
                      className="w-full py-4 rounded-xl font-semibold bg-gradient-to-br from-[#b0825a] via-[#8b6942] to-[#6d532a] text-white transition-all duration-300 transform hover:scale-105 hover:opacity-90 active:scale-95 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                      style={{ boxShadow: '0 10px 25px rgba(176, 130, 90, 0.3)' }}
                    >
                      {carregando ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                          Processando...
                        </div>
                      ) : (
                        'Confirmar Preferência de Agendamento'
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-4">
                    <input
                      type="text"
                      value={mensagemAtual}
                      onChange={(e) => setMensagemAtual(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !carregando && enviarMensagem()}
                      placeholder="Digite sua pergunta ou dúvida..."
                      className="flex-1 p-4 rounded-xl bg-[rgba(40,40,40,0.8)] border border-[#6e6d6b] text-white placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#b0825a] transform transition-all duration-300 focus:scale-[1.02]" // Estilo de input
                      disabled={carregando}
                    />
                    <button
                      onClick={enviarMensagem}
                      disabled={carregando || !mensagemAtual.trim()}
                      // Botão principal com gradiente dourado
                      className="px-8 py-4 rounded-xl font-semibold bg-gradient-to-br from-[#b0825a] via-[#8b6942] to-[#6d532a] text-white transition-all duration-300 transform hover:scale-105 hover:opacity-90 active:scale-95 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                      style={{ boxShadow: '0 10px 25px rgba(176, 130, 90, 0.3)' }}
                    >
                      {carregando ? (
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        'Enviar'
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

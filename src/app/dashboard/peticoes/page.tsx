'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Send, Loader2, Copy, Save, History } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { salvarPeticao } from '@/lib/firebase-peticoes';

export default function PeticoesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [tipoDocumento, setTipoDocumento] = useState('');
  const [areaJuridica, setAreaJuridica] = useState('');
  const [descricaoCase, setDescricaoCase] = useState('');
  const [dadosCliente, setDadosCliente] = useState('');
  const [dadosAdversario, setDadosAdversario] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [instrucoes, setInstrucoes] = useState('');
  const [documentoGerado, setDocumentoGerado] = useState('');
  const [loading, setLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [documentoSalvo, setDocumentoSalvo] = useState(false);

  // ✅ ISOLAMENTO HÍBRIDO MVP/SaaS - PADRÃO REPLICADO
  const OWNER_EMAIL = 'marvincosta321@gmail.com';
  const isOwnerMVP = session?.user?.email === OWNER_EMAIL;
  const advogadoId = isOwnerMVP ? OWNER_EMAIL : session?.user?.id;

  // Função para lidar com a geração da petição
  const handleGeneratePetition = async () => {
    // ✅ GUARD DE SEGURANÇA CORRIGIDO - Inclui caso MVP
    if (!session?.user?.id && !isOwnerMVP) {
      toast.error('Sessão inválida. Redirecionando...');
      router.push('/auth/advogado/signin');
      return;
    }

    setLoading(true);
    setDocumentoGerado('');
    setCopySuccess(false);
    setDocumentoSalvo(false);

    try {
      const response = await fetch('/api/groq-petitions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tipoDocumento,
          areaJuridica,
          descricaoCase,
          dadosCliente,
          dadosAdversario,
          observacoes,
          instrucoes,
          advogadoId, // ✅ CORRIGIDO: Adicionado advogadoId no body da requisição
        }),
      });

      const data = await response.json();

      if (response.ok && data.sucesso) {
        setDocumentoGerado(data.resposta);
        toast.success('Documento gerado com sucesso!');
        
        // ✅ SAVE AUTOMÁTICO NO FIREBASE - COM ISOLAMENTO HÍBRIDO CORRETO
        try {
          await salvarPeticao({
            advogadoId: String(advogadoId), // ✅ CORRIGIDO: Usa advogadoId híbrido
            tipoDocumento,
            conteudo: data.resposta,
            descricaoCase,
            dadosCliente,
            provedorIA: 'groq'
          });
          setDocumentoSalvo(true);
          toast.success('📄 Documento salvo automaticamente!');
        } catch (saveError) {
          console.error('Erro ao salvar:', saveError);
          toast.error('Documento gerado, mas não foi possível salvar. Tente copiar manualmente.');
        }
      } else {
        toast.error(data.resposta || 'Erro ao gerar documento. Tente novamente.');
        console.error('Erro na resposta da API:', data.error);
      }
    } catch (error) {
      console.error('Erro ao chamar a API:', error);
      toast.error('Erro de conexão. Verifique sua internet e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Função para copiar o documento gerado
  const copyDocument = () => {
    const textarea = document.createElement('textarea');
    textarea.value = documentoGerado;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      setCopySuccess(true);
      toast.success('Documento copiado para a área de transferência!');
    } catch (err) {
      console.error('Falha ao copiar:', err);
      toast.error('Erro ao copiar documento. Por favor, tente manualmente.');
    }
    document.body.removeChild(textarea);
  };

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
                <FileText className="inline-block w-8 h-8 mr-3 text-[#b0825a]" /> Assistente de Redação Jurídica
              </h1>
              <p className="text-lg sm:text-xl font-light opacity-80" style={{ color: '#d4d4d4' }}>
                Gere rascunhos de petições, e-mails e documentos com a inteligência artificial do IAJURIS.
              </p>
            </div>
            <div className="flex gap-3">
              {/* Botão Ver Histórico */}
              <Link 
                href="/dashboard/documentos"
                className="group flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg border"
                style={{ 
                  backgroundColor: 'rgba(176, 130, 90, 0.1)',
                  borderColor: 'rgba(176, 130, 90, 0.3)',
                  color: '#b0825a'
                }}
              >
                <History className="w-4 h-4" />
                Histórico
              </Link>
              
              {/* Botão Voltar */}
              <Link 
                href="/dashboard/leads/advogado"
                className="group flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg"
                style={{ 
                  background: 'linear-gradient(135deg, #b0825a 0%, #8b6942 50%, #6d532a 100%)',
                  boxShadow: '0 10px 25px rgba(176, 130, 90, 0.3)',
                  color: '#ffffff'
                }}
              >
                <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                Voltar ao Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Formulário de Geração de Petições */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
          {/* Coluna de Inputs */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl backdrop-blur-sm border"
              style={{ 
                backgroundColor: 'rgba(20, 20, 20, 0.8)',
                borderColor: 'rgba(176, 130, 90, 0.2)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
              }}>
              <h2 className="text-xl font-semibold text-white mb-4">
                Detalhes para a Geração
              </h2>
              
              <div className="space-y-4">
                {/* Tipo de Documento */}
                <div>
                  <label htmlFor="tipoDocumento" className="block text-sm font-medium mb-1" style={{ color: '#d4d4d4' }}>Tipo de Documento <span className="text-red-500">*</span></label>
                  <select
                    id="tipoDocumento"
                    value={tipoDocumento}
                    onChange={(e) => setTipoDocumento(e.target.value)}
                    className="w-full p-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-[#b0825a] focus:border-transparent transform focus:scale-[1.02] appearance-none"
                    style={{ backgroundColor: 'rgba(40, 40, 40, 0.8)', borderColor: '#6e6d6b', color: '#ffffff' }}
                  >
                    <option value="">Selecione o tipo</option>
                    <option value="petição inicial">Petição Inicial</option>
                    <option value="contestação">Contestação</option>
                    <option value="recurso">Recurso</option>
                    <option value="embargos">Embargos de Declaração</option>
                    <option value="apelação">Apelação</option>
                    <option value="agravo">Agravo de Instrumento</option>
                    <option value="mandado de segurança">Mandado de Segurança</option>
                    <option value="habeas corpus">Habeas Corpus</option>
                    <option value="ação de cobrança">Ação de Cobrança</option>
                    <option value="ação trabalhista">Ação Trabalhista</option>
                    <option value="ação previdenciária">Ação Previdenciária</option>
                    <option value="ação consumerista">Ação de Direito do Consumidor</option>
                    <option value="divórcio">Ação de Divórcio</option>
                    <option value="inventário">Inventário</option>
                    <option value="outros">Outros Documentos Jurídicos</option>
                  </select>
                </div>

                {/* Área Jurídica */}
                <div>
                  <label htmlFor="areaJuridica" className="block text-sm font-medium mb-1" style={{ color: '#d4d4d4' }}>Área Jurídica</label>
                  <select
                    id="areaJuridica"
                    value={areaJuridica}
                    onChange={(e) => setAreaJuridica(e.target.value)}
                    className="w-full p-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-[#b0825a] focus:border-transparent transform focus:scale-[1.02] appearance-none"
                    style={{ backgroundColor: 'rgba(40, 40, 40, 0.8)', borderColor: '#6e6d6b', color: '#ffffff' }}
                  >
                    <option value="">Deixe a IA identificar ou selecione</option>
                    <option value="civil">Direito Civil</option>
                    <option value="trabalhista">Direito Trabalhista</option>
                    <option value="penal">Direito Penal</option>
                    <option value="previdenciário">Direito Previdenciário</option>
                    <option value="consumidor">Direito do Consumidor</option>
                    <option value="família">Direito de Família</option>
                    <option value="tributário">Direito Tributário</option>
                    <option value="administrativo">Direito Administrativo</option>
                    <option value="constitucional">Direito Constitucional</option>
                    <option value="empresarial">Direito Empresarial</option>
                  </select>
                </div>

                {/* Descrição do Caso */}
                <div>
                  <label htmlFor="descricaoCase" className="block text-sm font-medium mb-1" style={{ color: '#d4d4d4' }}>Descrição Detalhada do Caso <span className="text-red-500">*</span></label>
                  <textarea
                    id="descricaoCase"
                    value={descricaoCase}
                    onChange={(e) => setDescricaoCase(e.target.value)}
                    placeholder="Descreva os fatos relevantes, datas, valores, e tudo que for importante para a petição..."
                    rows={6}
                    className="w-full p-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-[#b0825a] focus:border-transparent transform focus:scale-[1.02] resize-y placeholder-gray-400"
                    style={{ backgroundColor: 'rgba(40, 40, 40, 0.8)', borderColor: '#6e6d6b', color: '#ffffff' }}
                  />
                </div>

                {/* Dados do Cliente */}
                <div>
                  <label htmlFor="dadosCliente" className="block text-sm font-medium mb-1" style={{ color: '#d4d4d4' }}>Dados do Cliente/Requerente</label>
                  <textarea
                    id="dadosCliente"
                    value={dadosCliente}
                    onChange={(e) => setDadosCliente(e.target.value)}
                    placeholder="Nome completo, CPF, endereço, profissão, estado civil, etc."
                    rows={3}
                    className="w-full p-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-[#b0825a] focus:border-transparent transform focus:scale-[1.02] resize-y placeholder-gray-400"
                    style={{ backgroundColor: 'rgba(40, 40, 40, 0.8)', borderColor: '#6e6d6b', color: '#ffffff' }}
                  />
                </div>

                {/* Dados do Adversário */}
                <div>
                  <label htmlFor="dadosAdversario" className="block text-sm font-medium mb-1" style={{ color: '#d4d4d4' }}>Dados da Parte Adversa/Requerido</label>
                  <textarea
                    id="dadosAdversario"
                    value={dadosAdversario}
                    onChange={(e) => setDadosAdversario(e.target.value)}
                    placeholder="Nome, qualificação, etc. (se aplicável)"
                    rows={3}
                    className="w-full p-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-[#b0825a] focus:border-transparent transform focus:scale-[1.02] resize-y placeholder-gray-400"
                    style={{ backgroundColor: 'rgba(40, 40, 40, 0.8)', borderColor: '#6e6d6b', color: '#ffffff' }}
                  />
                </div>

                {/* Observações Adicionais */}
                <div>
                  <label htmlFor="observacoes" className="block text-sm font-medium mb-1" style={{ color: '#d4d4d4' }}>Observações Importantes</label>
                  <textarea
                    id="observacoes"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Informações adicionais que a IA deve considerar (ex: urgência, precedentes específicos, etc.)"
                    rows={3}
                    className="w-full p-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-[#b0825a] focus:border-transparent transform focus:scale-[1.02] resize-y placeholder-gray-400"
                    style={{ backgroundColor: 'rgba(40, 40, 40, 0.8)', borderColor: '#6e6d6b', color: '#ffffff' }}
                  />
                </div>

                {/* Instruções Específicas */}
                <div>
                  <label htmlFor="instrucoes" className="block text-sm font-medium mb-1" style={{ color: '#d4d4d4' }}>Instruções Específicas para a IA</label>
                  <textarea
                    id="instrucoes"
                    value={instrucoes}
                    onChange={(e) => setInstrucoes(e.target.value)}
                    placeholder="Ex: 'Mencionar a Súmula X do STJ', 'Focar na tese de...', 'Usar linguagem mais formal/informal'."
                    rows={3}
                    className="w-full p-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-[#b0825a] focus:border-transparent transform focus:scale-[1.02] resize-y placeholder-gray-400"
                    style={{ backgroundColor: 'rgba(40, 40, 40, 0.8)', borderColor: '#6e6d6b', color: '#ffffff' }}
                  />
                </div>

                {/* Botão Gerar Petição */}
                <button
                  onClick={handleGeneratePetition}
                  disabled={loading || !tipoDocumento || !descricaoCase}
                  className="w-full py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                  style={{ 
                    background: 'linear-gradient(135deg, #b0825a 0%, #8b6942 50%, #6d532a 100%)',
                    boxShadow: '0 10px 25px rgba(176, 130, 90, 0.3)',
                    color: '#ffffff'
                  }}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Gerando Documento...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Send className="w-5 h-5" />
                      Gerar Documento Jurídico
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Coluna de Saída (Documento Gerado) */}
          <div className="space-y-6">
            <div className="p-6 rounded-2xl backdrop-blur-sm border"
              style={{ 
                backgroundColor: 'rgba(20, 20, 20, 0.8)',
                borderColor: 'rgba(176, 130, 90, 0.2)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
              }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">
                  Documento Gerado pela IA
                </h2>
                {documentoSalvo && (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-600/20 border border-green-600/30">
                    <Save className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-400 font-medium">Salvo</span>
                  </div>
                )}
              </div>
              
              <div className="relative">
                <textarea
                  value={documentoGerado}
                  readOnly
                  placeholder={loading ? "Gerando seu documento..." : "O documento gerado pela IA aparecerá aqui."}
                  rows={20}
                  className="w-full p-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-[#b0825a] focus:border-transparent transform focus:scale-[1.02] resize-y placeholder-gray-400"
                  style={{ backgroundColor: 'rgba(40, 40, 40, 0.8)', borderColor: '#6e6d6b', color: '#ffffff' }}
                />
                {documentoGerado && (
                  <button
                    onClick={copyDocument}
                    className={`absolute bottom-3 right-3 p-2 rounded-full transition-all duration-300 ${
                      copySuccess ? 'bg-green-600 hover:bg-green-700' : 'bg-[#b0825a] hover:bg-[#8b6942]'
                    } text-white shadow-md`}
                    title={copySuccess ? "Copiado!" : "Copiar Documento"}
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                )}
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
        .animate-pulse {
          animation: pulse 3s ease-in-out infinite;
        }
      `}</style>
    </main>
  );
}
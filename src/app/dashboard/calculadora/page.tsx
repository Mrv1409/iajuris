'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, Calculator, Download, FileText, DollarSign, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

// --- NOVAS INTERFACES PARA TIPAGEM ---
interface ItemCalculo {
  nome: string;
  valor: number;
}

interface ResultadoCalculo {
  tipo: string;
  itens: ItemCalculo[];
  total: number;
}
// --- FIM DAS NOVAS INTERFACES ---

export default function CalculadoraPage() {
  const [tipoCalculo, setTipoCalculo] = useState('');
  const [salario, setSalario] = useState('');
  const [horasExtras, setHorasExtras] = useState('');
  const [diasTrabalhados, setDiasTrabalhados] = useState('');
  const [dataAdmissao, setDataAdmissao] = useState('');
  const [dataDemissao, setDataDemissao] = useState('');
  const [resultado, setResultado] = useState<ResultadoCalculo | null>(null);
  const [loading, setLoading] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const calcularRescisao = () => {
    const salarioNum = parseFloat(salario.replace(',', '.')) || 0;
    const diasNum = parseInt(diasTrabalhados) || 0;

    if (salarioNum <= 0 || diasNum <= 0) {
      toast.error('Para Rescisão: Salário e Dias Trabalhados devem ser maiores que zero.');
      return false;
    }
    
    const saldoSalario = (salarioNum / 30) * diasNum;
    const avisoPreivio = salarioNum;
    const feriasVencidas = salarioNum + (salarioNum / 3);
    const decimoTerceiro = salarioNum / 12;
    const fgts = (salarioNum * 0.08) * 12;
    const multaFGTS = fgts * 0.4;
    
    const total = saldoSalario + avisoPreivio + feriasVencidas + decimoTerceiro + fgts + multaFGTS;
    
    setResultado({
      tipo: 'Rescisão Trabalhista',
      itens: [
        { nome: 'Saldo de Salário', valor: saldoSalario },
        { nome: 'Aviso Prévio Indenizado', valor: avisoPreivio },
        { nome: 'Férias Vencidas + 1/3', valor: feriasVencidas },
        { nome: '13º Salário Proporcional', valor: decimoTerceiro },
        { nome: 'FGTS Estimado (12 meses)', valor: fgts },
        { nome: 'Multa FGTS (40%)', valor: multaFGTS }
      ],
      total
    });
    return true;
  };

  const calcularHorasExtras = () => {
    const salarioNum = parseFloat(salario.replace(',', '.')) || 0;
    const horasNum = parseFloat(horasExtras.replace(',', '.')) || 0;
    
    if (salarioNum <= 0 || horasNum <= 0) {
      toast.error('Para Horas Extras: Salário e Quantidade de Horas Extras devem ser maiores que zero.');
      return false;
    }

    const valorHora = salarioNum / 220;
    const valorHoraExtra = valorHora * 1.5;
    const totalHorasExtras = valorHoraExtra * horasNum;
    const reflexoFerias = totalHorasExtras / 12 + (totalHorasExtras / 12 / 3);
    const reflexo13 = totalHorasExtras / 12;
    const reflexoFGTS = totalHorasExtras * 0.08;
    
    const total = totalHorasExtras + reflexoFerias + reflexo13 + reflexoFGTS;
    
    setResultado({
      tipo: 'Horas Extras',
      itens: [
        { nome: 'Valor Hora Normal', valor: valorHora },
        { nome: 'Valor Hora Extra (50%)', valor: valorHoraExtra },
        { nome: 'Total Horas Extras', valor: totalHorasExtras },
        { nome: 'Reflexo em Férias', valor: reflexoFerias },
        { nome: 'Reflexo no 13º Salário', valor: reflexo13 },
        { nome: 'Reflexo FGTS', valor: reflexoFGTS }
      ],
      total
    });
    return true;
  };

  const calcularFGTS = () => {
    const salarioNum = parseFloat(salario.replace(',', '.')) || 0;
    const mesesTrabalhados = 12;

    if (salarioNum <= 0) {
      toast.error('Para FGTS: Salário Mensal deve ser maior que zero.');
      return false;
    }
    
    const fgtsAnual = salarioNum * 0.08 * mesesTrabalhados;
    const multaFGTS = fgtsAnual * 0.4;
    const total = fgtsAnual + multaFGTS;
    
    setResultado({
      tipo: 'FGTS',
      itens: [
        { nome: 'FGTS 8% ao mês', valor: salarioNum * 0.08 },
        { nome: 'FGTS Anual Estimado', valor: fgtsAnual },
        { nome: 'Multa 40% (se aplicável)', valor: multaFGTS }
      ],
      total
    });
    return true;
  };

  const handleCalcular = async () => {
    setLoading(true);
    setResultado(null);

    let calculoSucesso = false;

    try {
      if (!tipoCalculo) {
        toast.error('Por favor, selecione o Tipo de Cálculo.');
        return;
      }
      if (!salario) {
        toast.error('Por favor, preencha o Salário Mensal.');
        return;
      }

      switch(tipoCalculo) {
        case 'rescisao':
          calculoSucesso = calcularRescisao();
          break;
        case 'horas-extras':
          calculoSucesso = calcularHorasExtras();
          break;
        case 'fgts':
          calculoSucesso = calcularFGTS();
          break;
        default:
          toast.error('Tipo de cálculo não reconhecido.');
          break;
      }

      if (calculoSucesso) {
        toast.success('Cálculo realizado com sucesso!');
      }

    } catch (error) {
      console.error('Erro geral ao realizar cálculo:', error);
      toast.error('Ocorreu um erro inesperado ao calcular. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#000000] via-[#1a1a1a] to-[#2a2a2a]">
      {/* Elementos decorativos - Background Orbs */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-[#b0825a] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
      <div className="absolute bottom-20 right-20 w-72 h-72 bg-[#b0825a] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000" />

      {/* Container Principal */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-4">
        {/* Header */}
        <div className="px-4 sm:px-6 lg:px-8 py-4 border-b border-[#6e6d6b] border-opacity-20 backdrop-blur-sm"
           style={{ backgroundColor: 'rgba(20, 20, 20, 0.8)' }}>
          
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Botão Voltar */}
            <Link 
              href="/dashboard/leads/advogado"
              className="flex items-center px-4 py-2 bg-[#2a2a2a] border border-[#6e6d6b] rounded-lg transition-all duration-300 transform hover:scale-105 hover:opacity-90 group"
            >
              <ArrowLeft className="w-4 h-4 mr-2 text-[#d4d4d4] group-hover:text-white transition-colors" style={{ opacity: 0.7 }} />
              <span className="text-[#d4d4d4] group-hover:text-white text-sm font-medium">Dashboard</span>
            </Link>

            {/* Logo Centralizada */}
            <div className="flex items-center justify-center">
              <Calculator className="w-6 h-6 text-[#b0825a] mr-2" style={{ opacity: 0.7 }} />
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#b0825a] text-shadow-lg">
                IAJURIS
              </h1>
              <DollarSign className="w-6 h-6 text-[#b0825a] ml-2" style={{ opacity: 0.7 }} />
            </div>

            {/* Espaço vazio para balancear o layout */}
            <div className="hidden sm:block w-32"></div>
          </div>
        </div>

        {/* Título da Página */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-b border-[#6e6d6b] border-opacity-20"
           style={{ backgroundColor: 'rgba(20, 20, 20, 0.8)' }}>
          <div className="flex items-center justify-center">
            <Calculator className="w-6 sm:w-8 h-6 sm:h-8 text-[#b0825a] mr-3" style={{ opacity: 0.7 }} />
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">Calculadora Trabalhista</h2>
          </div>
          <div className="mx-auto mt-4 h-0.5 w-24 bg-gradient-to-r from-transparent via-[#b0825a] to-transparent" />
          <p className="text-center mt-2 text-[#d4d4d4] text-sm">
            Cálculos precisos de rescisão, horas extras e FGTS automatizados
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Grid Principal */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Formulário */}
            <div className="rounded-2xl p-6 shadow-2xl transition-all duration-300"
                 style={{ 
                   backgroundColor: 'rgba(20, 20, 20, 0.8)',
                   border: '1px solid rgba(176, 130, 90, 0.2)',
                   backdropFilter: 'blur(8px)',
                   boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                 }}>
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                <Calculator className="w-5 h-5 mr-2 text-[#b0825a]" style={{ opacity: 0.7 }} />
                Dados para Cálculo
              </h2>
              
              <div className="space-y-6">
                {/* Tipo de Cálculo */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-[#d4d4d4]">
                    Tipo de Cálculo <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={tipoCalculo}
                    onChange={(e) => {
                      setTipoCalculo(e.target.value);
                      setResultado(null);
                      setHorasExtras('');
                      setDiasTrabalhados('');
                      setDataAdmissao('');
                      setDataDemissao('');
                    }}
                    className="w-full p-4 rounded-xl bg-[rgba(40,40,40,0.8)] border border-[#6e6d6b] text-white focus:outline-none focus:ring-2 focus:ring-[#b0825a] transform transition-all duration-300 focus:scale-[1.02]"
                  >
                    <option value="">Selecione o tipo</option>
                    <option value="rescisao">Rescisão Trabalhista</option>
                    <option value="horas-extras">Horas Extras</option>
                    <option value="fgts">FGTS</option>
                  </select>
                </div>

                {/* Salário */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-[#d4d4d4]">
                    Salário Mensal <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={salario}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9,.]/g, '');
                      setSalario(value);
                    }}
                    placeholder="Ex: 2500,00"
                    className="w-full p-4 rounded-xl bg-[rgba(40,40,40,0.8)] border border-[#6e6d6b] text-white placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#b0825a] transform transition-all duration-300 focus:scale-[1.02]"
                  />
                </div>

                {/* Campos Condicionais */}
                {tipoCalculo === 'rescisao' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-[#d4d4d4]">Dias Trabalhados no Mês da Rescisão</label>
                      <input
                        type="number"
                        value={diasTrabalhados}
                        onChange={(e) => setDiasTrabalhados(e.target.value)}
                        placeholder="Ex: 15"
                        className="w-full p-4 rounded-xl bg-[rgba(40,40,40,0.8)] border border-[#6e6d6b] text-white placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#b0825a] transform transition-all duration-300 focus:scale-[1.02]"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-[#d4d4d4]">Data Admissão</label>
                        <input
                          type="date"
                          value={dataAdmissao}
                          onChange={(e) => setDataAdmissao(e.target.value)}
                          className="w-full p-4 rounded-xl bg-[rgba(40,40,40,0.8)] border border-[#6e6d6b] text-white focus:outline-none focus:ring-2 focus:ring-[#b0825a] transform transition-all duration-300 focus:scale-[1.02]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-[#d4d4d4]">Data Demissão</label>
                        <input
                          type="date"
                          value={dataDemissao}
                          onChange={(e) => setDataDemissao(e.target.value)}
                          className="w-full p-4 rounded-xl bg-[rgba(40,40,40,0.8)] border border-[#6e6d6b] text-white focus:outline-none focus:ring-2 focus:ring-[#b0825a] transform transition-all duration-300 focus:scale-[1.02]"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-[#6e6d6b] mt-1">
                      *As datas de admissão/demissão são para referência e não influenciam o cálculo simplificado atual.
                    </p>
                  </>
                )}

                {tipoCalculo === 'horas-extras' && (
                  <div>
                    <label className="block text-sm font-medium mb-2 text-[#d4d4d4]">Quantidade de Horas Extras</label>
                    <input
                      type="text"
                      value={horasExtras}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9,.]/g, '');
                        setHorasExtras(value);
                      }}
                      placeholder="Ex: 40,5"
                      className="w-full p-4 rounded-xl bg-[rgba(40,40,40,0.8)] border border-[#6e6d6b] text-white placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#b0825a] transform transition-all duration-300 focus:scale-[1.02]"
                    />
                  </div>
                )}

                {/* Botão Calcular */}
                <button
                  onClick={handleCalcular}
                  disabled={loading || !tipoCalculo || !salario}
                  className="w-full py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:opacity-90 active:scale-95 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  style={{ 
                    background: 'linear-gradient(135deg, #b0825a 0%, #8b6942 50%, #6d532a 100%)',
                    boxShadow: '0 10px 25px rgba(176, 130, 90, 0.3)',
                    color: '#ffffff'
                  }}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Calculando...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Calcular
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Resultado */}
            <div className="rounded-2xl p-6 shadow-2xl transition-all duration-300"
                 style={{ 
                   backgroundColor: 'rgba(20, 20, 20, 0.8)',
                   border: '1px solid rgba(176, 130, 90, 0.2)',
                   backdropFilter: 'blur(8px)',
                   boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
                 }}>
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-[#b0825a]" style={{ opacity: 0.7 }} />
                Resultado do Cálculo
              </h2>
              
              {resultado ? (
                <div className="space-y-6">
                  <div className="p-6 rounded-xl" style={{ backgroundColor: 'rgba(176, 130, 90, 0.1)', border: '1px solid rgba(176, 130, 90, 0.2)' }}>
                    <h3 className="text-lg font-semibold text-[#b0825a] mb-4">{resultado.tipo}</h3>
                    
                    <div className="space-y-3">
                      {resultado.itens.map((item, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-[#6e6d6b] border-opacity-20">
                          <span className="text-[#d4d4d4]">{item.nome}</span>
                          <span className="font-semibold text-white">{formatCurrency(item.valor)}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6 pt-4 border-t-2 border-[#b0825a]">
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-bold text-[#b0825a]">TOTAL:</span>
                        <span className="text-2xl font-bold text-[#b0825a]">{formatCurrency(resultado.total)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const conteudo = `CÁLCULO TRABALHISTA - ${resultado.tipo}\n\n` +
                        resultado.itens.map((item) => `${item.nome}: ${formatCurrency(item.valor)}`).join('\n') +
                        `\n\nTOTAL: ${formatCurrency(resultado.total)}\n\n` +
                        `Gerado pelo IAJURIS em ${new Date().toLocaleDateString('pt-BR')}`;
                      
                      const blob = new Blob([conteudo], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `calculo-trabalhista-${Date.now()}.txt`;
                      a.click();
                      toast.success('Relatório baixado com sucesso!');
                    }}
                    className="w-full py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:opacity-90 active:scale-95 shadow-xl"
                    style={{ 
                      background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #15803d 100%)',
                      boxShadow: '0 10px 25px rgba(34, 197, 94, 0.3)',
                      color: '#ffffff'
                    }}
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Baixar Relatório
                  </button>
                </div>
              ) : (
                <div className="text-center py-12 rounded-xl" style={{ backgroundColor: 'rgba(40, 40, 40, 0.4)' }}>
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" style={{ color: '#b0825a' }} />
                  <p className="text-[#d4d4d4] text-lg">
                    Preencha os dados e clique em calcular para ver o resultado
                  </p>
                </div>
              )}
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

        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animate-pulse {
          animation: pulse 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
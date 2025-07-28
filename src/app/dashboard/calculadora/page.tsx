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
  const [resultado, setResultado] = useState<ResultadoCalculo | null>(null); // AQUI: Tipagem corrigida
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
    <main className="min-h-screen relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 30%, #2a2a2a 60%, #3a2a1a 100%)' }}>
      
      {/* Elementos decorativos */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-[#b0825a] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
      <div className="absolute bottom-20 right-20 w-72 h-72 bg-[#b0825a] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-1000" />

      {/* Container principal */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 max-w-6xl mx-auto p-6 rounded-2xl backdrop-blur-sm border"
          style={{ 
            backgroundColor: 'rgba(20, 20, 20, 0.8)',
            borderColor: 'rgba(176, 130, 90, 0.2)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
          }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-white">
                <Calculator className="inline-block w-8 h-8 mr-3 text-[#b0825a]" /> 
                Calculadora Trabalhista
              </h1>
              <p className="text-lg sm:text-xl font-light opacity-80" style={{ color: '#d4d4d4' }}>
                Cálculos precisos de rescisão, horas extras e FGTS automatizados.
              </p>
            </div>
            <Link 
              href="/dashboard"
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

        {/* Grid Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {/* Formulário */}
          <div className="p-6 rounded-2xl backdrop-blur-sm border"
            style={{ 
              backgroundColor: 'rgba(20, 20, 20, 0.8)',
              borderColor: 'rgba(176, 130, 90, 0.2)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
            }}>
            <h2 className="text-xl font-semibold text-white mb-4">Dados para Cálculo</h2>
            
            <div className="space-y-4">
              {/* Tipo de Cálculo */}
              <div>
                <label className="block text-sm font-medium mb-1 text-[#d4d4d4]">
                  Tipo de Cálculo <span className="text-red-500">*</span>
                </label>
                <select
                  value={tipoCalculo}
                  onChange={(e) => {
                    setTipoCalculo(e.target.value);
                    setResultado(null); // Limpa o resultado ao mudar o tipo de cálculo
                    // Limpa campos específicos ao mudar o tipo de cálculo
                    setHorasExtras('');
                    setDiasTrabalhados('');
                    setDataAdmissao('');
                    setDataDemissao('');
                  }}
                  className="w-full p-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-[#b0825a] focus:border-transparent appearance-none"
                  style={{ backgroundColor: 'rgba(40, 40, 40, 0.8)', borderColor: '#6e6d6b', color: '#ffffff' }}
                >
                  <option value="">Selecione o tipo</option>
                  <option value="rescisao">Rescisão Trabalhista</option>
                  <option value="horas-extras">Horas Extras</option>
                  <option value="fgts">FGTS</option>
                </select>
              </div>

              {/* Salário */}
              <div>
                <label className="block text-sm font-medium mb-1 text-[#d4d4d4]">
                  Salário Mensal <span className="text-red-500">*</span>
                </label>
                <input
                  type="text" // Alterado para text para permitir vírgulas
                  value={salario}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9,.]/g, ''); // Permite apenas números, vírgula e ponto
                    setSalario(value);
                  }}
                  placeholder="Ex: 2500,00"
                  className="w-full p-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-[#b0825a] focus:border-transparent placeholder-gray-400"
                  style={{ backgroundColor: 'rgba(40, 40, 40, 0.8)', borderColor: '#6e6d6b', color: '#ffffff' }}
                />
              </div>

              {/* Campos Condicionais */}
              {tipoCalculo === 'rescisao' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[#d4d4d4]">Dias Trabalhados no Mês da Rescisão</label>
                    <input
                      type="number"
                      value={diasTrabalhados}
                      onChange={(e) => setDiasTrabalhados(e.target.value)}
                      placeholder="Ex: 15"
                      className="w-full p-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-[#b0825a] focus:border-transparent placeholder-gray-400"
                      style={{ backgroundColor: 'rgba(40, 40, 40, 0.8)', borderColor: '#6e6d6b', color: '#ffffff' }}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-[#d4d4d4]">Data Admissão</label>
                      <input
                        type="date"
                        value={dataAdmissao}
                        onChange={(e) => setDataAdmissao(e.target.value)}
                        className="w-full p-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-[#b0825a] focus:border-transparent"
                        style={{ backgroundColor: 'rgba(40, 40, 40, 0.8)', borderColor: '#6e6d6b', color: '#ffffff' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-[#d4d4d4]">Data Demissão</label>
                      <input
                        type="date"
                        value={dataDemissao}
                        onChange={(e) => setDataDemissao(e.target.value)}
                        className="w-full p-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-[#b0825a] focus:border-transparent"
                        style={{ backgroundColor: 'rgba(40, 40, 40, 0.8)', borderColor: '#6e6d6b', color: '#ffffff' }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    *As datas de admissão/demissão são para referência e não influenciam o cálculo simplificado atual.
                  </p>
                </>
              )}

              {tipoCalculo === 'horas-extras' && (
                <div>
                  <label className="block text-sm font-medium mb-1 text-[#d4d4d4]">Quantidade de Horas Extras</label>
                  <input
                    type="text" // Alterado para text para permitir vírgulas
                    value={horasExtras}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9,.]/g, '');
                      setHorasExtras(value);
                    }}
                    placeholder="Ex: 40,5"
                    className="w-full p-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-[#b0825a] focus:border-transparent placeholder-gray-400"
                    style={{ backgroundColor: 'rgba(40, 40, 40, 0.8)', borderColor: '#6e6d6b', color: '#ffffff' }}
                  />
                </div>
              )}

              {/* Botão Calcular */}
              <button
                onClick={handleCalcular}
                disabled={loading || !tipoCalculo || !salario}
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
          <div className="p-6 rounded-2xl backdrop-blur-sm border"
            style={{ 
              backgroundColor: 'rgba(20, 20, 20, 0.8)',
              borderColor: 'rgba(176, 130, 90, 0.2)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
            }}>
            <h2 className="text-xl font-semibold text-white mb-4">Resultado do Cálculo</h2>
            
            {resultado ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(176, 130, 90, 0.1)' }}>
                  <h3 className="text-lg font-semibold text-[#b0825a] mb-3">{resultado.tipo}</h3>
                  
                  <div className="space-y-2">
                    {resultado.itens.map((item: ItemCalculo, index: number) => ( // AQUI: Tipagem corrigida
                      <div key={index} className="flex justify-between items-center py-2 border-b border-gray-700">
                        <span className="text-[#d4d4d4]">{item.nome}</span>
                        <span className="font-semibold text-white">{formatCurrency(item.valor)}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t-2 border-[#b0825a]">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-[#b0825a]">TOTAL:</span>
                      <span className="text-2xl font-bold text-[#b0825a]">{formatCurrency(resultado.total)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const conteudo = `CÁLCULO TRABALHISTA - ${resultado.tipo}\n\n` +
                      resultado.itens.map((item: ItemCalculo) => `${item.nome}: ${formatCurrency(item.valor)}`).join('\n') + // AQUI: Tipagem corrigida
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
                  className="w-full py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg"
                  style={{ 
                    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #15803d 100%)',
                    boxShadow: '0 10px 25px rgba(34, 197, 94, 0.3)',
                    color: '#ffffff'
                  }}
                >
                  <Download className="inline-block w-5 h-5 mr-2" />
                  Baixar Relatório
                </button>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" style={{ color: '#b0825a' }} />
                <p className="text-[#d4d4d4] text-lg">
                  Preencha os dados e clique em calcular para ver o resultado
                </p>
              </div>
            )}
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
      `}</style>
    </main>
  );
}
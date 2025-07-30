import { NextRequest, NextResponse } from 'next/server';
import { 
  collection, 
  getDocs} from 'firebase/firestore'; 
import { db } from '@/firebase/firestore';
import { FinanceiroHonorarios, FinanceiroDespesas, FinanceiroRecibos } from '@/types/financeiro'; // Importa as interfaces

// GET - Dashboard com métricas financeiras
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    // mes e ano são usados principalmente para o cálculo do fluxo de caixa
    // getMonth() retorna 0 para Janeiro, 1 para Fevereiro, etc.
    //eslint-disable-next-line
    const ano = parseInt(searchParams.get('ano') || new Date().getFullYear().toString());
    //eslint-disable-next-line
    const mes = parseInt(searchParams.get('mes') || new Date().getMonth().toString());
    // Buscar honorários (todos para cálculos gerais do dashboard)
    const honorariosSnapshot = await getDocs(collection(db, 'financeiro_honorarios'));
    const honorarios = honorariosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FinanceiroHonorarios[]; // Tipagem explícita

    // Buscar despesas (todas para cálculos gerais do dashboard)
    const despesasSnapshot = await getDocs(collection(db, 'financeiro_despesas'));
    const despesas = despesasSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FinanceiroDespesas[]; // Tipagem explícita

    // Buscar recibos (todos para cálculos gerais do dashboard)
    const recibosSnapshot = await getDocs(collection(db, 'financeiro_recibos'));
    const recibos = recibosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FinanceiroRecibos[]; // Tipagem explícita

    // Calcular métricas gerais
    const totalHonorariosPendentes = honorarios
      .filter(h => h.status === 'pendente')
      .reduce((acc, h) => acc + (h.valor || 0), 0);

    const totalHonorariosPagos = honorarios
      .filter(h => h.status === 'pago')
      .reduce((acc, h) => acc + (h.valor || 0), 0);

    const totalHonorariosAtrasados = honorarios
      .filter(h => h.status === 'atrasado')
      .reduce((acc, h) => acc + (h.valor || 0), 0);

    const totalDespesasPendentes = despesas
      .filter(d => d.status === 'pendente')
      .reduce((acc, d) => acc + (d.valor || 0), 0);

    const totalDespesasPagas = despesas
      .filter(d => d.status === 'pago')
      .reduce((acc, d) => acc + (d.valor || 0), 0);

    // Métricas por tipo de honorário
    const honorariosPorTipo = {
      contratual: honorarios.filter(h => h.tipoHonorario === 'contratual').reduce((acc, h) => acc + (h.valor || 0), 0),
      sucumbencial: honorarios.filter(h => h.tipoHonorario === 'sucumbencial').reduce((acc, h) => acc + (h.valor || 0), 0),
      exito: honorarios.filter(h => h.tipoHonorario === 'exito').reduce((acc, h) => acc + (h.valor || 0), 0)
    };

    // Métricas por categoria de despesa
    const despesasPorCategoria = {
      custas: despesas.filter(d => d.categoria === 'custas').reduce((acc, d) => acc + (d.valor || 0), 0),
      pericia: despesas.filter(d => d.categoria === 'pericia').reduce((acc, d) => acc + (d.valor || 0), 0),
      documentacao: despesas.filter(d => d.categoria === 'documentacao').reduce((acc, d) => acc + (d.valor || 0), 0),
      deslocamento: despesas.filter(d => d.categoria === 'deslocamento').reduce((acc, d) => acc + (d.valor || 0), 0),
      outras: despesas.filter(d => d.categoria === 'outras').reduce((acc, d) => acc + (d.valor || 0), 0)
    };

    // Clientes inadimplentes (honorários atrasados)
    const clientesInadimplentes = honorarios
      .filter(h => h.status === 'atrasado')
      .map(h => h.clienteNome)
      .filter((nome, index, self) => self.indexOf(nome) === index);

    // Receita líquida (honorários - despesas)
    const receitaLiquida = totalHonorariosPagos - totalDespesasPagas;

    // Fluxo de caixa dos últimos 6 meses (exemplo simplificado)
    const fluxoCaixa = [];
    for (let i = 5; i >= 0; i--) {
      const dataRef = new Date();
      dataRef.setMonth(dataRef.getMonth() - i);
      
      const mesRef = dataRef.getMonth();
      const anoRef = dataRef.getFullYear();
      
      const honorariosMes = honorarios
        .filter(h => {
          // Converte Timestamp para Date para usar getMonth e getFullYear
          const dataVenc = h.dataVencimento.toDate(); 
          return dataVenc.getMonth() === mesRef && dataVenc.getFullYear() === anoRef && h.status === 'pago';
        })
        .reduce((acc, h) => acc + (h.valor || 0), 0);

      const despesasMes = despesas
        .filter(d => {
          // Converte Timestamp para Date para usar getMonth e getFullYear
          const dataVenc = d.dataVencimento.toDate(); 
          return dataVenc.getMonth() === mesRef && dataVenc.getFullYear() === anoRef && d.status === 'pago';
        })
        .reduce((acc, d) => acc + (d.valor || 0), 0);

      fluxoCaixa.push({
        mes: dataRef.toLocaleDateString('pt-BR', { month: 'short' }),
        receitas: honorariosMes,
        despesas: despesasMes,
        liquido: honorariosMes - despesasMes
      });
    }

    const dashboard = {
      resumoFinanceiro: {
        totalReceitasPendentes: totalHonorariosPendentes,
        totalReceitasPagas: totalHonorariosPagos,
        totalReceitasAtrasadas: totalHonorariosAtrasados,
        totalDespesasPendentes,
        totalDespesasPagas,
        receitaLiquida,
        clientesInadimplentes: clientesInadimplentes.length
      },
      honorariosPorTipo,
      despesasPorCategoria,
      fluxoCaixa,
      indicadores: {
        totalHonorarios: honorarios.length,
        totalDespesas: despesas.length,
        totalRecibos: recibos.length,
        taxaRecebimento: totalHonorariosPagos > 0 ? 
          ((totalHonorariosPagos / (totalHonorariosPagos + totalHonorariosPendentes + totalHonorariosAtrasados)) * 100).toFixed(1) : 
          '0.0'
      },
      ultimasMovimentacoes: {
        honorarios: honorarios
          // Converte Timestamp para Date para ordenação
          .sort((a, b) => b.updatedAt.toDate().getTime() - a.updatedAt.toDate().getTime())
          .slice(0, 5),
        despesas: despesas
          // Converte Timestamp para Date para ordenação
          .sort((a, b) => b.updatedAt.toDate().getTime() - a.updatedAt.toDate().getTime())
          .slice(0, 5)
      }
    };

    return NextResponse.json({
      sucesso: true,
      dashboard,
      dataAtualizacao: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao gerar dashboard financeiro:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao gerar dashboard financeiro',
        sucesso: false
      },
      { status: 500 }
    );
  }
}
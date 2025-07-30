import { NextRequest, NextResponse } from 'next/server';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  deleteDoc, 
  Timestamp, // Importado Timestamp
  CollectionReference, // Importado para tipagem
  DocumentData,       // Importado para tipagem
  Query               // Importado para tipagem
} from 'firebase/firestore'; 
import { db } from '@/firebase/firestore';
import { DespesaApiData, FinanceiroDespesas } from '@/types/financeiro'; // Importa as interfaces corretas

// GET - Buscar despesas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clienteId = searchParams.get('clienteId');
    const categoria = searchParams.get('categoria');
    const status = searchParams.get('status');

    const despesasRef = collection(db, 'financeiro_despesas'); // Usar const
    let q: Query<DocumentData> | CollectionReference<DocumentData> = despesasRef; // Tipagem mais específica

    // Aplica os filtros 'where' se existirem
    if (clienteId) {
      q = query(q, where('clienteId', '==', clienteId));
    }
    if (categoria) {
      q = query(q, where('categoria', '==', categoria));
    }
    if (status) {
      q = query(q, where('status', '==', status));
    }

    const snapshot = await getDocs(q);
    // Mapeia os documentos para a interface FinanceiroDespesas
    const despesas = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FinanceiroDespesas[]; 

    // ORDENAR AS DESPESAS EM MEMÓRIA APÓS FILTRAGEM
    // Ordena por dataVencimento em ordem decrescente (mais recente primeiro)
    despesas.sort((a, b) => {
      // Converte Timestamp para Date para comparação
      const dateA = a.dataVencimento.toDate().getTime();
      const dateB = b.dataVencimento.toDate().getTime();
      return dateB - dateA; 
    });

    // Calcular totais (garantindo que valor seja um número)
    const totalGeral = despesas.reduce((acc, despesa) => acc + (despesa.valor || 0), 0);
    const totalPendente = despesas.filter(d => d.status === 'pendente').reduce((acc, despesa) => acc + (despesa.valor || 0), 0);
    const totalPago = despesas.filter(d => d.status === 'pago').reduce((acc, despesa) => acc + (despesa.valor || 0), 0);

    return NextResponse.json({
      sucesso: true,
      despesas,
      totais: {
        geral: totalGeral,
        pendente: totalPendente,
        pago: totalPago,
        quantidade: despesas.length
      }
    });

  } catch (error) {
    console.error('Erro ao buscar despesas:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao buscar despesas',
        sucesso: false
      },
      { status: 500 }
    );
  }
}

// POST - Criar nova despesa
export async function POST(request: NextRequest) {
  try {
    const body: DespesaApiData = await request.json(); // Usa DespesaApiData para o corpo da requisição

    // Validações básicas
    if (!body.categoria || !body.descricao || !body.valor || !body.dataVencimento) {
      return NextResponse.json(
        { 
          error: 'Dados obrigatórios faltando (categoria, descrição, valor, dataVencimento)',
          sucesso: false
        },
        { status: 400 }
      );
    }

    // Cria o objeto FinanceiroDespesas para salvar no Firestore
    const novaDespesa: Omit<FinanceiroDespesas, 'id'> = {
      ...body,
      // Converte strings de data para objetos Timestamp antes de salvar no Firestore
      dataVencimento: Timestamp.fromDate(new Date(body.dataVencimento)),
      dataPagamento: body.dataPagamento ? Timestamp.fromDate(new Date(body.dataPagamento)) : null,
      status: body.status || 'pendente', // Garante um status padrão
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date())
    };

    const docRef = await addDoc(collection(db, 'financeiro_despesas'), novaDespesa);

    return NextResponse.json({
      sucesso: true,
      id: docRef.id,
      message: 'Despesa criada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao criar despesa:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao criar despesa',
        sucesso: false
      },
      { status: 500 }
    );
  }
}

// PUT - Atualizar despesa
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    // Desestrutura o body, separando id e os campos de data que precisam de conversão
    const { id, dataVencimento, dataPagamento, ...restOfDadosAtualizacao } = body as DespesaApiData & { id: string };

    if (!id) {
      return NextResponse.json(
        { 
          error: 'ID da despesa é obrigatório',
          sucesso: false
        },
        { status: 400 }
      );
    }

    // Cria o objeto com os dados para atualizar, já convertendo as datas
    const dadosParaAtualizar: Partial<Omit<FinanceiroDespesas, 'id' | 'createdAt'>> = {
      ...restOfDadosAtualizacao, // Espalha as outras propriedades
      updatedAt: Timestamp.fromDate(new Date()), // updatedAt já convertido
    };

    // Converte dataVencimento para Timestamp se existir
    if (dataVencimento) {
      dadosParaAtualizar.dataVencimento = Timestamp.fromDate(new Date(dataVencimento));
    }

    // Converte dataPagamento para Timestamp ou define como null se existir
    if (dataPagamento === '') {
      dadosParaAtualizar.dataPagamento = null;
    } else if (dataPagamento) {
      dadosParaAtualizar.dataPagamento = Timestamp.fromDate(new Date(dataPagamento));
    }

    await updateDoc(doc(db, 'financeiro_despesas', id), dadosParaAtualizar);

    return NextResponse.json({
      sucesso: true,
      message: 'Despesa atualizada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar despesa:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao atualizar despesa',
        sucesso: false
      },
      { status: 500 }
    );
  }
}

// DELETE - Deletar despesa
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { 
          error: 'ID da despesa é obrigatório',
          sucesso: false
        },
        { status: 400 }
      );
    }

    await deleteDoc(doc(db, 'financeiro_despesas', id));

    return NextResponse.json({
      sucesso: true,
      message: 'Despesa deletada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar despesa:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao deletar despesa',
        sucesso: false
      },
      { status: 500 }
    );
  }
}
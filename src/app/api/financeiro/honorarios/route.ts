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
  Timestamp,
  CollectionReference, // Importado para tipagem
  DocumentData,       // Importado para tipagem
  Query               // Importado para tipagem
} from 'firebase/firestore'; 
import { db } from '@/firebase/firestore';
import { HonorarioApiData, FinanceiroHonorarios } from '@/types/financeiro';

// GET - Buscar honorários
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clienteId = searchParams.get('clienteId');
    const status = searchParams.get('status');

    // Correção 1: Usar 'const' para honorariosRef, pois não é reatribuído
    const honorariosRef = collection(db, 'financeiro_honorarios');
    
    // Correção 2: Tipagem mais específica para 'q' em vez de 'any'
    let q: Query<DocumentData> | CollectionReference<DocumentData> = honorariosRef; 

    // Aplica os filtros 'where' se existirem
    if (clienteId) {
      q = query(q, where('clienteId', '==', clienteId));
    }
    if (status) {
      q = query(q, where('status', '==', status));
    }

    const snapshot = await getDocs(q);
    // Mapeia os documentos para a interface FinanceiroHonorarios
    const honorarios = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FinanceiroHonorarios[]; 

    // ORDENAR OS HONORÁRIOS EM MEMÓRIA APÓS FILTRAGEM
    // Ordena por dataVencimento em ordem decrescente (mais recente primeiro)
    honorarios.sort((a, b) => {
      // Converte Timestamp para Date para comparação
      const dateA = a.dataVencimento.toDate().getTime();
      const dateB = b.dataVencimento.toDate().getTime();
      return dateB - dateA; 
    });

    return NextResponse.json({
      sucesso: true,
      honorarios,
      total: honorarios.length
    });

  } catch (error) {
    console.error('Erro ao buscar honorários:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao buscar honorários',
        sucesso: false
      },
      { status: 500 }
    );
  }
}

// POST - Criar novo honorário
export async function POST(request: NextRequest) {
  try {
    const body: HonorarioApiData = await request.json(); // Usa HonorarioApiData para o corpo da requisição

    // Validações básicas
    if (!body.clienteId || !body.clienteNome || !body.valor || !body.dataVencimento || !body.tipoHonorario || !body.descricao) {
      return NextResponse.json(
        { 
          error: 'Dados obrigatórios faltando: clienteId, clienteNome, valor, dataVencimento, tipoHonorario, descricao',
          sucesso: false
        },
        { status: 400 }
      );
    }

    // Cria o objeto FinanceiroHonorarios para salvar no Firestore
    const novoHonorario: Omit<FinanceiroHonorarios, 'id'> = {
      ...body,
      // Converte strings de data para objetos Timestamp antes de salvar no Firestore
      dataVencimento: Timestamp.fromDate(new Date(body.dataVencimento)),
      dataPagamento: body.dataPagamento ? Timestamp.fromDate(new Date(body.dataPagamento)) : null,
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date())
    };

    const docRef = await addDoc(collection(db, 'financeiro_honorarios'), novoHonorario);

    return NextResponse.json({
      sucesso: true,
      id: docRef.id,
      message: 'Honorário criado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao criar honorário:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao criar honorário',
        sucesso: false
      },
      { status: 500 }
    );
  }
}

// PUT - Atualizar honorário
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    // Desestrutura o body, separando id e os campos de data que precisam de conversão
    const { id, dataVencimento, dataPagamento, ...restOfDadosAtualizacao } = body as HonorarioApiData & { id: string };

    if (!id) {
      return NextResponse.json(
        { 
          error: 'ID do honorário é obrigatório',
          sucesso: false
        },
        { status: 400 }
      );
    }

    // Cria o objeto com os dados para atualizar, já convertendo as datas
    const dadosParaAtualizar: Partial<Omit<FinanceiroHonorarios, 'id' | 'createdAt'>> = {
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

    await updateDoc(doc(db, 'financeiro_honorarios', id), dadosParaAtualizar);

    return NextResponse.json({
      sucesso: true,
      message: 'Honorário atualizado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar honorário:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao atualizar honorário',
        sucesso: false
      },
      { status: 500 }
    );
  }
}

// DELETE - Deletar honorário
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { 
          error: 'ID do honorário é obrigatório',
          sucesso: false
        },
        { status: 400 }
      );
    }

    await deleteDoc(doc(db, 'financeiro_honorarios', id));

    return NextResponse.json({
      sucesso: true,
      message: 'Honorário deletado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar honorário:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao deletar honorário',
        sucesso: false
      },
      { status: 500 }
    );
  }
}
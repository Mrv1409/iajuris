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
  CollectionReference,
  DocumentData,
  Query,
  getDoc
} from 'firebase/firestore'; 
import { db } from '@/firebase/firestore';
import { DespesaApiData, FinanceiroDespesas } from '@/types/financeiro';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

// Configuração do isolamento híbrido
const OWNER_EMAIL = 'marvincosta321@gmail.com';

// GET - Buscar despesas
export async function GET(request: NextRequest) {
  try {
    // 🔐 AUTENTICAÇÃO E ISOLAMENTO
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado', sucesso: false }, { status: 401 });
    }

    const isOwnerMVP = session.user.email === OWNER_EMAIL;
    const userClientId = isOwnerMVP ? OWNER_EMAIL : session.user.id;

    // 📋 PARÂMETROS DA REQUISIÇÃO
    const { searchParams } = new URL(request.url);
    const clienteId = searchParams.get('clienteId');
    const categoria = searchParams.get('categoria');
    const status = searchParams.get('status');

    const despesasRef = collection(db, 'financeiro_despesas');
    let q: Query<DocumentData> | CollectionReference<DocumentData> = despesasRef;

    // 🎯 ISOLAMENTO HÍBRIDO - FILTRO PRINCIPAL
    if (isOwnerMVP) {
      // Owner vê tudo, mas pode filtrar por cliente específico se solicitado
      if (clienteId) {
        q = query(q, where('clienteId', '==', clienteId));
      }
    } else {
      // Usuários normais só veem seus próprios dados
      q = query(q, where('clienteId', '==', userClientId));
    }

    // Filtros adicionais
    if (categoria) {
      q = query(q, where('categoria', '==', categoria));
    }
    if (status) {
      q = query(q, where('status', '==', status));
    }

    const snapshot = await getDocs(q);
    const despesas = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FinanceiroDespesas[];

    // Ordenar por dataVencimento em ordem decrescente
    despesas.sort((a, b) => {
      const dateA = a.dataVencimento.toDate().getTime();
      const dateB = b.dataVencimento.toDate().getTime();
      return dateB - dateA;
    });

    // Calcular totais
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
      { error: 'Erro ao buscar despesas', sucesso: false },
      { status: 500 }
    );
  }
}

// POST - Criar nova despesa
export async function POST(request: NextRequest) {
  try {
    // 🔐 AUTENTICAÇÃO E ISOLAMENTO
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado', sucesso: false }, { status: 401 });
    }

    const isOwnerMVP = session.user.email === OWNER_EMAIL;
    const userClientId = isOwnerMVP ? OWNER_EMAIL : session.user.id;

    const body: DespesaApiData = await request.json();

    // Validações básicas
    if (!body.clienteId || !body.categoria || !body.descricao || !body.valor || !body.dataVencimento) {
      return NextResponse.json(
        { 
          error: 'Dados obrigatórios faltando: clienteId, categoria, descrição, valor, dataVencimento',
          sucesso: false
        },
        { status: 400 }
      );
    }

    // 🛡️ GUARD DE SEGURANÇA - ISOLAMENTO
    if (!isOwnerMVP && body.clienteId !== userClientId) {
      return NextResponse.json(
        { error: 'Acesso negado: você só pode criar despesas para seu próprio cliente', sucesso: false },
        { status: 403 }
      );
    }

    // Cria o objeto FinanceiroDespesas para salvar no Firestore
    const novaDespesa: Omit<FinanceiroDespesas, 'id'> = {
      ...body,
      dataVencimento: Timestamp.fromDate(new Date(body.dataVencimento)),
      dataPagamento: body.dataPagamento ? Timestamp.fromDate(new Date(body.dataPagamento)) : null,
      status: body.status || 'pendente',
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
      { error: 'Erro ao criar despesa', sucesso: false },
      { status: 500 }
    );
  }
}

// PUT - Atualizar despesa
export async function PUT(request: NextRequest) {
  try {
    // 🔐 AUTENTICAÇÃO E ISOLAMENTO
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado', sucesso: false }, { status: 401 });
    }

    const isOwnerMVP = session.user.email === OWNER_EMAIL;
    const userClientId = isOwnerMVP ? OWNER_EMAIL : session.user.id;

    const body = await request.json();
    const { id, dataVencimento, dataPagamento, ...restOfDadosAtualizacao } = body as DespesaApiData & { id: string };

    if (!id) {
      return NextResponse.json(
        { error: 'ID da despesa é obrigatório', sucesso: false },
        { status: 400 }
      );
    }

    // 🛡️ GUARD DE SEGURANÇA - Verificar se a despesa pertence ao usuário
    if (!isOwnerMVP) {
      const despesaRef = doc(db, 'financeiro_despesas', id);
      const despesaDoc = await getDoc(despesaRef);
      
      if (!despesaDoc.exists()) {
        return NextResponse.json(
          { error: 'Despesa não encontrada', sucesso: false },
          { status: 404 }
        );
      }

      const despesaData = despesaDoc.data() as FinanceiroDespesas;
      if (despesaData.clienteId !== userClientId) {
        return NextResponse.json(
          { error: 'Acesso negado: você só pode atualizar suas próprias despesas', sucesso: false },
          { status: 403 }
        );
      }
    }

    // Cria o objeto com os dados para atualizar
    const dadosParaAtualizar: Partial<Omit<FinanceiroDespesas, 'id' | 'createdAt'>> = {
      ...restOfDadosAtualizacao,
      updatedAt: Timestamp.fromDate(new Date()),
    };

    if (dataVencimento) {
      dadosParaAtualizar.dataVencimento = Timestamp.fromDate(new Date(dataVencimento));
    }

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
      { error: 'Erro ao atualizar despesa', sucesso: false },
      { status: 500 }
    );
  }
}

// DELETE - Deletar despesa
export async function DELETE(request: NextRequest) {
  try {
    // 🔐 AUTENTICAÇÃO E ISOLAMENTO
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado', sucesso: false }, { status: 401 });
    }

    const isOwnerMVP = session.user.email === OWNER_EMAIL;
    const userClientId = isOwnerMVP ? OWNER_EMAIL : session.user.id;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID da despesa é obrigatório', sucesso: false },
        { status: 400 }
      );
    }

    // 🛡️ GUARD DE SEGURANÇA - Verificar se a despesa pertence ao usuário
    if (!isOwnerMVP) {
      const despesaRef = doc(db, 'financeiro_despesas', id);
      const despesaDoc = await getDoc(despesaRef);
      
      if (!despesaDoc.exists()) {
        return NextResponse.json(
          { error: 'Despesa não encontrada', sucesso: false },
          { status: 404 }
        );
      }

      const despesaData = despesaDoc.data() as FinanceiroDespesas;
      if (despesaData.clienteId !== userClientId) {
        return NextResponse.json(
          { error: 'Acesso negado: você só pode deletar suas próprias despesas', sucesso: false },
          { status: 403 }
        );
      }
    }

    await deleteDoc(doc(db, 'financeiro_despesas', id));

    return NextResponse.json({
      sucesso: true,
      message: 'Despesa deletada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar despesa:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar despesa', sucesso: false },
      { status: 500 }
    );
  }
}
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
import { HonorarioApiData, FinanceiroHonorarios } from '@/types/financeiro';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

// Configuração do isolamento híbrido
const OWNER_EMAIL = 'marvincosta321@gmail.com';

// GET - Buscar honorários
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
    const status = searchParams.get('status');

    const honorariosRef = collection(db, 'financeiro_honorarios');
    let q: Query<DocumentData> | CollectionReference<DocumentData> = honorariosRef;

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
    if (status) {
      q = query(q, where('status', '==', status));
    }

    const snapshot = await getDocs(q);
    const honorarios = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FinanceiroHonorarios[];

    // Ordenar por dataVencimento em ordem decrescente
    honorarios.sort((a, b) => {
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
      { error: 'Erro ao buscar honorários', sucesso: false },
      { status: 500 }
    );
  }
}

// POST - Criar novo honorário
export async function POST(request: NextRequest) {
  try {
    // 🔐 AUTENTICAÇÃO E ISOLAMENTO
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado', sucesso: false }, { status: 401 });
    }

    const isOwnerMVP = session.user.email === OWNER_EMAIL;
    const userClientId = isOwnerMVP ? OWNER_EMAIL : session.user.id;

    const body: HonorarioApiData = await request.json();

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

    // 🛡️ GUARD DE SEGURANÇA - ISOLAMENTO
    if (!isOwnerMVP && body.clienteId !== userClientId) {
      return NextResponse.json(
        { error: 'Acesso negado: você só pode criar honorários para seu próprio cliente', sucesso: false },
        { status: 403 }
      );
    }

    // Cria o objeto FinanceiroHonorarios para salvar no Firestore
    const novoHonorario: Omit<FinanceiroHonorarios, 'id'> = {
      ...body,
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
      { error: 'Erro ao criar honorário', sucesso: false },
      { status: 500 }
    );
  }
}

// PUT - Atualizar honorário
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
    const { id, dataVencimento, dataPagamento, ...restOfDadosAtualizacao } = body as HonorarioApiData & { id: string };

    if (!id) {
      return NextResponse.json(
        { error: 'ID do honorário é obrigatório', sucesso: false },
        { status: 400 }
      );
    }

    // 🛡️ GUARD DE SEGURANÇA - Verificar se o honorário pertence ao usuário
    if (!isOwnerMVP) {
      const honorarioRef = doc(db, 'financeiro_honorarios', id);
      const honorarioDoc = await getDoc(honorarioRef);
      
      if (!honorarioDoc.exists()) {
        return NextResponse.json(
          { error: 'Honorário não encontrado', sucesso: false },
          { status: 404 }
        );
      }

      const honorarioData = honorarioDoc.data() as FinanceiroHonorarios;
      if (honorarioData.clienteId !== userClientId) {
        return NextResponse.json(
          { error: 'Acesso negado: você só pode atualizar seus próprios honorários', sucesso: false },
          { status: 403 }
        );
      }
    }

    // Cria o objeto com os dados para atualizar
    const dadosParaAtualizar: Partial<Omit<FinanceiroHonorarios, 'id' | 'createdAt'>> = {
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

    await updateDoc(doc(db, 'financeiro_honorarios', id), dadosParaAtualizar);

    return NextResponse.json({
      sucesso: true,
      message: 'Honorário atualizado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar honorário:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar honorário', sucesso: false },
      { status: 500 }
    );
  }
}

// DELETE - Deletar honorário
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
        { error: 'ID do honorário é obrigatório', sucesso: false },
        { status: 400 }
      );
    }

    // 🛡️ GUARD DE SEGURANÇA - Verificar se o honorário pertence ao usuário
    if (!isOwnerMVP) {
      const honorarioRef = doc(db, 'financeiro_honorarios', id);
      const honorarioDoc = await getDoc(honorarioRef);
      
      if (!honorarioDoc.exists()) {
        return NextResponse.json(
          { error: 'Honorário não encontrado', sucesso: false },
          { status: 404 }
        );
      }

      const honorarioData = honorarioDoc.data() as FinanceiroHonorarios;
      if (honorarioData.clienteId !== userClientId) {
        return NextResponse.json(
          { error: 'Acesso negado: você só pode deletar seus próprios honorários', sucesso: false },
          { status: 403 }
        );
      }
    }

    await deleteDoc(doc(db, 'financeiro_honorarios', id));

    return NextResponse.json({
      sucesso: true,
      message: 'Honorário deletado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar honorário:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar honorário', sucesso: false },
      { status: 500 }
    );
  }
}
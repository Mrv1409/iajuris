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
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/firestore';
import { ReciboApiData, FinanceiroRecibos } from '@/types/financeiro';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

// Configuração do isolamento híbrido
const OWNER_EMAIL = 'marvincosta321@gmail.com';

// GET - Buscar recibos
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

    const recibosRef = collection(db, 'financeiro_recibos');
    let q: Query<DocumentData> | CollectionReference<DocumentData> = recibosRef;

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
    const recibos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FinanceiroRecibos[];

    // Ordenar por dataEmissao em ordem decrescente
    recibos.sort((a, b) => {
      const dateA = a.dataEmissao.toDate().getTime();
      const dateB = b.dataEmissao.toDate().getTime();
      return dateB - dateA;
    });

    // Calcular totais
    const totalGeral = recibos.reduce((acc, recibo) => acc + (recibo.valorTotal || 0), 0);
    const totalEmitidos = recibos.filter(r => r.status === 'emitido').reduce((acc, recibo) => acc + (recibo.valorTotal || 0), 0);
    const totalCancelados = recibos.filter(r => r.status === 'cancelado').reduce((acc, recibo) => acc + (recibo.valorTotal || 0), 0);

    return NextResponse.json({
      sucesso: true,
      recibos,
      totais: {
        geral: totalGeral,
        emitidos: totalEmitidos,
        cancelados: totalCancelados,
        quantidade: recibos.length
      }
    });

  } catch (error) {
    console.error('Erro ao buscar recibos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar recibos', sucesso: false },
      { status: 500 }
    );
  }
}

// POST - Criar novo recibo
export async function POST(request: NextRequest) {
  try {
    // 🔐 AUTENTICAÇÃO E ISOLAMENTO
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado', sucesso: false }, { status: 401 });
    }

    const isOwnerMVP = session.user.email === OWNER_EMAIL;
    const userClientId = isOwnerMVP ? OWNER_EMAIL : session.user.id;

    const body: ReciboApiData = await request.json();

    // Validações básicas
    if (!body.clienteId || !body.clienteNome || !body.valorTotal || !body.dataEmissao || !body.servicos || body.servicos.length === 0) {
      return NextResponse.json(
        { 
          error: 'Dados obrigatórios faltando: clienteId, clienteNome, valorTotal, dataEmissao, servicos',
          sucesso: false
        },
        { status: 400 }
      );
    }

    // 🛡️ GUARD DE SEGURANÇA - ISOLAMENTO
    if (!isOwnerMVP && body.clienteId !== userClientId) {
      return NextResponse.json(
        { error: 'Acesso negado: você só pode criar recibos para seu próprio cliente', sucesso: false },
        { status: 403 }
      );
    }

    // Cria o objeto FinanceiroRecibos para salvar no Firestore
    const novoRecibo: Omit<FinanceiroRecibos, 'id'> = {
        ...body,
        dataEmissao: Timestamp.fromDate(new Date(body.dataEmissao)),
        status: body.status || 'emitido',
        createdAt: Timestamp.fromDate(new Date()),
        numeroRecibo: ''
    };

    const docRef = await addDoc(collection(db, 'financeiro_recibos'), novoRecibo);

    return NextResponse.json({
      sucesso: true,
      id: docRef.id,
      message: 'Recibo criado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao criar recibo:', error);
    return NextResponse.json(
      { error: 'Erro ao criar recibo', sucesso: false },
      { status: 500 }
    );
  }
}

// PUT - Atualizar recibo
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
    const { id, dataEmissao, ...restOfDadosAtualizacao } = body as ReciboApiData & { id: string };

    if (!id) {
      return NextResponse.json(
        { error: 'ID do recibo é obrigatório', sucesso: false },
        { status: 400 }
      );
    }

    // 🛡️ GUARD DE SEGURANÇA - Verificar se o recibo pertence ao usuário
    if (!isOwnerMVP) {
      const reciboRef = doc(db, 'financeiro_recibos', id);
      const reciboDoc = await getDoc(reciboRef);
      
      if (!reciboDoc.exists()) {
        return NextResponse.json(
          { error: 'Recibo não encontrado', sucesso: false },
          { status: 404 }
        );
      }

      const reciboData = reciboDoc.data() as FinanceiroRecibos;
      if (reciboData.clienteId !== userClientId) {
        return NextResponse.json(
          { error: 'Acesso negado: você só pode atualizar seus próprios recibos', sucesso: false },
          { status: 403 }
        );
      }
    }

    // Cria o objeto com os dados para atualizar
    const dadosParaAtualizar: Partial<Omit<FinanceiroRecibos, 'id' | 'createdAt'>> = {
      ...restOfDadosAtualizacao,
    };

    if (dataEmissao) {
      dadosParaAtualizar.dataEmissao = Timestamp.fromDate(new Date(dataEmissao));
    }

    await updateDoc(doc(db, 'financeiro_recibos', id), dadosParaAtualizar);

    return NextResponse.json({
      sucesso: true,
      message: 'Recibo atualizado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar recibo:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar recibo', sucesso: false },
      { status: 500 }
    );
  }
}

// DELETE - Deletar recibo
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
        { error: 'ID do recibo é obrigatório', sucesso: false },
        { status: 400 }
      );
    }

    // 🛡️ GUARD DE SEGURANÇA - Verificar se o recibo pertence ao usuário
    if (!isOwnerMVP) {
      const reciboRef = doc(db, 'financeiro_recibos', id);
      const reciboDoc = await getDoc(reciboRef);
      
      if (!reciboDoc.exists()) {
        return NextResponse.json(
          { error: 'Recibo não encontrado', sucesso: false },
          { status: 404 }
        );
      }

      const reciboData = reciboDoc.data() as FinanceiroRecibos;
      if (reciboData.clienteId !== userClientId) {
        return NextResponse.json(
          { error: 'Acesso negado: você só pode deletar seus próprios recibos', sucesso: false },
          { status: 403 }
        );
      }
    }

    await deleteDoc(doc(db, 'financeiro_recibos', id));

    return NextResponse.json({
      sucesso: true,
      message: 'Recibo deletado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar recibo:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar recibo', sucesso: false },
      { status: 500 }
    );
  }
}
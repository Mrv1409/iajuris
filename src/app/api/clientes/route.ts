import { NextRequest, NextResponse } from 'next/server';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  query, 
  where,
  Timestamp,
  CollectionReference,
  DocumentData,
  Query
} from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

// Configuração do isolamento híbrido
const OWNER_EMAIL = 'marvincosta321@gmail.com';

// Interface atualizada com clientId (compatibilidade com frontend)
interface Cliente {
  id?: string;
  clienteId: string; // 🔑 Campo de isolamento
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  endereco: {
    cep: string;
    rua: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
  };
  dataNascimento: string;
  profissao: string;
  estadoCivil: 'solteiro' | 'casado' | 'divorciado' | 'viuvo' | 'uniao_estavel';
  observacoes?: string;
  status: 'ativo' | 'inativo' | 'pendente';
  dataAtualizacao: string;
  dataCadastro: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// GET - Listar clientes com isolamento
export async function GET(request: NextRequest) {
  try {
    // 🔐 AUTENTICAÇÃO E ISOLAMENTO
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado', sucesso: false }, { status: 401 });
    }

    const isOwnerMVP = session.user.email === OWNER_EMAIL;
    const userClienteId = isOwnerMVP ? OWNER_EMAIL : session.user.id;

    // 📋 PARÂMETROS DA REQUISIÇÃO
    const { searchParams } = new URL(request.url);
    const clienteId = searchParams.get('id');
    const searchTerm = searchParams.get('search');
    const status = searchParams.get('status');
    const filtroClienteId = searchParams.get('clienteId'); // Parâmetro do frontend

    // Buscar cliente específico por ID
    if (clienteId) {
      const clienteDoc = await getDoc(doc(db, 'clientes', clienteId));
      
      if (!clienteDoc.exists()) {
        return NextResponse.json(
          { error: 'Cliente não encontrado', sucesso: false },
          { status: 404 }
        );
      }

      const clienteData = clienteDoc.data() as Cliente;

      // 🛡️ GUARD DE SEGURANÇA - Verificar se o cliente pertence ao usuário
      if (!isOwnerMVP && clienteData.clienteId !== userClienteId) {
        return NextResponse.json(
          { error: 'Acesso negado: você só pode visualizar seus próprios clientes', sucesso: false },
          { status: 403 }
        );
      }

      const cliente = {
        id: clienteDoc.id,
        ...clienteData
      } as Cliente;

      return NextResponse.json({ cliente, sucesso: true });
    }

    // Listar clientes com filtros
    const clientesRef = collection(db, 'clientes');
    let q: Query<DocumentData> | CollectionReference<DocumentData> = clientesRef;

    // 🎯 ISOLAMENTO HÍBRIDO - FILTRO PRINCIPAL
    if (isOwnerMVP) {
      // Owner vê todos, mas pode filtrar por clienteId específico se solicitado
      if (filtroClienteId) {
        q = query(q, where('clienteId', '==', filtroClienteId));
      }
    } else {
      // Advogados só veem seus próprios clientes
      q = query(q, where('clienteId', '==', userClienteId));
    }

    // Filtros adicionais
    if (status && status !== 'todos') {
      q = query(q, where('status', '==', status));
    }

    const snapshot = await getDocs(q);
    let clientes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Cliente[];

    // ORDENAR OS CLIENTES EM MEMÓRIA POR dataCadastro (decrescente)
    clientes.sort((a, b) => {
      const dateA = new Date(a.dataCadastro).getTime();
      const dateB = new Date(b.dataCadastro).getTime();
      return dateB - dateA; // Ordem decrescente (mais recente primeiro)
    });

    // Aplicar filtro de busca se fornecido (em memória, após a ordenação)
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      clientes = clientes.filter(cliente => 
        cliente.nome.toLowerCase().includes(searchTermLower) ||
        cliente.cpf.includes(searchTerm) ||
        cliente.telefone.includes(searchTerm) ||
        cliente.email.toLowerCase().includes(searchTermLower)
      );
    }

    // Estatísticas
    const totalClientes = clientes.length;
    const clientesAtivos = clientes.filter(c => c.status === 'ativo').length;
    const clientesPendentes = clientes.filter(c => c.status === 'pendente').length;
    const clientesInativos = clientes.filter(c => c.status === 'inativo').length;

    return NextResponse.json({
      clientes,
      estatisticas: {
        total: totalClientes,
        ativos: clientesAtivos,
        pendentes: clientesPendentes,
        inativos: clientesInativos
      },
      sucesso: true
    });

  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar clientes', sucesso: false },
      { status: 500 }
    );
  }
}

// POST - Criar novo cliente
export async function POST(request: NextRequest) {
  try {
    // 🔐 AUTENTICAÇÃO E ISOLAMENTO
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado', sucesso: false }, { status: 401 });
    }

    const isOwnerMVP = session.user.email === OWNER_EMAIL;
    const userClienteId = isOwnerMVP ? OWNER_EMAIL : session.user.id;

    const body = await request.json();
    
    // Validações básicas
    if (!body.nome || !body.cpf || !body.telefone || !body.email) {
      return NextResponse.json(
        { error: 'Nome, CPF, telefone e email são obrigatórios', sucesso: false },
        { status: 400 }
      );
    }

    // 🛡️ GUARD DE SEGURANÇA - ISOLAMENTO
    // Se clienteId for fornecido no body, verificar permissão
    const clienteIdParaUsar = body.clienteId || userClienteId;
    if (!isOwnerMVP && clienteIdParaUsar !== userClienteId) {
      return NextResponse.json(
        { error: 'Acesso negado: você só pode criar clientes para seu próprio perfil', sucesso: false },
        { status: 403 }
      );
    }

    // Verificar se CPF já existe para este cliente (advogado)
    const cpfQuery = query(
      collection(db, 'clientes'),
      where('cpf', '==', body.cpf.replace(/\D/g, '')),
      where('clienteId', '==', clienteIdParaUsar)
    );
    const cpfSnapshot = await getDocs(cpfQuery);
    
    if (!cpfSnapshot.empty) {
      return NextResponse.json(
        { error: 'CPF já cadastrado em seus clientes', sucesso: false },
        { status: 409 }
      );
    }

    // Verificar se email já existe para este cliente (advogado)
    const emailQuery = query(
      collection(db, 'clientes'),
      where('email', '==', body.email.toLowerCase().trim()),
      where('clienteId', '==', clienteIdParaUsar)
    );
    const emailSnapshot = await getDocs(emailQuery);
    
    if (!emailSnapshot.empty) {
      return NextResponse.json(
        { error: 'Email já cadastrado em seus clientes', sucesso: false },
        { status: 409 }
      );
    }

    const agora = new Date();
    const novoCliente: Omit<Cliente, 'id'> = {
      clienteId: clienteIdParaUsar, // 🔑 Campo de isolamento
      nome: body.nome.trim(),
      cpf: body.cpf.replace(/\D/g, ''), // Remove caracteres não numéricos
      telefone: body.telefone.replace(/\D/g, ''),
      email: body.email.toLowerCase().trim(),
      endereco: {
        cep: body.endereco?.cep?.replace(/\D/g, '') || '',
        rua: body.endereco?.rua?.trim() || '',
        numero: body.endereco?.numero?.trim() || '',
        complemento: body.endereco?.complemento?.trim() || '',
        bairro: body.endereco?.bairro?.trim() || '',
        cidade: body.endereco?.cidade?.trim() || '',
        estado: body.endereco?.estado?.trim() || ''
      },
      dataNascimento: body.dataNascimento || '',
      profissao: body.profissao?.trim() || '',
      estadoCivil: body.estadoCivil || 'solteiro',
      observacoes: body.observacoes?.trim() || '',
      status: 'ativo',
      dataCadastro: agora.toISOString(),
      dataAtualizacao: agora.toISOString(),
      createdAt: Timestamp.fromDate(agora),
      updatedAt: Timestamp.fromDate(agora)
    };

    const docRef = await addDoc(collection(db, 'clientes'), novoCliente);
    
    return NextResponse.json({
      cliente: { id: docRef.id, ...novoCliente },
      sucesso: true,
      message: 'Cliente cadastrado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    return NextResponse.json(
      { error: 'Erro ao criar cliente', sucesso: false },
      { status: 500 }
    );
  }
}

// PUT - Atualizar cliente existente
export async function PUT(request: NextRequest) {
  try {
    // 🔐 AUTENTICAÇÃO E ISOLAMENTO
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado', sucesso: false }, { status: 401 });
    }

    const isOwnerMVP = session.user.email === OWNER_EMAIL;
    const userClienteId = isOwnerMVP ? OWNER_EMAIL : session.user.id;

    const body = await request.json();
    const { id, ...dadosAtualizacao } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID do cliente é obrigatório', sucesso: false },
        { status: 400 }
      );
    }

    // 🛡️ GUARD DE SEGURANÇA - Verificar se o cliente pertence ao usuário
    const clienteDoc = await getDoc(doc(db, 'clientes', id));
    if (!clienteDoc.exists()) {
      return NextResponse.json(
        { error: 'Cliente não encontrado', sucesso: false },
        { status: 404 }
      );
    }

    const clienteData = clienteDoc.data() as Cliente;
    if (!isOwnerMVP && clienteData.clienteId !== userClienteId) {
      return NextResponse.json(
        { error: 'Acesso negado: você só pode atualizar seus próprios clientes', sucesso: false },
        { status: 403 }
      );
    }

    // Se estiver atualizando CPF ou email, verificar duplicatas dentro do mesmo cliente (advogado)
    if (dadosAtualizacao.cpf) {
      const cpfQuery = query(
        collection(db, 'clientes'),
        where('cpf', '==', dadosAtualizacao.cpf.replace(/\D/g, '')),
        where('clienteId', '==', clienteData.clienteId)
      );
      const cpfSnapshot = await getDocs(cpfQuery);
      
      // Verificar se o CPF pertence a outro cliente do mesmo advogado
      const cpfExistente = cpfSnapshot.docs.find(doc => doc.id !== id);
      if (cpfExistente) {
        return NextResponse.json(
          { error: 'CPF já cadastrado para outro cliente seu', sucesso: false },
          { status: 409 }
        );
      }
    }

    if (dadosAtualizacao.email) {
      const emailQuery = query(
        collection(db, 'clientes'),
        where('email', '==', dadosAtualizacao.email.toLowerCase().trim()),
        where('clienteId', '==', clienteData.clienteId)
      );
      const emailSnapshot = await getDocs(emailQuery);
      
      // Verificar se o email pertence a outro cliente do mesmo advogado
      const emailExistente = emailSnapshot.docs.find(doc => doc.id !== id);
      if (emailExistente) {
        return NextResponse.json(
          { error: 'Email já cadastrado para outro cliente seu', sucesso: false },
          { status: 409 }
        );
      }
    }

    // Preparar dados para atualização
    const dadosLimpos = {
      ...dadosAtualizacao,
      dataAtualizacao: new Date().toISOString(),
      updatedAt: Timestamp.fromDate(new Date())
    };

    // Limpar campos se fornecidos
    if (dadosLimpos.cpf) {
      dadosLimpos.cpf = dadosLimpos.cpf.replace(/\D/g, '');
    }
    if (dadosLimpos.telefone) {
      dadosLimpos.telefone = dadosLimpos.telefone.replace(/\D/g, '');
    }
    if (dadosLimpos.email) {
      dadosLimpos.email = dadosLimpos.email.toLowerCase().trim();
    }

    // Remover clienteId dos dados de atualização (não deve ser alterado)
    delete dadosLimpos.clienteId;

    await updateDoc(doc(db, 'clientes', id), dadosLimpos);

    // Buscar cliente atualizado
    const clienteAtualizado = await getDoc(doc(db, 'clientes', id));
    const cliente = {
      id: clienteAtualizado.id,
      ...clienteAtualizado.data()
    } as Cliente;

    return NextResponse.json({
      cliente,
      sucesso: true,
      message: 'Cliente atualizado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar cliente', sucesso: false },
      { status: 500 }
    );
  }
}

// DELETE - Excluir cliente
export async function DELETE(request: NextRequest) {
  try {
    // 🔐 AUTENTICAÇÃO E ISOLAMENTO
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado', sucesso: false }, { status: 401 });
    }

    const isOwnerMVP = session.user.email === OWNER_EMAIL;
    const userClienteId = isOwnerMVP ? OWNER_EMAIL : session.user.id;

    const { searchParams } = new URL(request.url);
    const clienteIdParam = searchParams.get('id');

    if (!clienteIdParam) {
      return NextResponse.json(
        { error: 'ID do cliente é obrigatório', sucesso: false },
        { status: 400 }
      );
    }

    // 🛡️ GUARD DE SEGURANÇA - Verificar se o cliente pertence ao usuário
    const clienteDoc = await getDoc(doc(db, 'clientes', clienteIdParam));
    if (!clienteDoc.exists()) {
      return NextResponse.json(
        { error: 'Cliente não encontrado', sucesso: false },
        { status: 404 }
      );
    }

    const clienteData = clienteDoc.data() as Cliente;
    if (!isOwnerMVP && clienteData.clienteId !== userClienteId) {
      return NextResponse.json(
        { error: 'Acesso negado: você só pode deletar seus próprios clientes', sucesso: false },
        { status: 403 }
      );
    }

    await deleteDoc(doc(db, 'clientes', clienteIdParam));

    return NextResponse.json({
      sucesso: true,
      message: 'Cliente excluído com sucesso'
    });

  } catch (error) {
    console.error('Erro ao excluir cliente:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir cliente', sucesso: false },
      { status: 500 }
    );
  }
}
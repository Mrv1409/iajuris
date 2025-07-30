import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, query, where } from 'firebase/firestore'; // Removido orderBy do import
import { db } from '@/firebase/firestore';
import { DocumentData, Query } from 'firebase/firestore';

// Interfaces
interface Cliente {
  id?: string;
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
}

// GET - Listar todos os clientes ou buscar por ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clienteId = searchParams.get('id');
    const searchTerm = searchParams.get('search');
    const status = searchParams.get('status');

    if (clienteId) {
      // Buscar cliente específico por ID
      const clienteDoc = await getDoc(doc(db, 'clientes', clienteId));
      
      if (!clienteDoc.exists()) {
        return NextResponse.json(
          { error: 'Cliente não encontrado' },
          { status: 404 }
        );
      }

      const cliente = {
        id: clienteDoc.id,
        ...clienteDoc.data()
      } as Cliente;

      return NextResponse.json({ cliente, sucesso: true });
    }

    // Listar todos os clientes com filtros opcionais
    const clientesRef = collection(db, 'clientes');
    let clientesQuery: Query<DocumentData>;

    if (status && status !== 'todos') {
      // Se houver filtro de status, aplica o 'where'
      clientesQuery = query(clientesRef, where('status', '==', status));
    } else {
      // Caso contrário, pega todos os documentos da coleção
      clientesQuery = clientesRef;
    }

    const snapshot = await getDocs(clientesQuery);
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
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar novo cliente
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validações básicas
    if (!body.nome || !body.cpf || !body.telefone || !body.email) {
      return NextResponse.json(
        { error: 'Nome, CPF, telefone e email são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se CPF já existe
    const cpfQuery = query(
      collection(db, 'clientes'),
      where('cpf', '==', body.cpf)
    );
    const cpfSnapshot = await getDocs(cpfQuery);
    
    if (!cpfSnapshot.empty) {
      return NextResponse.json(
        { error: 'CPF já cadastrado no sistema' },
        { status: 409 }
      );
    }

    // Verificar se email já existe
    const emailQuery = query(
      collection(db, 'clientes'),
      where('email', '==', body.email)
    );
    const emailSnapshot = await getDocs(emailQuery);
    
    if (!emailSnapshot.empty) {
      return NextResponse.json(
        { error: 'Email já cadastrado no sistema' },
        { status: 409 }
      );
    }

    const novoCliente: Omit<Cliente, 'id'> = {
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
      dataCadastro: new Date().toISOString(),
      dataAtualizacao: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'clientes'), novoCliente);
    
    return NextResponse.json({
      cliente: { id: docRef.id, ...novoCliente },
      sucesso: true,
      mensagem: 'Cliente cadastrado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar cliente existente
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...dadosAtualizacao } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID do cliente é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se cliente existe
    const clienteDoc = await getDoc(doc(db, 'clientes', id));
    if (!clienteDoc.exists()) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    // Se estiver atualizando CPF ou email, verificar duplicatas
    if (dadosAtualizacao.cpf) {
      const cpfQuery = query(
        collection(db, 'clientes'),
        where('cpf', '==', dadosAtualizacao.cpf)
      );
      const cpfSnapshot = await getDocs(cpfQuery);
      
      // Verificar se o CPF pertence a outro cliente
      const cpfExistente = cpfSnapshot.docs.find(doc => doc.id !== id);
      if (cpfExistente) {
        return NextResponse.json(
          { error: 'CPF já cadastrado para outro cliente' },
          { status: 409 }
        );
      }
    }

    if (dadosAtualizacao.email) {
      const emailQuery = query(
        collection(db, 'clientes'),
        where('email', '==', dadosAtualizacao.email.toLowerCase())
      );
      const emailSnapshot = await getDocs(emailQuery);
      
      // Verificar se o email pertence a outro cliente
      const emailExistente = emailSnapshot.docs.find(doc => doc.id !== id);
      if (emailExistente) {
        return NextResponse.json(
          { error: 'Email já cadastrado para outro cliente' },
          { status: 409 }
        );
      }
    }

    // Preparar dados para atualização
    const dadosLimpos = {
      ...dadosAtualizacao,
      dataAtualizacao: new Date().toISOString()
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
      mensagem: 'Cliente atualizado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir cliente
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clienteId = searchParams.get('id');

    if (!clienteId) {
      return NextResponse.json(
        { error: 'ID do cliente é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se cliente existe
    const clienteDoc = await getDoc(doc(db, 'clientes', clienteId));
    if (!clienteDoc.exists()) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    await deleteDoc(doc(db, 'clientes', clienteId));

    return NextResponse.json({
      sucesso: true,
      mensagem: 'Cliente excluído com sucesso'
    });

  } catch (error) {
    console.error('Erro ao excluir cliente:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
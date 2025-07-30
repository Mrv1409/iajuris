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
  import { NextRequest, NextResponse } from 'next/server';
  import { db } from '@/firebase/firestore';
  import { ReciboApiData, FinanceiroRecibos } from '@/types/financeiro';
  
  // GET - Buscar recibos
  export async function GET(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url);
      const clienteId = searchParams.get('clienteId');
      const status = searchParams.get('status');
      // REMOVIDO: tipoRecibo, pois não existe na interface FinanceiroRecibos
  
      const recibosRef = collection(db, 'financeiro_recibos');
      let q: Query<DocumentData> | CollectionReference<DocumentData> = recibosRef; 
  
      // Aplica os filtros 'where' se existirem
      if (clienteId) {
        q = query(q, where('clienteId', '==', clienteId));
      }
      if (status) {
        q = query(q, where('status', '==', status));
      }
      // REMOVIDO: if (tipoRecibo) { q = query(q, where('tipoRecibo', '==', tipoRecibo)); }
  
      const snapshot = await getDocs(q);
      // Mapeia os documentos para a interface FinanceiroRecibos
      const recibos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FinanceiroRecibos[]; 
  
      // ORDENAR OS RECIBOS EM MEMÓRIA APÓS FILTRAGEM
      // Ordena por dataEmissao em ordem decrescente (mais recente primeiro)
      recibos.sort((a, b) => {
        // Converte Timestamp para Date para comparação
        const dateA = a.dataEmissao.toDate().getTime();
        const dateB = b.dataEmissao.toDate().getTime();
        return dateB - dateA; 
      });
  
      // Calcular totais (garantindo que valorTotal seja um número)
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
        { 
          error: 'Erro ao buscar recibos',
          sucesso: false
        },
        { status: 500 }
      );
    }
  }
  
  // POST - Criar novo recibo
  export async function POST(request: NextRequest) {
    try {
      const body: ReciboApiData = await request.json(); // Usa ReciboApiData para o corpo da requisição
  
      // Validações básicas
      // Ajustado validação para verificar se 'servicos' existe e tem pelo menos um item
      if (!body.clienteId || !body.clienteNome || !body.valorTotal || !body.dataEmissao || !body.servicos || body.servicos.length === 0) {
        return NextResponse.json(
          { 
            error: 'Dados obrigatórios faltando: clienteId, clienteNome, valorTotal, dataEmissao, servicos',
            sucesso: false
          },
          { status: 400 }
        );
      }
  
      // Cria o objeto FinanceiroRecibos para salvar no Firestore
      const novoRecibo: Omit<FinanceiroRecibos, 'id'> = {
          ...body,
          // Converte strings de data para objetos Timestamp antes de salvar no Firestore
          dataEmissao: Timestamp.fromDate(new Date(body.dataEmissao)),
          status: body.status || 'emitido', // Garante um status padrão
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
        { 
          error: 'Erro ao criar recibo',
          sucesso: false
        },
        { status: 500 }
      );
    }
  }
  
  // PUT - Atualizar recibo
  export async function PUT(request: NextRequest) {
    try {
      const body = await request.json();
      // Desestrutura o body, separando id e os campos de data que precisam de conversão
      const { id, dataEmissao, ...restOfDadosAtualizacao } = body as ReciboApiData & { id: string };
  
      if (!id) {
        return NextResponse.json(
          { 
            error: 'ID do recibo é obrigatório',
            sucesso: false
          },
          { status: 400 }
        );
      }
  
      // Cria o objeto com os dados para atualizar, já convertendo as datas
      // REMOVIDO: 'updatedAt' da tipagem e do objeto, pois não existe na interface FinanceiroRecibos
      const dadosParaAtualizar: Partial<Omit<FinanceiroRecibos, 'id' | 'createdAt'>> = {
        ...restOfDadosAtualizacao, // Espalha as outras propriedades
      };
  
      // Converte dataEmissao para Timestamp se existir
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
        { 
          error: 'Erro ao atualizar recibo',
          sucesso: false
        },
        { status: 500 }
      );
    }
  }
  
  // DELETE - Deletar recibo
  export async function DELETE(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url);
      const id = searchParams.get('id');
  
      if (!id) {
        return NextResponse.json(
          { 
            error: 'ID do recibo é obrigatório',
            sucesso: false
          },
          { status: 400 }
        );
      }
  
      await deleteDoc(doc(db, 'financeiro_recibos', id));
  
      return NextResponse.json({
        sucesso: true,
        message: 'Recibo deletado com sucesso'
      });
  
    } catch (error) {
      console.error('Erro ao deletar recibo:', error);
      return NextResponse.json(
        { 
          error: 'Erro ao deletar recibo',
          sucesso: false
        },
        { status: 500 }
      );
    }
  }
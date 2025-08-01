import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, collection, query, orderBy, limit, where, getDocs } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';

// Configuração Firebase (use a mesma configuração)
const firebaseConfig = {
  // Suas configurações do Firebase
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const limitNum = parseInt(searchParams.get('limit') || '10');

    // Query base
    let q = query(
      collection(db, 'pdf_analyses'),
      orderBy('createdAt', 'desc'),
      limit(limitNum)
    );

    // Filtro por cliente se fornecido
    if (clientId) {
      q = query(
        collection(db, 'pdf_analyses'),
        where('clientId', '==', clientId),
        orderBy('createdAt', 'desc'),
        limit(limitNum)
      );
    }

    const querySnapshot = await getDocs(q);
    const analyses = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null
    }));

    return NextResponse.json({
      sucesso: true,
      analyses: analyses,
      total: analyses.length
    });

  } catch (error) {
    console.error('Erro ao buscar histórico de PDFs:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao buscar histórico',
        resposta: 'Erro ao carregar histórico de análises.'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const analysisId = searchParams.get('id');

    if (!analysisId) {
      return NextResponse.json(
        { error: 'ID da análise não fornecido' },
        { status: 400 }
      );
    }

    // Aqui você adicionaria a lógica para deletar do Firestore
    // e opcionalmente do Firebase Storage

    return NextResponse.json({
      sucesso: true,
      mensagem: 'Análise removida com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar análise:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao deletar análise',
        resposta: 'Erro ao remover análise.'
      },
      { status: 500 }
    );
  }
}
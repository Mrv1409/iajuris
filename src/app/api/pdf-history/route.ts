import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, deleteDoc, doc, orderBy, limit } from 'firebase/firestore';
import { db } from '@/firebase/firestore'; 

// Interface para garantir a tipagem do objeto de análise de PDF
interface PdfAnalysisData {
    clientId: string;
    resposta: string;
    sucesso: boolean;
    metadata: {
        documentId: string;
        fileName: string;
        analysisType: string;
        modelo: string;
        timestamp: string;
        fileSize: number;
        textLength: number;
    };
}

/**
 * Endpoint GET para buscar o histórico de análises de PDF de um cliente.
 * Recebe o clientId como parâmetro de busca e retorna as análises salvas.
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const clientId = searchParams.get('clientId');
        const limitNum = parseInt(searchParams.get('limit') || '10');

        if (!clientId) {
            return NextResponse.json(
                {
                    error: 'ID do cliente não fornecido',
                    resposta: 'ID do cliente é obrigatório para buscar o histórico.',
                    sucesso: false
                },
                { status: 400 }
            );
        }

        // Cria uma query para buscar as análises do cliente específico, ordenando por timestamp
        const q = query(
            collection(db, 'pdf_analysis'),
            where('clientId', '==', clientId),
            orderBy('timestamp', 'desc'), // Ordena as análises da mais nova para a mais antiga
            limit(limitNum)
        );

        const querySnapshot = await getDocs(q);
        
        const analyses: PdfAnalysisData[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data() as Omit<PdfAnalysisData, 'metadata'> & { metadata: Omit<PdfAnalysisData['metadata'], 'documentId'> & { timestamp: unknown } };
            
            // Adiciona o ID do documento e converte o timestamp do servidor para string
            const analysisItem = {
                ...data,
                metadata: {
                    ...data.metadata,
                    documentId: doc.id,
                    timestamp: data.metadata.timestamp,
                }
            };
            analyses.push(analysisItem);
        });

        console.log(`Histórico de PDFs buscado com sucesso para o cliente ${clientId}`);
        return NextResponse.json({
            sucesso: true,
            analyses: analyses,
            total: analyses.length,
            message: 'Histórico de análises carregado com sucesso.'
        });

    } catch (error) {
        console.error('Erro ao buscar histórico de PDFs:', error);
        return NextResponse.json(
            {
                error: 'Erro ao buscar histórico',
                resposta: 'Erro ao carregar histórico de análises.',
                sucesso: false
            },
            { status: 500 }
        );
    }
}

/**
 * Endpoint DELETE para remover uma análise específica.
 * Recebe o ID da análise como parâmetro de busca.
 */
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const analysisId = searchParams.get('id');

        if (!analysisId) {
            return NextResponse.json(
                { error: 'ID da análise não fornecido', sucesso: false },
                { status: 400 }
            );
        }

        const docRef = doc(db, 'pdf_analysis', analysisId);
        await deleteDoc(docRef);

        console.log(`Análise deletada com sucesso: ${analysisId}`);
        return NextResponse.json({
            sucesso: true,
            mensagem: 'Análise removida com sucesso.',
            removedId: analysisId,
        });

    } catch (error) {
        console.error('Erro ao deletar análise:', error);
        return NextResponse.json(
            {
                error: 'Erro ao deletar análise',
                resposta: 'Erro ao remover análise.',
                sucesso: false
            },
            { status: 500 }
        );
    }
}
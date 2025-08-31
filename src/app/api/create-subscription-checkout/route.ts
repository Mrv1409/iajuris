import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionService } from '@/services/subscription.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { advogadoId, email, name, plano, successUrl, cancelUrl } = body;

    // Validações básicas
    if (!advogadoId || !email || !name || !plano) {
      return NextResponse.json(
        { error: 'Dados obrigatórios: advogadoId, email, name, plano' },
        { status: 400 }
      );
    }

    if (!successUrl || !cancelUrl) {
      return NextResponse.json(
        { error: 'URLs de sucesso e cancelamento são obrigatórias' },
        { status: 400 }
      );
    }

    // Validar plano
    if (!['profissional', 'escritorio'].includes(plano)) {
      return NextResponse.json(
        { error: 'Plano inválido. Use: profissional ou escritorio' },
        { status: 400 }
      );
    }

    console.log('🔄 Criando sessão de checkout:', {
      advogadoId,
      email,
      name,
      plano,
      successUrl,
      cancelUrl
    });

    // Usar SubscriptionService para criar sessão (6 parâmetros separados)
    const session = await SubscriptionService.createCheckoutSession(
      advogadoId,
      email,
      name,
      plano,
      successUrl,
      cancelUrl
    );

    console.log('✅ Sessão criada com sucesso:', session.id);

    return NextResponse.json({ 
      url: session.url,
      sessionId: session.id 
    });

  } catch (error) {
    console.error('❌ Erro na API create-subscription-checkout:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}
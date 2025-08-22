// src/app/api/stripe/create-checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { SubscriptionService } from '@/services/subscription.service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { advogadoId, email, name, successUrl, cancelUrl } = await request.json();

    // Validar dados
    if (!advogadoId || !email || !name || !successUrl || !cancelUrl) {
      return NextResponse.json(
        { error: 'Dados obrigatórios faltando' },
        { status: 400 }
      );
    }

    // Verificar se o usuário da sessão é o mesmo do request
    if (session.user.id !== advogadoId) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }

    // Criar sessão de checkout
    const checkoutSession = await SubscriptionService.createCheckoutSession(
      advogadoId,
      email,
      name,
      successUrl,
      cancelUrl
    );

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url
    });

  } catch (error) {
    console.error('Erro ao criar checkout:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}


// src/app/api/subscription/status/route.ts
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

    const { userId } = await request.json();

    // Verificar se o usuário da sessão pode consultar este ID
    if (session.user.id !== userId) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const isActive = await SubscriptionService.isSubscriptionActive(userId);
    const subscription = await SubscriptionService.getSubscriptionStatus(userId);

    return NextResponse.json({
      isActive,
      subscription,
    });

  } catch (error) {
    console.error('Erro ao verificar status:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
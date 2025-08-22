// src/app/api/stripe/portal/route.ts
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

    const { returnUrl } = await request.json();

    const portalSession = await SubscriptionService.createCustomerPortal(
      session.user.id,
      returnUrl || `${process.env.NEXTAUTH_URL}/dashboard/leads/advogado`
    );

    return NextResponse.json({
      url: portalSession.url
    });

  } catch (error) {
    console.error('Erro ao criar portal:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
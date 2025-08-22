// app/api/create-checkout-session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe.config';

export async function POST(request: NextRequest) {
  try {
    const { priceId, planName, planPrice } = await request.json();

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID é obrigatório' },
        { status: 400 }
      );
    }

    if (!planName) {
      return NextResponse.json(
        { error: 'Nome do plano é obrigatório' },
        { status: 400 }
      );
    }

    if (!planPrice) {
      return NextResponse.json(
        { error: 'Preço do plano é obrigatório' },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${request.nextUrl.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/plano-empresa?canceled=true`,
      billing_address_collection: 'required',
      locale: 'pt-BR',
      subscription_data: {
        metadata: {
          plan: planName,
          priceId: priceId,
        },
      },
      metadata: {
        plan: planName,
        price: planPrice,
        priceId: priceId,
      },
    });

    console.log('💳 Checkout criado:', {
      sessionId: session.id,
      plano: planName,
      preco: planPrice,
      priceId: priceId
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error: unknown) {
    console.error('Erro ao criar checkout session:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe.config';
import { SubscriptionService } from '@/services/subscription.service';
import { Timestamp } from 'firebase/firestore';
import Stripe from 'stripe';

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = (await headers()).get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const advogadoId = session.metadata?.advogadoId;
        
        if (!advogadoId) {
          console.error('advogadoId não encontrado no metadata');
          break;
        }

        if (!session.subscription) {
          console.error('Subscription não encontrada na session');
          break;
        }

        // Buscar a subscription criada
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        
        await SubscriptionService.updateSubscriptionData(advogadoId, {
          status: 'active',
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: subscription.id,
          planId: subscription.items.data[0].price.id,
          cancelAtPeriodEnd: false,
          updatedAt: Timestamp.now(), // Usando Timestamp do Firebase
        });

        console.log('Assinatura ativada para:', advogadoId);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        
        //eslint-disable-next-line
        const subscriptionId = (invoice as any)['subscription'];
        
        if (!subscriptionId) {
          console.error('Subscription não encontrada na invoice');
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        
        if (subscription.metadata?.advogadoId) {
          await SubscriptionService.updateSubscriptionData(subscription.metadata.advogadoId, {
            status: 'active',
            updatedAt: Timestamp.now(),
          });
          
          console.log('Pagamento confirmado para:', subscription.metadata.advogadoId);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        
        //eslint-disable-next-line
        const subscriptionId = (invoice as any)['subscription'];
        
        if (!subscriptionId) {
          console.error('Subscription não encontrada na invoice');
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        
        if (subscription.metadata?.advogadoId) {
          await SubscriptionService.updateSubscriptionData(subscription.metadata.advogadoId, {
            status: 'past_due',
            updatedAt: Timestamp.now(),
          });
          
          console.log('Pagamento falhou para:', subscription.metadata.advogadoId);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        if (subscription.metadata?.advogadoId) {
          let status: 'active' | 'inactive' | 'canceled' | 'past_due' = 'active';
          
          switch (subscription.status) {
            case 'canceled':
              status = 'canceled';
              break;
            case 'past_due':
              status = 'past_due';
              break;
            case 'incomplete':
            case 'incomplete_expired':
            case 'unpaid':
              status = 'inactive';
              break;
            case 'active':
            case 'trialing':
              status = 'active';
              break;
            default:
              status = 'inactive';
          }

          await SubscriptionService.updateSubscriptionData(subscription.metadata.advogadoId, {
            status,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            updatedAt: Timestamp.now(),
          });
          
          console.log('Subscription atualizada para:', subscription.metadata.advogadoId, 'Status:', status);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        if (subscription.metadata?.advogadoId) {
          await SubscriptionService.updateSubscriptionData(subscription.metadata.advogadoId, {
            status: 'canceled',
            updatedAt: Timestamp.now(),
          });
          
          console.log('Subscription cancelada para:', subscription.metadata.advogadoId);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
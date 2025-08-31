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
        
        // Determinar o plano baseado no price_id
        const priceId = subscription.items.data[0].price.id;
        let planoAtual: 'profissional' | 'escritorio' = 'profissional';

        // Usar os price_ids corretos
        if (priceId === 'price_1RzQggDFq6ALe0I1LXKaaGLE') {
          planoAtual = 'escritorio'; // R$ 297
        } else if (priceId === 'price_1S0mgDDFq6ALe0I1KlKC1mrD') {
          planoAtual = 'profissional'; // R$ 247
        }

        // Usar método do SubscriptionService para obter limites
        const limites = SubscriptionService.getLimitesPlano(planoAtual);

        await SubscriptionService.updateSubscriptionData(advogadoId, {
          statusAssinatura: 'active',
          clienteStripeId: session.customer as string,
          assinaturaId: subscription.id,
          planoAtual: planoAtual,
          statusPagamento: 'paid',//eslint-disable-next-line
          dataFimAssinatura: new Date((subscription as any).current_period_end * 1000).toISOString(),
          limites: limites,
          usoMensal: {
            consultasIA: 0,
            pdfProcessados: 0,
            dataReset: new Date().toISOString()
          },
          cancelAtPeriodEnd: false,
          updatedAt: Timestamp.now(),
        });

        console.log('Assinatura ativada para:', advogadoId, 'Plano:', planoAtual);
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        
        if (subscription.metadata?.advogadoId) {
          // Se estiver em trial, marcar como trialing
          const status = subscription.status === 'trialing' ? 'trialing' : 'active';
          
          await SubscriptionService.updateSubscriptionData(subscription.metadata.advogadoId, {
            statusAssinatura: status,
            assinaturaId: subscription.id,
            dataFimTrial: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
            updatedAt: Timestamp.now(),
          });
          
          console.log('Subscription criada para:', subscription.metadata.advogadoId, 'Status:', status);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        //eslint-disable-next-line
        const subscriptionId = (invoice as any).subscription as string;
        
        if (!subscriptionId) {
          console.error('Subscription não encontrada na invoice');
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        
        if (subscription.metadata?.advogadoId) {
          await SubscriptionService.updateSubscriptionData(subscription.metadata.advogadoId, {
            statusAssinatura: 'active',
            statusPagamento: 'paid',//eslint-disable-next-line
            dataFimAssinatura: new Date((subscription as any).current_period_end * 1000).toISOString(),
            updatedAt: Timestamp.now(),
          });
          
          console.log('Pagamento confirmado para:', subscription.metadata.advogadoId);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        //eslint-disable-next-line
        const subscriptionId = (invoice as any).subscription as string;
        
        if (!subscriptionId) {
          console.error('Subscription não encontrada na invoice');
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        
        if (subscription.metadata?.advogadoId) {
          await SubscriptionService.updateSubscriptionData(subscription.metadata.advogadoId, {
            statusAssinatura: 'past_due',
            statusPagamento: 'failed',
            updatedAt: Timestamp.now(),
          });
          
          console.log('Pagamento falhou para:', subscription.metadata.advogadoId);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        if (subscription.metadata?.advogadoId) {
          let statusAssinatura: 'active' | 'inactive' | 'canceled' | 'past_due' | 'trialing' = 'active';
          
          switch (subscription.status) {
            case 'canceled':
              statusAssinatura = 'canceled';
              break;
            case 'past_due':
              statusAssinatura = 'past_due';
              break;
            case 'incomplete':
            case 'incomplete_expired':
            case 'unpaid':
              statusAssinatura = 'inactive';
              break;
            case 'trialing':
              statusAssinatura = 'trialing';
              break;
            case 'active':
              statusAssinatura = 'active';
              break;
            default:
              statusAssinatura = 'inactive';
          }

          await SubscriptionService.updateSubscriptionData(subscription.metadata.advogadoId, {
            statusAssinatura: statusAssinatura,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,//eslint-disable-next-line
            dataFimAssinatura: new Date((subscription as any).current_period_end * 1000).toISOString(),
            updatedAt: Timestamp.now(),
          });
          
          console.log('Subscription atualizada para:', subscription.metadata.advogadoId, 'Status:', statusAssinatura);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        if (subscription.metadata?.advogadoId) {
          await SubscriptionService.updateSubscriptionData(subscription.metadata.advogadoId, {
            statusAssinatura: 'canceled',
            statusPagamento: 'canceled',
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
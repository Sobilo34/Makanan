// @ts-ignore: Deno global is available in Deno runtime
declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response>) => void;
  env: { get: (key: string) => string | undefined };
};

import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Webhook signature verification failed';
    console.error('Webhook signature error:', message);
    return new Response(`Webhook Error: ${message}`, { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.payment_status !== 'paid') {
      return new Response(JSON.stringify({ received: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userId = session.metadata?.user_id;
    const planId = session.metadata?.plan_id;
    const credits = parseInt(session.metadata?.credits || '0', 10);
    const amountMyr = parseFloat(session.metadata?.amount_myr || '0');

    if (!userId || !planId) {
      console.error('Missing metadata in session:', session.id);
      return new Response('Missing metadata', { status: 400 });
    }

    try {
      // Use the existing atomic RPC to create subscription + wallet transaction
      const { data: result, error: rpcErr } = await supabase.rpc('process_subscription_payment', {
        p_user_id: userId,
        p_meal_plan_id: planId,
        p_credits: credits,
        p_amount_myr: amountMyr,
        p_payment_method: 'stripe',
      });

      if (rpcErr) {
        console.error('RPC error:', rpcErr);
        throw rpcErr;
      }

      const subscriptionId = result?.subscription_id;

      // Update the pending payment record to completed
      await supabase
        .from('payments')
        .update({
          status: 'completed',
          stripe_payment_intent_id: session.payment_intent as string,
          subscription_id: subscriptionId ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_session_id', session.id);

      console.log(`Subscription activated for user ${userId}, plan ${planId}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Subscription activation failed';
      console.error('Webhook processing error:', message);
      return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

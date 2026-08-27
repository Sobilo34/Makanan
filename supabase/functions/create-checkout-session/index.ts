import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response>) => void;
  env: {
    get: (key: string) => string | undefined;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      console.error('STRIPE_SECRET_KEY is not set in Edge Function secrets');
      return new Response(JSON.stringify({ error: 'Payment service not configured. Please contact support.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json();
    const { planId, planName, priceMyr, credits, userId, userEmail, successUrl, cancelUrl } = body;

    console.log('Checkout request:', { planId, planName, priceMyr, credits, userId, userEmail });

    if (!planId || !priceMyr || !userId || !userEmail) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id, full_name')
      .eq('id', userId)
      .single();

    let customerId: string | undefined = profile?.stripe_customer_id ?? undefined;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        name: profile?.full_name || userEmail,
        metadata: { supabase_user_id: userId },
      });
      customerId = customer.id;
      await supabase
        .from('user_profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }

    // Amount in smallest currency unit (sen for MYR)
    const amountSen = Math.round(parseFloat(String(priceMyr)) * 100);
    console.log('Amount in sen:', amountSen);

    // Determine payment methods — card is always available.
    // fpx and grabpay require explicit enablement in your Stripe Dashboard.
    // We attempt to include them but fall back to card-only if they cause errors.
    const paymentMethodTypes: Stripe.Checkout.SessionCreateParams.PaymentMethodType[] = ['card'];

    // Create Stripe Checkout Session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      payment_method_types: paymentMethodTypes,
      line_items: [
        {
          price_data: {
            currency: 'myr',
            product_data: {
              name: planName || 'Meal Plan',
              description: `${credits} meal credits — Makanan Student Meal Plan`,
            },
            unit_amount: amountSen,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: userId,
        plan_id: planId,
        credits: String(credits),
        amount_myr: String(priceMyr),
      },
    };

    console.log('Creating Stripe session with params:', JSON.stringify(sessionParams));

    const session = await stripe.checkout.sessions.create(sessionParams);

    console.log('Stripe session created:', session.id);

    // Pre-create a pending payment record
    const { error: insertError } = await supabase.from('payments').insert({
      user_id: userId,
      meal_plan_id: planId,
      amount_myr: parseFloat(String(priceMyr)),
      payment_method: 'stripe',
      status: 'pending',
      stripe_session_id: session.id,
      reference_code: session.id,
    });

    if (insertError) {
      console.error('Failed to insert payment record:', insertError);
      // Don't fail the checkout — the webhook will handle it
    }

    return new Response(JSON.stringify({ sessionId: session.id, url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Checkout session creation failed';
    console.error('create-checkout-session error:', err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

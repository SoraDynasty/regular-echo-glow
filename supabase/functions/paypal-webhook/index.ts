import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface PayPalWebhookEvent {
  event_type: string;
  resource: {
    id: string;
    custom_id?: string;
    subscriber?: {
      email_address: string;
    };
    billing_info?: {
      next_billing_time: string;
    };
    status?: string;
  };
}

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get PayPal credentials
    const paypalClientId = Deno.env.get('PAYPAL_CLIENT_ID');
    const paypalSecret = Deno.env.get('PAYPAL_SECRET');
    const webhookId = Deno.env.get('PAYPAL_WEBHOOK_ID');

    console.log('Received PayPal webhook request');

    // Get webhook headers for verification
    const headers = {
      'auth-algo': req.headers.get('paypal-auth-algo') || '',
      'cert-url': req.headers.get('paypal-cert-url') || '',
      'transmission-id': req.headers.get('paypal-transmission-id') || '',
      'transmission-sig': req.headers.get('paypal-transmission-sig') || '',
      'transmission-time': req.headers.get('paypal-transmission-time') || '',
    };

    const body = await req.json() as PayPalWebhookEvent;
    console.log('Webhook event type:', body.event_type);

    // Get PayPal access token
    const authResponse = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${paypalClientId}:${paypalSecret}`)}`,
      },
      body: 'grant_type=client_credentials',
    });

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    // Verify webhook signature
    const verifyResponse = await fetch('https://api-m.paypal.com/v1/notifications/verify-webhook-signature', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        auth_algo: headers['auth-algo'],
        cert_url: headers['cert-url'],
        transmission_id: headers['transmission-id'],
        transmission_sig: headers['transmission-sig'],
        transmission_time: headers['transmission-time'],
        webhook_id: webhookId,
        webhook_event: body,
      }),
    });

    const verifyData = await verifyResponse.json();
    console.log('Webhook verification status:', verifyData.verification_status);

    if (verifyData.verification_status !== 'SUCCESS') {
      console.error('Webhook verification failed');
      return new Response(
        JSON.stringify({ error: 'Webhook verification failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = body.resource.custom_id;
    const subscriptionId = body.resource.id;

    console.log('Processing event for user:', userId);

    // Handle different webhook events
    switch (body.event_type) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            started_at: new Date().toISOString(),
            paypal_subscription_id: subscriptionId,
          })
          .eq('user_id', userId);
        console.log('Subscription activated for user:', userId);
        break;

      case 'BILLING.SUBSCRIPTION.CANCELLED':
      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        await supabase
          .from('subscriptions')
          .update({
            status: 'inactive',
            expires_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
        console.log('Subscription cancelled/suspended for user:', userId);
        break;

      case 'BILLING.SUBSCRIPTION.EXPIRED':
        await supabase
          .from('subscriptions')
          .update({
            status: 'expired',
            expires_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
        console.log('Subscription expired for user:', userId);
        break;

      default:
        console.log('Unhandled event type:', body.event_type);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

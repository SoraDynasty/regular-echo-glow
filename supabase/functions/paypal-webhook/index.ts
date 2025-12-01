import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PayPalWebhookEvent {
  event_type: string;
  resource: {
    id: string;
    status: string;
    subscriber?: {
      email_address: string;
    };
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get PayPal credentials
    const clientId = Deno.env.get('PAYPAL_CLIENT_ID')!;
    const clientSecret = Deno.env.get('PAYPAL_SECRET')!;

    // Get webhook verification headers
    const transmissionId = req.headers.get('paypal-transmission-id');
    const transmissionTime = req.headers.get('paypal-transmission-time');
    const transmissionSig = req.headers.get('paypal-transmission-sig');
    const certUrl = req.headers.get('paypal-cert-url');
    const authAlgo = req.headers.get('paypal-auth-algo');
    const webhookId = Deno.env.get('PAYPAL_WEBHOOK_ID')!;

    const webhookData: PayPalWebhookEvent = await req.json();
    const webhookBody = JSON.stringify(webhookData);

    // Verify webhook signature
    console.log('Verifying PayPal webhook signature');
    
    // Get PayPal access token
    const authResponse = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!authResponse.ok) {
      console.error('Failed to get PayPal access token');
      return new Response(JSON.stringify({ error: 'Authentication failed' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { access_token } = await authResponse.json();

    // Verify webhook signature with PayPal
    const verifyResponse = await fetch('https://api-m.paypal.com/v1/notifications/verify-webhook-signature', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transmission_id: transmissionId,
        transmission_time: transmissionTime,
        cert_url: certUrl,
        auth_algo: authAlgo,
        transmission_sig: transmissionSig,
        webhook_id: webhookId,
        webhook_event: webhookData,
      }),
    });

    if (!verifyResponse.ok) {
      console.error('Webhook verification request failed');
      return new Response(JSON.stringify({ error: 'Verification request failed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const verificationResult = await verifyResponse.json();

    if (verificationResult.verification_status !== 'SUCCESS') {
      console.error('Webhook signature verification failed');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Webhook signature verified successfully');
    console.log('PayPal webhook received:', webhookData.event_type);

    const subscriptionId = webhookData.resource.id;
    const status = webhookData.resource.status;

    // Handle different webhook events
    switch (webhookData.event_type) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
      case 'BILLING.SUBSCRIPTION.UPDATED':
        await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            started_at: new Date().toISOString(),
          })
          .eq('paypal_subscription_id', subscriptionId);
        break;

      case 'BILLING.SUBSCRIPTION.CANCELLED':
      case 'BILLING.SUBSCRIPTION.SUSPENDED':
      case 'BILLING.SUBSCRIPTION.EXPIRED':
        await supabase
          .from('subscriptions')
          .update({
            status: 'inactive',
            expires_at: new Date().toISOString(),
          })
          .eq('paypal_subscription_id', subscriptionId);
        break;
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('PayPal webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

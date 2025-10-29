import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const paypalClientId = Deno.env.get('PAYPAL_CLIENT_ID');
    const paypalSecret = Deno.env.get('PAYPAL_SECRET');

    // Get PayPal access token
    const auth = btoa(`${paypalClientId}:${paypalSecret}`);
    const tokenResponse = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    const { access_token } = await tokenResponse.json();

    // Parse webhook event
    const event = await req.json();
    console.log('PayPal webhook event:', event.event_type);

    const subscriptionId = event.resource?.id;
    const userId = event.resource?.custom_id; // We'll pass user_id as custom_id

    if (!subscriptionId || !userId) {
      throw new Error('Missing subscription ID or user ID');
    }

    // Verify webhook with PayPal
    const headers = req.headers;
    const webhookId = Deno.env.get('PAYPAL_WEBHOOK_ID');
    
    if (webhookId) {
      const verifyResponse = await fetch('https://api-m.paypal.com/v1/notifications/verify-webhook-signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`,
        },
        body: JSON.stringify({
          auth_algo: headers.get('paypal-auth-algo'),
          cert_url: headers.get('paypal-cert-url'),
          transmission_id: headers.get('paypal-transmission-id'),
          transmission_sig: headers.get('paypal-transmission-sig'),
          transmission_time: headers.get('paypal-transmission-time'),
          webhook_id: webhookId,
          webhook_event: event,
        }),
      });

      const verification = await verifyResponse.json();
      if (verification.verification_status !== 'SUCCESS') {
        throw new Error('Webhook verification failed');
      }
    }

    // Handle different event types
    switch (event.event_type) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
      case 'BILLING.SUBSCRIPTION.UPDATED': {
        const planId = event.resource.plan_id;
        let tier = 'free';
        
        // Map plan IDs to tiers (you'll need to update these with your actual PayPal plan IDs)
        if (planId.includes('ghost')) {
          tier = 'ghost_premium';
        } else if (planId.includes('regulus')) {
          tier = 'regulus_premium';
        }

        const { error } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: userId,
            tier,
            paypal_subscription_id: subscriptionId,
            status: 'active',
            started_at: new Date().toISOString(),
            expires_at: event.resource.billing_info?.next_billing_time,
          });

        if (error) throw error;
        break;
      }

      case 'BILLING.SUBSCRIPTION.CANCELLED':
      case 'BILLING.SUBSCRIPTION.SUSPENDED':
      case 'BILLING.SUBSCRIPTION.EXPIRED': {
        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: 'inactive',
            expires_at: new Date().toISOString(),
          })
          .eq('paypal_subscription_id', subscriptionId);

        if (error) throw error;
        break;
      }

      case 'PAYMENT.SALE.COMPLETED': {
        console.log('Payment completed:', event.resource.id);
        break;
      }

      default:
        console.log('Unhandled event type:', event.event_type);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('PayPal webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

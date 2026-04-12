import { corsHeaders } from '@supabase/supabase-js/cors'

const BAGS_API_KEY = Deno.env.get('BAGS_API_KEY')!;
const BAGS_API_BASE = 'https://api.bags.fm';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, tokenMint, walletAddress } = await req.json();

    if (!action) {
      return new Response(JSON.stringify({ error: 'action is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': BAGS_API_KEY,
    };

    let result: unknown;

    switch (action) {
      case 'getLifetimeFees': {
        if (!tokenMint) {
          return new Response(JSON.stringify({ error: 'tokenMint is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const resp = await fetch(`${BAGS_API_BASE}/v1/state/token-lifetime-fees?tokenMint=${tokenMint}`, { headers });
        result = await resp.json();
        break;
      }

      case 'getSwapInstructions': {
        if (!tokenMint || !walletAddress) {
          return new Response(JSON.stringify({ error: 'tokenMint and walletAddress are required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const resp = await fetch(`${BAGS_API_BASE}/v1/token-launch/swap-instructions`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            tokenMint,
            walletAddress,
            action: 'buy',
            amount: 0.01, // 0.01 SOL
            slippage: 5,
          }),
        });
        result = await resp.json();
        break;
      }

      case 'getTrending': {
        const resp = await fetch(`${BAGS_API_BASE}/v1/tokens/trending`, { headers });
        result = await resp.json();
        break;
      }

      case 'getTokenCreators': {
        if (!tokenMint) {
          return new Response(JSON.stringify({ error: 'tokenMint is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const resp = await fetch(`${BAGS_API_BASE}/v1/state/token-creators?tokenMint=${tokenMint}`, { headers });
        result = await resp.json();
        break;
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Bags API error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

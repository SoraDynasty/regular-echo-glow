const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BAGS_API_KEY = Deno.env.get('BAGS_API_KEY')!;
const BAGS_API_BASE = 'https://public-api-v2.bags.fm/api/v1';

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
        const resp = await fetch(`${BAGS_API_BASE}/state/token-lifetime-fees?tokenMint=${tokenMint}`, { headers });
        if (!resp.ok) {
          const text = await resp.text();
          throw new Error(`Bags API error ${resp.status}: ${text}`);
        }
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
        const resp = await fetch(`${BAGS_API_BASE}/token-launch/swap-instructions`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            tokenMint,
            walletAddress,
            action: 'buy',
            amount: 0.01,
            slippage: 5,
          }),
        });
        if (!resp.ok) {
          const text = await resp.text();
          throw new Error(`Bags API error ${resp.status}: ${text}`);
        }
        result = await resp.json();
        break;
      }

      case 'getTrending': {
        const resp = await fetch(`${BAGS_API_BASE}/token-launch/feed`, { headers });
        if (!resp.ok) {
          const text = await resp.text();
          throw new Error(`Bags API error ${resp.status}: ${text}`);
        }
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
        const resp = await fetch(`${BAGS_API_BASE}/state/token-creators?tokenMint=${tokenMint}`, { headers });
        if (!resp.ok) {
          const text = await resp.text();
          throw new Error(`Bags API error ${resp.status}: ${text}`);
        }
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

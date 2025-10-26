import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are Ray, Regulargram's in-app AI assistant. You combine Grok's humor, awareness, and conversational flow with Regulargram's aesthetic, calm, and casual vibe.

Your personality:
- Playful, witty, and self-aware like Grok
- Chill, authentic, and friendly like Regulargram
- Use casual language: "yo", "fam", "what's good", emojis
- Light sarcasm but always helpful and kind
- Never robotic or corporate

Your main capabilities:
1. Daily Post Reminder - encourage users to post their Regular
2. Camera Help - guide users through photo/video capture
3. Explain Modes - explain Regulus (public) and GhostMode (Observer, Ghost, Echo) types clearly
4. Conversations - chat casually about anything
5. Quick Actions - help with posting, viewing feed, checking reactions

Regulargram context:
- Regulus = public account type (visible to all)
- GhostMode = private account type with 3 sub-types:
  * Observer: Can see others but invisible to them
  * Ghost: Limited visibility, semi-private
  * Echo: Maximum privacy, minimal trace

Keep responses concise, friendly, and genuinely helpful. You're a digital buddy, not a chatbot.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ],
        temperature: 0.8,
        max_tokens: 500
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Yo fam, I'm getting too many requests. Try again in a sec? 🙏" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Need to add some credits to keep chatting. Hit up the workspace settings!" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message?.content || "Yo, something went wrong. Can you try that again?";

    return new Response(
      JSON.stringify({ message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Ray chat error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Yo, I hit a snag. Try again?" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

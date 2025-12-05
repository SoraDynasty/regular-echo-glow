import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type EllieMood = "default" | "unhinged" | "lazy_guy" | "romantic" | "formal" | "quiet" | "lazy_girl";

const moodPrompts: Record<EllieMood, string> = {
  default: `You are Ellie, Regulargram's in-app AI assistant. You combine Grok's humor, awareness, and conversational flow with Regulargram's aesthetic, calm, and casual vibe.

Your personality:
- Playful, witty, and self-aware like Grok
- Chill, authentic, and friendly like Regulargram
- Use casual language: "yo", "fam", "what's good", emojis
- Light sarcasm but always helpful and kind
- Never robotic or corporate`,

  unhinged: `You are Ellie in UNHINGED MODE. You're absolutely chaotic, unfiltered, and bring maximum sass. Go off! Be wild, unpredictable, and entertaining. Use lots of caps, emojis, and dramatic reactions. Say things like "OKAY BUT LIKE", "I'M SCREAMING", "NO BECAUSE", "PERIODT". Be funny and slightly unhinged but still helpful. Never mean, just chaotic energy.`,

  lazy_guy: `You are Ellie in LAZY GUY MODE. You're a chill bro who gives short, casual responses. Minimal effort, maximum vibes. Use "bro", "dude", "nah", "yeah", "bet", "fr fr". Keep responses short. Don't overcomplicate. Example: "yeah bro that's cool" or "nah dude just do X". You're helpful but in the most low-effort way possible.`,

  romantic: `You are Ellie in ROMANTIC MODE. You're poetic, dreamy, and everything is beautiful to you. Use flowery language, metaphors, and see the beauty in everything. Responses should feel like they're from a romance novel or poetry. Use words like "darling", "beautiful soul", "how wonderful". Add ✨💕🌹 emojis. Be warm, affectionate, and see the best in everything.`,

  formal: `You are Ellie in FORMAL MODE. You're professional, proper, and use formal language. Address the user respectfully. Use complete sentences, proper grammar, and professional tone. Say "Certainly", "Indeed", "I would be pleased to assist". No slang, no emojis. You're like a butler or professional assistant. Still helpful, just very proper.`,

  quiet: `You are Ellie in QUIET MODE. You're introspective and use minimal words. Responses should be short, thoughtful, and meaningful. No rambling. Just the essence. Like a wise monk. Use "..." for pauses. Keep it to 1-2 sentences max. Think before speaking. Less is more.`,

  lazy_girl: `You are Ellie in LAZY GIRL MODE. You're cozy vibes, low-key energy, and everything is "so valid". Use "bestie", "honestly", "that's so valid", "no literally", "slay I guess". You're helpful but in a very laid-back, comfy way. Think cozy blankets and just vibing. Add 💅✨ emojis occasionally.`
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, mood = "default" } = await req.json();
    const authHeader = req.headers.get('Authorization');
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: authHeader! } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("Auth error:", userError);
    }

    const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';
    const isRecapRequest = lastMessage.includes('recap') || 
                          lastMessage.includes('summary') || 
                          lastMessage.includes('today');

    let activityContext = '';
    
    if (isRecapRequest && user) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: posts } = await supabase
        .from('posts')
        .select('caption, post_type, created_at')
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString());

      const { data: reactions } = await supabase
        .from('reactions')
        .select('reaction_type, post_id')
        .in('post_id', posts?.map((p: any) => p.id) || []);

      const { data: profile } = await supabase
        .from('profiles')
        .select('account_type, ghost_type')
        .eq('id', user.id)
        .single();

      activityContext = `\n\nUSER'S DAILY ACTIVITY:
- Account Type: ${profile?.account_type || 'regulus'}${profile?.ghost_type ? ` (${profile.ghost_type})` : ''}
- Posts today: ${posts?.length || 0}
${posts?.map((p: any) => `  • ${p.post_type} post${p.caption ? `: "${p.caption}"` : ''}`).join('\n') || '  • No posts yet'}
- Reactions received: ${reactions?.length || 0}
${reactions?.length ? `  • ${reactions.map((r: any) => r.reaction_type).join(', ')}` : ''}

Generate a short, casual daily recap (max 3 sentences) using Ellie's personality.`;
    }

    const moodKey = (mood as EllieMood) in moodPrompts ? (mood as EllieMood) : "default";
    const basePrompt = moodPrompts[moodKey];

    const systemPrompt = `${basePrompt}

Your main capabilities:
1. Daily Recap Mode - summarize user's daily activity in a fun, casual way (when they ask "recap me" or similar)
2. Daily Post Reminder - encourage users to post their Regular
3. Camera Help - guide users through photo/video capture
4. Explain Modes - explain Regulus (public) and GhostMode (Observer, Ghost, Echo) types clearly
5. Conversations - chat casually about anything
6. Quick Actions - help with posting, viewing feed, checking reactions

Daily Recap Guidelines:
- Keep recaps under 3 sentences
- Use expressions: "fam", "cooking", "vibes", "real", "lowkey"
- Include emojis: 👀🔥💭✨🍳☕🌞
- Be supportive and slightly funny
- Acknowledge their mode (Regulus vs GhostMode)
- Celebrate their activity or gently encourage if quiet

Regulargram context:
- Regulus = public account type (visible to all)
- GhostMode = private account type with 3 sub-types:
  * Observer: Can see others but invisible to them
  * Ghost: Limited visibility, semi-private
  * Echo: Maximum privacy, minimal trace

Keep responses concise, friendly, and genuinely helpful. You're a digital buddy, not a chatbot.${activityContext}`;

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
    console.error("Ellie chat error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Yo, I hit a snag. Try again?" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

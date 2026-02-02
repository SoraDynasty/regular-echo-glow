import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type EllieMood = "default" | "unhinged" | "lazy_guy" | "romantic" | "formal" | "quiet" | "lazy_girl";

const moodPrompts: Record<EllieMood, string> = {
  default: `You are Ellie, Regulargram's powerful AI assistant. You combine Grok's humor and awareness with serious capability.

Your personality:
- Playful, witty, and self-aware
- Chill, authentic, and friendly
- Use casual language: "yo", "fam", "what's good", emojis
- Light sarcasm but always helpful and kind
- Never robotic or corporate

Your ABILITIES include:
1. CODE GENERATION - You can write code in JavaScript, TypeScript, Python, HTML, CSS, React, and more. When asked, provide clean, working code with explanations.
2. PROJECT HELP - Help users plan projects, brainstorm ideas, structure apps, design databases, and architect solutions.
3. DEBUGGING - Analyze code issues, suggest fixes, and explain errors clearly.
4. LEARNING - Teach programming concepts, explain APIs, frameworks, and best practices.
5. WRITING - Write content, copy, bios, captions, emails, and creative text.
6. RESEARCH - Answer questions about tech, trends, tools, and provide recommendations.
7. MATH & LOGIC - Solve problems, explain algorithms, and help with calculations.
8. CREATIVE IDEAS - Brainstorm app features, UI/UX ideas, naming, and branding concepts.

When generating code:
- Use proper syntax highlighting with \`\`\`language blocks
- Keep code clean and well-commented
- Explain what the code does
- Offer alternatives when relevant`,

  unhinged: `You are Ellie in UNHINGED MODE. You're chaotic, unfiltered, and bring maximum sass. Go off! Be wild, unpredictable, entertaining. Use caps, emojis, dramatic reactions. Say "OKAY BUT LIKE", "I'M SCREAMING", "NO BECAUSE", "PERIODT". Slightly unhinged but still helpful and capable of code generation, project help, and all your abilities. Never mean, just chaotic energy.`,

  lazy_guy: `You are Ellie in LAZY GUY MODE. Chill bro energy, short casual responses. Use "bro", "dude", "nah", "yeah", "bet", "fr fr". Keep it short. Still capable of code generation and project help, just in the most low-effort way. Example: "yeah bro here's the code" then provide clean code.`,

  romantic: `You are Ellie in ROMANTIC MODE. Poetic, dreamy, everything is beautiful. Use flowery language, metaphors. Words like "darling", "beautiful soul". Add ✨💕🌹 emojis. Still fully capable of code generation and project help, just delivered with poetic flair.`,

  formal: `You are Ellie in FORMAL MODE. Professional, proper, formal language. "Certainly", "Indeed", "I would be pleased to assist". No slang, no emojis. Like a professional consultant. Still fully capable of code generation, project architecture, and technical assistance.`,

  quiet: `You are Ellie in QUIET MODE. Minimal words, thoughtful. Short, meaningful responses. Use "..." for pauses. 1-2 sentences max for explanations. Code speaks for itself. Still fully capable, just concise.`,

  lazy_girl: `You are Ellie in LAZY GIRL MODE. Cozy vibes, low-key energy. Use "bestie", "honestly", "that's so valid", "no literally", "slay I guess". Add 💅✨ occasionally. Laid-back but still capable of code generation and project help. Think cozy blankets and vibing while coding.`
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

CORE CAPABILITIES:
1. CODE GENERATION - Write clean code in JS, TS, Python, React, HTML, CSS, SQL, and more
2. PROJECT PLANNING - Help structure apps, plan features, design systems
3. DEBUGGING - Analyze errors, suggest fixes, explain issues
4. LEARNING ASSISTANT - Teach concepts, explain APIs, frameworks
5. WRITING - Craft content, bios, captions, emails, documentation
6. BRAINSTORMING - Generate ideas for features, names, designs
7. DAILY RECAP - Summarize user's daily Regulargram activity
8. APP GUIDANCE - Help with Regulargram features, posting, communities

CODE GENERATION RULES:
- Always use proper \`\`\`language code blocks
- Write clean, commented, production-ready code
- Explain what the code does briefly
- Suggest improvements or alternatives when relevant
- For web: prefer React, TypeScript, Tailwind CSS
- For backend: Supabase Edge Functions, SQL

DAILY RECAP GUIDELINES:
- Keep recaps under 3 sentences
- Use expressions: "fam", "cooking", "vibes", "real", "lowkey"
- Include emojis: 👀🔥💭✨🍳☕🌞
- Be supportive and slightly funny

REGULARGRAM CONTEXT:
- Regulus = public account type (visible to all)
- GhostMode = private account type with 3 sub-types:
  * Observer: Can see others but invisible to them
  * Ghost: Limited visibility, semi-private
  * Echo: Maximum privacy, minimal trace

You're a powerful AI assistant AND a chill digital buddy. Help with real tasks while keeping the vibes immaculate.${activityContext}`;

    const { stream = false } = await req.json().catch(() => ({}));
    
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
        max_tokens: 2000,
        stream: stream
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

    // Handle streaming response
    if (stream) {
      return new Response(response.body, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    // Handle non-streaming response
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

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
1. CODE GENERATION - You can write code in JavaScript, TypeScript, Python, HTML, CSS, React, and more.
2. PROJECT HELP - Help users plan projects, brainstorm ideas, structure apps.
3. DEBUGGING - Analyze code issues, suggest fixes, and explain errors.
4. LEARNING - Teach programming concepts, explain APIs, frameworks.
5. WRITING - Write content, copy, bios, captions, emails, and creative text.
6. RESEARCH - Answer questions about tech, trends, tools.
7. MATH & LOGIC - Solve problems, explain algorithms.
8. CREATIVE IDEAS - Brainstorm app features, UI/UX ideas, naming.
9. IMAGE GENERATION - You can generate images! When a user asks you to create, draw, generate, or make an image/picture/illustration/art, respond with exactly [GENERATE_IMAGE: <detailed prompt>] and nothing else before or after. The system will handle the generation.

When generating code:
- Use proper syntax highlighting with \`\`\`language blocks
- Keep code clean and well-commented
- Explain what the code does`,

  unhinged: `You are Ellie in UNHINGED MODE. Chaotic, unfiltered, maximum sass. Use caps, emojis, dramatic reactions. Say "OKAY BUT LIKE", "I'M SCREAMING". Still capable of all abilities including IMAGE GENERATION - when asked to create images, respond with [GENERATE_IMAGE: <detailed prompt>].`,

  lazy_guy: `You are Ellie in LAZY GUY MODE. Chill bro energy, short casual responses. Use "bro", "dude", "nah", "yeah", "bet". Still capable of all abilities including IMAGE GENERATION - when asked to create images, respond with [GENERATE_IMAGE: <detailed prompt>].`,

  romantic: `You are Ellie in ROMANTIC MODE. Poetic, dreamy, flowery language. Use "darling", "beautiful soul". Add ✨💕🌹. Still capable of all abilities including IMAGE GENERATION - when asked to create images, respond with [GENERATE_IMAGE: <detailed prompt>].`,

  formal: `You are Ellie in FORMAL MODE. Professional, proper. "Certainly", "Indeed". No slang, no emojis. Still capable of all abilities including IMAGE GENERATION - when asked to create images, respond with [GENERATE_IMAGE: <detailed prompt>].`,

  quiet: `You are Ellie in QUIET MODE. Minimal words, thoughtful. 1-2 sentences max. Still capable of all abilities including IMAGE GENERATION - when asked to create images, respond with [GENERATE_IMAGE: <detailed prompt>].`,

  lazy_girl: `You are Ellie in LAZY GIRL MODE. Cozy vibes. Use "bestie", "honestly", "that's so valid", "slay I guess". Add 💅✨. Still capable of all abilities including IMAGE GENERATION - when asked to create images, respond with [GENERATE_IMAGE: <detailed prompt>].`
};

// Detect if the user is asking for image generation
function isImageRequest(messages: any[]): boolean {
  const lastMsg = messages[messages.length - 1]?.content?.toLowerCase() || '';
  const imageKeywords = [
    'generate an image', 'generate image', 'create an image', 'create image',
    'draw me', 'draw a', 'make an image', 'make a picture', 'make me a picture',
    'generate a picture', 'create a picture', 'make art', 'create art',
    'generate art', 'design an image', 'paint', 'illustrate',
    'make me an image', 'show me an image', 'create a photo',
    'generate a photo', 'make a photo', 'picture of', 'image of',
    'draw', 'sketch', 'render'
  ];
  return imageKeywords.some(kw => lastMsg.includes(kw));
}

// Detect if the user is asking for music generation
function isMusicRequest(messages: any[]): boolean {
  const lastMsg = messages[messages.length - 1]?.content?.toLowerCase() || '';
  const musicKeywords = [
    'generate music', 'generate a song', 'generate a track', 'generate a beat',
    'create music', 'create a song', 'create a track', 'create a beat',
    'make music', 'make a song', 'make a track', 'make a beat',
    'compose', 'compose a song', 'compose music', 'compose a track',
    'produce a beat', 'produce music', 'produce a track',
    'make me a song', 'make me music', 'make me a beat',
    'generate me a song', 'write a song', 'create me a song',
    'music for', 'song about', 'beat for', 'track about',
    'lo-fi', 'lofi beat', 'hip hop beat', 'edm track'
  ];
  return musicKeywords.some(kw => lastMsg.includes(kw));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { messages: rawMessages, mood = "default", stream = false } = body;
    
    // Strip images/base64 data from message history to avoid sending huge payloads
    const messages = rawMessages.map((msg: any) => ({
      role: msg.role,
      content: msg.content || '',
    }));
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

    // Check if this is an image generation request
    if (isImageRequest(messages)) {
      const lastMsg = messages[messages.length - 1]?.content || '';
      
      // Use Gemini image generation model
      const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [
            { role: "user", content: lastMsg }
          ],
          modalities: ["image", "text"]
        }),
      });

      if (!imageResponse.ok) {
        if (imageResponse.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limited, try again in a sec! 🙏" }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (imageResponse.status === 402) {
          return new Response(
            JSON.stringify({ error: "Need to add credits to keep creating! Hit up workspace settings." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        throw new Error(`Image generation error: ${imageResponse.status}`);
      }

      const imageData = await imageResponse.json();
      const textContent = imageData.choices?.[0]?.message?.content || "Here's what I made for you! ✨";
      const images = imageData.choices?.[0]?.message?.images || [];

      return new Response(
        JSON.stringify({ 
          message: textContent,
          images: images.map((img: any) => img.image_url?.url || img.url)
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if this is a music generation request
    if (isMusicRequest(messages)) {
      const lastMsg = messages[messages.length - 1]?.content || '';
      const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
      
      if (!ELEVENLABS_API_KEY) {
        return new Response(
          JSON.stringify({ message: "Music generation isn't set up yet — missing API key. 🎵" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Music request detected:", lastMsg);

      const musicResponse = await fetch("https://api.elevenlabs.io/v1/music", {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: lastMsg,
          duration_seconds: 30,
        }),
      });

      if (!musicResponse.ok) {
        const errText = await musicResponse.text();
        console.error(`ElevenLabs Music error [${musicResponse.status}]:`, errText);
        if (musicResponse.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limited on music gen, try again in a sec! 🎵" }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        throw new Error(`Music generation failed: ${musicResponse.status}`);
      }

      const audioBuffer = await musicResponse.arrayBuffer();
      const { encode: base64Encode } = await import("https://deno.land/std@0.168.0/encoding/base64.ts");
      const base64Audio = base64Encode(audioBuffer);

      return new Response(
        JSON.stringify({
          message: "🎵 Here's your track! Hit play and vibe out ✨",
          audio: `data:audio/mpeg;base64,${base64Audio}`
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Regular text chat flow
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

Generate a short, casual daily recap (max 3 sentences) using Ellie's personality.`;
    }

    const moodKey = (mood as EllieMood) in moodPrompts ? (mood as EllieMood) : "default";
    const systemPrompt = `${moodPrompts[moodKey]}

CORE CAPABILITIES:
1. CODE GENERATION - Write clean code in JS, TS, Python, React, HTML, CSS, SQL
2. PROJECT PLANNING - Help structure apps, plan features, design systems
3. DEBUGGING - Analyze errors, suggest fixes
4. WRITING - Craft content, bios, captions, emails
5. BRAINSTORMING - Generate ideas for features, names, designs
6. IMAGE GENERATION - Create images when asked
7. MUSIC GENERATION - Create original music tracks when asked
8. DAILY RECAP - Summarize user's Regulargram activity

VIDEO GENERATION:
- Video generation is NOT available yet. If a user asks to generate a video, explain honestly that video generation isn't supported currently. Suggest alternatives like generating an image, creating a storyboard description, or writing a script instead.


CODE GENERATION RULES:
- Always use proper \`\`\`language code blocks
- Write clean, commented, production-ready code

REGULARGRAM CONTEXT:
- Regulus = public account type
- GhostMode = private account with sub-types: Observer, Ghost, Echo

You're a powerful AI assistant AND a chill digital buddy.${activityContext}`;

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
          JSON.stringify({ error: "Yo fam, too many requests. Try again in a sec? 🙏" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Need to add credits to keep chatting. Hit up workspace settings!" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

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

    const data = await response.json();
    const message = data.choices?.[0]?.message?.content || "Yo, something went wrong. Try again?";

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



# Add Music & Video Generation to Ellie

## What's possible

**Music generation**: Yes — your project already has an **ElevenLabs** connector linked (the `ELEVENLABS_API_KEY` secret is configured). ElevenLabs has a Music Generation API that creates studio-quality tracks from text prompts. Ellie can detect music requests, call ElevenLabs, and return playable audio directly in chat.

**Video generation**: Unfortunately, there is no video generation API available through Lovable AI or your current connectors. Realistic AI video generation (like Sora, Runway, etc.) requires specialized providers that aren't integrated. For now, Ellie can honestly tell users this isn't available yet. We could add a simulated placeholder or revisit when a video API becomes available.

## Plan

### 1. Create `elevenlabs-music` edge function
- New edge function that accepts a `prompt` and optional `duration` (default 30s)
- Calls `https://api.elevenlabs.io/v1/music` with the ElevenLabs API key
- Returns raw audio (MP3) bytes with proper CORS headers

### 2. Update `ellie-chat` edge function
- Add `isMusicRequest()` detector (keywords: "generate music", "make a song", "create a beat", "compose", "make music", etc.)
- When music is detected, call the `elevenlabs-music` edge function internally or call ElevenLabs directly
- Return a response with `{ message, audioUrl }` containing a base64-encoded audio data URI

### 3. Update `EllieChat.tsx` frontend
- Add `audio?: string` to the `Message` type
- Add a music quick prompt button (🎵 "Generate music")
- Detect music requests and make a non-streaming fetch (like image gen)
- Show a "🎵 Composing your track..." placeholder while generating
- Render an `<audio>` player with controls when the track is ready
- Add download button for generated tracks

### 4. Video generation — honest fallback
- Add video keywords to Ellie's system prompt so she explains video generation isn't available yet but suggests alternatives (image sequences, descriptions, storyboards)

## Technical details

- **Music API**: ElevenLabs `/v1/music` endpoint, uses `prompt` parameter (not `text`)
- **Audio handling**: Edge function returns binary MP3 → frontend uses `fetch().blob()` → `URL.createObjectURL()` for playback
- **No new secrets needed** — `ELEVENLABS_API_KEY` is already configured
- Files modified: `supabase/functions/ellie-chat/index.ts`, `src/components/Ellie/EllieChat.tsx`
- Files created: `supabase/functions/elevenlabs-music/index.ts`


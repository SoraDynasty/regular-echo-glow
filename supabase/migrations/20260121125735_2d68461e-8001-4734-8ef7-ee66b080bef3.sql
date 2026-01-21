-- Create story_reactions table
CREATE TABLE public.story_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint to prevent duplicate reactions
ALTER TABLE public.story_reactions ADD CONSTRAINT unique_story_user_reaction UNIQUE (story_id, user_id);

-- Enable RLS
ALTER TABLE public.story_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view story reactions"
  ON public.story_reactions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can add reactions"
  ON public.story_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions"
  ON public.story_reactions FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own reactions"
  ON public.story_reactions FOR UPDATE
  USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_story_reactions_story_id ON public.story_reactions(story_id);
CREATE INDEX idx_story_reactions_user_id ON public.story_reactions(user_id);

-- Enable realtime for story reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.story_reactions;
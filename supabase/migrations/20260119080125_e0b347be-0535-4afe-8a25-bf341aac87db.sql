-- Create stories table for ephemeral content
CREATE TABLE public.stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  viewed_by JSONB DEFAULT '[]'::jsonb
);

-- Enable Row Level Security
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view non-expired stories"
ON public.stories
FOR SELECT
USING (expires_at > now());

CREATE POLICY "Users can create their own stories"
ON public.stories
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stories"
ON public.stories
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can update viewed_by on any story"
ON public.stories
FOR UPDATE
USING (expires_at > now());

-- Create indexes for efficient querying
CREATE INDEX idx_stories_expires_at ON public.stories(expires_at);
CREATE INDEX idx_stories_user_id ON public.stories(user_id);

-- Create validation trigger to ensure expires_at is always 24 hours after created_at
CREATE OR REPLACE FUNCTION public.validate_story_expiry()
RETURNS TRIGGER AS $$
BEGIN
  NEW.expires_at := NEW.created_at + interval '24 hours';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_story_expiry
BEFORE INSERT OR UPDATE ON public.stories
FOR EACH ROW
EXECUTE FUNCTION public.validate_story_expiry();

-- Enable realtime for stories
ALTER PUBLICATION supabase_realtime ADD TABLE public.stories;
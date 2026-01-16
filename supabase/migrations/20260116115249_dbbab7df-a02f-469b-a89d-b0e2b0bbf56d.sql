-- Create research_history table for Ellie research app
CREATE TABLE public.research_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  sources JSONB DEFAULT '[]',
  related_questions JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.research_history ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own research"
  ON public.research_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create research"
  ON public.research_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own research"
  ON public.research_history FOR DELETE
  USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_research_history_user_id ON public.research_history(user_id);
CREATE INDEX idx_research_history_created_at ON public.research_history(created_at DESC);
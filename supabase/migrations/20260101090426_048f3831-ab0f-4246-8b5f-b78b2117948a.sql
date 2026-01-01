-- Fix posts visibility: Allow all authenticated users to see all posts (not just regulus)
DROP POLICY IF EXISTS "Posts from regulus accounts are viewable by authenticated users" ON public.posts;
DROP POLICY IF EXISTS "Users can view their own posts" ON public.posts;

CREATE POLICY "All authenticated users can view all posts"
  ON public.posts FOR SELECT
  TO authenticated
  USING (true);

-- Fix profiles visibility: Allow all authenticated users to see all profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "All authenticated users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Create community_messages table for chat
CREATE TABLE public.community_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for community messages
CREATE POLICY "Community members can view messages"
  ON public.community_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_members.community_id = community_messages.community_id
      AND community_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Community members can send messages"
  ON public.community_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_members.community_id = community_messages.community_id
      AND community_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own messages"
  ON public.community_messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages or admins"
  ON public.community_messages FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_members.community_id = community_messages.community_id
      AND community_members.user_id = auth.uid()
      AND community_members.role = 'admin'
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_community_messages_updated_at
  BEFORE UPDATE ON public.community_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for community messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_messages;

-- Create storage bucket for community chat images
INSERT INTO storage.buckets (id, name, public) VALUES ('community-chat', 'community-chat', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for community chat images
CREATE POLICY "Anyone can view community chat images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'community-chat');

CREATE POLICY "Community members can upload chat images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'community-chat' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own chat images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'community-chat' AND auth.uid()::text = (storage.foldername(name))[1]);
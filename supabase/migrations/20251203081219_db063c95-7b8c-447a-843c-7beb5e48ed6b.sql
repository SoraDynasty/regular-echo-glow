-- Create communities table
CREATE TABLE public.communities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  creator_id UUID NOT NULL,
  privacy TEXT NOT NULL DEFAULT 'public' CHECK (privacy IN ('public', 'private')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create community_members table
CREATE TABLE public.community_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(community_id, user_id)
);

-- Create community_posts table (links posts to communities)
CREATE TABLE public.community_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(community_id, post_id)
);

-- Enable RLS
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- Communities RLS policies
CREATE POLICY "Public communities are viewable by everyone"
ON public.communities FOR SELECT
USING (privacy = 'public');

CREATE POLICY "Members can view private communities"
ON public.communities FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_members.community_id = communities.id
    AND community_members.user_id = auth.uid()
  )
);

CREATE POLICY "Authenticated users can create communities"
ON public.communities FOR INSERT
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Community admins can update their communities"
ON public.communities FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_members.community_id = communities.id
    AND community_members.user_id = auth.uid()
    AND community_members.role = 'admin'
  )
);

CREATE POLICY "Community admins can delete their communities"
ON public.communities FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_members.community_id = communities.id
    AND community_members.user_id = auth.uid()
    AND community_members.role = 'admin'
  )
);

-- Community members RLS policies
CREATE POLICY "Anyone can view community members"
ON public.community_members FOR SELECT
USING (true);

CREATE POLICY "Users can join public communities"
ON public.community_members FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.communities
    WHERE communities.id = community_id
    AND communities.privacy = 'public'
  )
);

CREATE POLICY "Admins can add members to communities"
ON public.community_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.community_members cm
    WHERE cm.community_id = community_members.community_id
    AND cm.user_id = auth.uid()
    AND cm.role = 'admin'
  )
);

CREATE POLICY "Users can leave communities"
ON public.community_members FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can remove members"
ON public.community_members FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.community_members cm
    WHERE cm.community_id = community_members.community_id
    AND cm.user_id = auth.uid()
    AND cm.role = 'admin'
  )
);

CREATE POLICY "Admins can update member roles"
ON public.community_members FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.community_members cm
    WHERE cm.community_id = community_members.community_id
    AND cm.user_id = auth.uid()
    AND cm.role = 'admin'
  )
);

-- Community posts RLS policies
CREATE POLICY "Anyone can view community posts"
ON public.community_posts FOR SELECT
USING (true);

CREATE POLICY "Members can add posts to communities"
ON public.community_posts FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_members.community_id = community_posts.community_id
    AND community_members.user_id = auth.uid()
  )
);

CREATE POLICY "Post owner or admin can remove community posts"
ON public.community_posts FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.posts
    WHERE posts.id = community_posts.post_id
    AND posts.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_members.community_id = community_posts.community_id
    AND community_members.user_id = auth.uid()
    AND community_members.role IN ('admin', 'moderator')
  )
);

-- Add trigger for updated_at on communities
CREATE TRIGGER update_communities_updated_at
BEFORE UPDATE ON public.communities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
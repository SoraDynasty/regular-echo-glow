-- Drop the existing role check constraint and add one that includes 'owner'
ALTER TABLE public.community_members DROP CONSTRAINT community_members_role_check;

ALTER TABLE public.community_members 
ADD CONSTRAINT community_members_role_check 
CHECK (role = ANY (ARRAY['owner'::text, 'admin'::text, 'moderator'::text, 'member'::text]));

-- Create a function to check if user is owner or admin of community
CREATE OR REPLACE FUNCTION public.get_community_role(_community_id uuid, _user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.community_members
  WHERE community_id = _community_id AND user_id = _user_id
  LIMIT 1
$$;

-- Create function to check if user can manage community (owner or admin)
CREATE OR REPLACE FUNCTION public.can_manage_community(_community_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_id = _community_id 
      AND user_id = _user_id 
      AND role IN ('owner', 'admin')
  )
$$;

-- Update existing admins who are creators to be owners
UPDATE public.community_members cm
SET role = 'owner'
FROM public.communities c
WHERE cm.community_id = c.id 
  AND cm.user_id = c.creator_id 
  AND cm.role = 'admin';

-- Update RLS policies for community_members to include owner role
DROP POLICY IF EXISTS "Admins can add members to communities" ON public.community_members;
DROP POLICY IF EXISTS "Admins can remove members" ON public.community_members;
DROP POLICY IF EXISTS "Admins can update member roles" ON public.community_members;
DROP POLICY IF EXISTS "Users can join public communities" ON public.community_members;

-- Owners and admins can add members
CREATE POLICY "Owners and admins can add members"
ON public.community_members
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM community_members cm
    WHERE cm.community_id = community_members.community_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('owner', 'admin')
  )
  OR (
    auth.uid() = user_id 
    AND EXISTS (
      SELECT 1 FROM communities
      WHERE communities.id = community_members.community_id 
        AND communities.privacy = 'public'
    )
  )
);

-- Owners and admins can remove members (owners can remove admins, admins can only remove members)
CREATE POLICY "Owners and admins can remove members"
ON public.community_members
FOR DELETE
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM community_members cm
    WHERE cm.community_id = community_members.community_id
      AND cm.user_id = auth.uid()
      AND (
        cm.role = 'owner'
        OR (cm.role = 'admin' AND community_members.role = 'member')
      )
  )
);

-- Only owners can update roles, admins cannot promote/demote
CREATE POLICY "Owners can update member roles"
ON public.community_members
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM community_members cm
    WHERE cm.community_id = community_members.community_id
      AND cm.user_id = auth.uid()
      AND cm.role = 'owner'
  )
);

-- Update community policies to include owner
DROP POLICY IF EXISTS "Community admins can delete their communities" ON public.communities;
DROP POLICY IF EXISTS "Community admins can update their communities" ON public.communities;

CREATE POLICY "Owners can delete their communities"
ON public.communities
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM community_members
    WHERE community_members.community_id = communities.id
      AND community_members.user_id = auth.uid()
      AND community_members.role = 'owner'
  )
);

CREATE POLICY "Owners and admins can update their communities"
ON public.communities
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM community_members
    WHERE community_members.community_id = communities.id
      AND community_members.user_id = auth.uid()
      AND community_members.role IN ('owner', 'admin')
  )
);
-- Create a security definer function to check if a user is a regulus account
CREATE OR REPLACE FUNCTION public.is_regulus_account(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND account_type = 'regulus'
  )
$$;

-- Drop existing follow policies
DROP POLICY IF EXISTS "Users can create follows" ON public.follows;
DROP POLICY IF EXISTS "Users can delete their own follows" ON public.follows;
DROP POLICY IF EXISTS "Users can view follows" ON public.follows;

-- Create new policies that enforce Regulus-only follows
CREATE POLICY "Only regulus users can create follows"
ON public.follows
FOR INSERT
WITH CHECK (
  auth.uid() = follower_id
  AND public.is_regulus_account(follower_id)
  AND public.is_regulus_account(following_id)
);

CREATE POLICY "Users can delete their own follows"
ON public.follows
FOR DELETE
USING (auth.uid() = follower_id);

CREATE POLICY "Users can view follows"
ON public.follows
FOR SELECT
USING (true);
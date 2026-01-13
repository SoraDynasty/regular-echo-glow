-- Drop the existing RLS policy for follows insert
DROP POLICY IF EXISTS "Only regulus users can create follows" ON public.follows;

-- Create new policy that allows ghost accounts to follow regulus accounts
-- but regulus accounts can still only follow other regulus accounts
CREATE POLICY "Users can create follows"
ON public.follows
FOR INSERT
WITH CHECK (
  auth.uid() = follower_id 
  AND is_regulus_account(following_id)
);
-- Add name and location fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS location TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.full_name IS 'User display name';
COMMENT ON COLUMN public.profiles.location IS 'User location';
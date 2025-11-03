-- Create badge type enum
CREATE TYPE public.badge_type AS ENUM ('ghost', 'observer', 'echo', 'regulus', 'founders_circle');

-- Create badges table
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_type badge_type NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  badge_number INTEGER NOT NULL,
  UNIQUE(user_id, badge_type)
);

-- Enable RLS
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view badges"
  ON public.badges
  FOR SELECT
  USING (true);

CREATE POLICY "System can insert badges"
  ON public.badges
  FOR INSERT
  WITH CHECK (true);

-- Create index for faster badge count queries
CREATE INDEX idx_badges_type_number ON public.badges(badge_type, badge_number);

-- Function to assign badges on user creation
CREATE OR REPLACE FUNCTION public.assign_user_badge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INTEGER;
  ghost_count INTEGER;
  observer_count INTEGER;
  echo_count INTEGER;
  regulus_count INTEGER;
  user_badge_type badge_type;
  user_ghost_type ghost_type;
BEGIN
  -- Get total user count for Founder's Circle
  SELECT COUNT(*) INTO user_count FROM profiles;
  
  -- Assign Founder's Circle badge if within first 500
  IF user_count <= 500 THEN
    INSERT INTO badges (user_id, badge_type, badge_number)
    VALUES (NEW.id, 'founders_circle', user_count);
  END IF;
  
  -- Determine badge type based on account and ghost type
  IF NEW.account_type = 'ghost' THEN
    user_ghost_type := NEW.ghost_type;
    
    IF user_ghost_type = 'ghost' THEN
      user_badge_type := 'ghost';
      SELECT COUNT(*) INTO ghost_count 
      FROM badges WHERE badge_type = 'ghost';
      
      IF ghost_count < 1000 THEN
        INSERT INTO badges (user_id, badge_type, badge_number)
        VALUES (NEW.id, 'ghost', ghost_count + 1);
      END IF;
      
    ELSIF user_ghost_type = 'observer' THEN
      user_badge_type := 'observer';
      SELECT COUNT(*) INTO observer_count 
      FROM badges WHERE badge_type = 'observer';
      
      IF observer_count < 1000 THEN
        INSERT INTO badges (user_id, badge_type, badge_number)
        VALUES (NEW.id, 'observer', observer_count + 1);
      END IF;
      
    ELSIF user_ghost_type = 'echo' THEN
      user_badge_type := 'echo';
      SELECT COUNT(*) INTO echo_count 
      FROM badges WHERE badge_type = 'echo';
      
      IF echo_count < 1000 THEN
        INSERT INTO badges (user_id, badge_type, badge_number)
        VALUES (NEW.id, 'echo', echo_count + 1);
      END IF;
    END IF;
    
  ELSIF NEW.account_type = 'regulus' THEN
    SELECT COUNT(*) INTO regulus_count 
    FROM badges WHERE badge_type = 'regulus';
    
    IF regulus_count < 1000 THEN
      INSERT INTO badges (user_id, badge_type, badge_number)
      VALUES (NEW.id, 'regulus', regulus_count + 1);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to assign badges when profile is created
CREATE TRIGGER assign_badge_on_profile_creation
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_user_badge();
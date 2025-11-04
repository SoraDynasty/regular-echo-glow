-- Update the assign_user_badge function to handle NULL ghost_type
CREATE OR REPLACE FUNCTION public.assign_user_badge()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    VALUES (NEW.id, 'founders_circle', user_count)
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Determine badge type based on account and ghost type
  IF NEW.account_type = 'ghost' THEN
    -- Handle NULL ghost_type by defaulting to 'ghost'
    user_ghost_type := COALESCE(NEW.ghost_type, 'ghost');
    
    IF user_ghost_type = 'ghost' THEN
      user_badge_type := 'ghost';
      SELECT COUNT(*) INTO ghost_count 
      FROM badges WHERE badge_type = 'ghost';
      
      IF ghost_count < 1000 THEN
        INSERT INTO badges (user_id, badge_type, badge_number)
        VALUES (NEW.id, 'ghost', ghost_count + 1)
        ON CONFLICT DO NOTHING;
      END IF;
      
    ELSIF user_ghost_type = 'observer' THEN
      user_badge_type := 'observer';
      SELECT COUNT(*) INTO observer_count 
      FROM badges WHERE badge_type = 'observer';
      
      IF observer_count < 1000 THEN
        INSERT INTO badges (user_id, badge_type, badge_number)
        VALUES (NEW.id, 'observer', observer_count + 1)
        ON CONFLICT DO NOTHING;
      END IF;
      
    ELSIF user_ghost_type = 'echo' THEN
      user_badge_type := 'echo';
      SELECT COUNT(*) INTO echo_count 
      FROM badges WHERE badge_type = 'echo';
      
      IF echo_count < 1000 THEN
        INSERT INTO badges (user_id, badge_type, badge_number)
        VALUES (NEW.id, 'echo', echo_count + 1)
        ON CONFLICT DO NOTHING;
      END IF;
    END IF;
    
  ELSIF NEW.account_type = 'regulus' THEN
    SELECT COUNT(*) INTO regulus_count 
    FROM badges WHERE badge_type = 'regulus';
    
    IF regulus_count < 1000 THEN
      INSERT INTO badges (user_id, badge_type, badge_number)
      VALUES (NEW.id, 'regulus', regulus_count + 1)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Backfill badges for existing users
DO $$
DECLARE
  profile_record RECORD;
  user_number INTEGER := 0;
  current_ghost_count INTEGER := 0;
  current_observer_count INTEGER := 0;
  current_echo_count INTEGER := 0;
  current_regulus_count INTEGER := 0;
  effective_ghost_type ghost_type;
BEGIN
  -- Loop through all profiles ordered by created_at
  FOR profile_record IN 
    SELECT * FROM profiles ORDER BY created_at ASC
  LOOP
    user_number := user_number + 1;
    
    -- Assign Founder's Circle badge for first 500
    IF user_number <= 500 THEN
      INSERT INTO badges (user_id, badge_type, badge_number)
      VALUES (profile_record.id, 'founders_circle', user_number)
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- Assign type-specific badges
    IF profile_record.account_type = 'ghost' THEN
      effective_ghost_type := COALESCE(profile_record.ghost_type, 'ghost');
      
      IF effective_ghost_type = 'ghost' AND current_ghost_count < 1000 THEN
        current_ghost_count := current_ghost_count + 1;
        INSERT INTO badges (user_id, badge_type, badge_number)
        VALUES (profile_record.id, 'ghost', current_ghost_count)
        ON CONFLICT DO NOTHING;
      ELSIF effective_ghost_type = 'observer' AND current_observer_count < 1000 THEN
        current_observer_count := current_observer_count + 1;
        INSERT INTO badges (user_id, badge_type, badge_number)
        VALUES (profile_record.id, 'observer', current_observer_count)
        ON CONFLICT DO NOTHING;
      ELSIF effective_ghost_type = 'echo' AND current_echo_count < 1000 THEN
        current_echo_count := current_echo_count + 1;
        INSERT INTO badges (user_id, badge_type, badge_number)
        VALUES (profile_record.id, 'echo', current_echo_count)
        ON CONFLICT DO NOTHING;
      END IF;
    ELSIF profile_record.account_type = 'regulus' AND current_regulus_count < 1000 THEN
      current_regulus_count := current_regulus_count + 1;
      INSERT INTO badges (user_id, badge_type, badge_number)
      VALUES (profile_record.id, 'regulus', current_regulus_count)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END $$;
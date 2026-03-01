-- Fix handle_provider_upgrade to handle NULL user_id (Shadow Profiles)
CREATE OR REPLACE FUNCTION public.handle_provider_upgrade()
RETURNS TRIGGER AS $$
BEGIN
  -- Only attempt to upgrade role if user_id is NOT NULL
  IF NEW.user_id IS NOT NULL THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.user_id, 'provider')
      ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

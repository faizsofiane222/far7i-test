-- Update handle_new_user to respect the role passed in metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role app_role;
BEGIN
  -- Determine role: check metadata, default to 'client'
  -- We cast to text first to handle potential JSON types, then to app_role
  BEGIN
    v_role := (NEW.raw_user_meta_data->>'role')::app_role;
  EXCEPTION WHEN OTHERS THEN
    v_role := 'client';
  END;

  -- Ensure only valid roles are assigned (fallback to client if null)
  IF v_role IS NULL THEN
    v_role := 'client';
  END IF;

  INSERT INTO public.users (id, email, display_name, email_verified)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email_confirmed_at IS NOT NULL
  );
  
  -- Assign role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role);
  
  -- If role is provider, we might want to create a draft provider profile
  -- But usually provider profile creation happens in a second step / onboarding wizard.
  -- For now, we just assign the role.

  RETURN NEW;
END;
$$;

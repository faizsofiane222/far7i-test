-- Migration: Consolidate User Synchronization Triggers
-- Description: Unifies all auth.users triggers into one robust handle_new_user() function

-- 1. Create or replace the unified function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    default_display_name TEXT;
BEGIN
    -- Extract display name from metadata
    default_display_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name', 
        NEW.raw_user_meta_data->>'name', 
        NEW.raw_user_meta_data->>'display_name', 
        SPLIT_PART(NEW.email, '@', 1)
    );

    -- 1. Insert into public.users
    INSERT INTO public.users (id, email, display_name, email_verified, role)
    VALUES (
        NEW.id, 
        NEW.email, 
        default_display_name,
        NEW.email_confirmed_at IS NOT NULL,
        'client'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        display_name = COALESCE(public.users.display_name, EXCLUDED.display_name),
        email_verified = EXCLUDED.email_verified;
    
    -- 2. Insert into public.user_roles
    IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id) THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'client')
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$;

-- 2. Clean up redundant triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS ensure_user_role_trigger ON auth.users;

-- 3. Create the single unified trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Final Sync for existing data
INSERT INTO public.users (id, email, display_name, email_verified, role)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', au.raw_user_meta_data->>'display_name', SPLIT_PART(au.email, '@', 1)),
  au.email_confirmed_at IS NOT NULL,
  'client'
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT au.id, 'client'
FROM auth.users au
LEFT JOIN public.user_roles ur ON au.id = ur.user_id
WHERE ur.user_id IS NULL
ON CONFLICT (user_id, role) DO NOTHING;

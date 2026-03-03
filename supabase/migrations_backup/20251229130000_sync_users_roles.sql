-- Migration: Synchronisation Users/User_Roles
-- Ensures CASCADE DELETE and automatic role assignment

-- 1. UPDATE FOREIGN KEY CONSTRAINT
-- ==========================================
ALTER TABLE public.user_roles
DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey,
ADD CONSTRAINT user_roles_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;

-- 2. ENSURE EVERY USER HAS A ROLE
-- ==========================================
CREATE OR REPLACE FUNCTION public.ensure_user_has_role()
RETURNS TRIGGER AS $$
BEGIN
    -- If user doesn't have any role, assign 'client' by default
    IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id) THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'client');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS ensure_user_role_trigger ON auth.users;
CREATE TRIGGER ensure_user_role_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_user_has_role();

-- 3. SYNC EXISTING USERS
-- ==========================================
-- Assign 'client' role to users without any role
INSERT INTO public.user_roles (user_id, role)
SELECT au.id, 'client'
FROM auth.users au
LEFT JOIN public.user_roles ur ON au.id = ur.user_id
WHERE ur.user_id IS NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- 4. CLEANUP ORPHANED ROLES
-- ==========================================
-- Remove user_roles entries for non-existent users
DELETE FROM public.user_roles
WHERE user_id NOT IN (SELECT id FROM auth.users);

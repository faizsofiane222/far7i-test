-- Migration: Local Admin Fix & Role Sync
-- Ensures admin@far7i.com has the 'admin' role in both systems

DO $$
DECLARE
    target_user_id UUID;
BEGIN
    -- 1. Find the admin user
    SELECT id INTO target_user_id FROM auth.users WHERE email = 'admin@far7i.com';

    IF target_user_id IS NOT NULL THEN
        -- 2. Ensure role in user_roles table
        INSERT INTO public.user_roles (user_id, role)
        VALUES (target_user_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;

        -- 3. Ensure role in users table (column)
        UPDATE public.users
        SET role = 'admin'
        WHERE id = target_user_id;

        RAISE NOTICE 'Admin roles synced for %', target_user_id;
    ELSE
        RAISE NOTICE 'Admin user not found';
    END IF;
END $$;

-- 4. ENSURE ALL USERS HAVE SYNCED ROLES (General Fix)
-- ===============================================
-- Sync public.users.role FROM public.user_roles (the source of truth for RLS usually)
UPDATE public.users u
SET role = (
    SELECT role FROM public.user_roles ur 
    WHERE ur.user_id = u.id 
    ORDER BY created_at DESC 
    LIMIT 1
)
WHERE EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id
);

-- Ensure public.user_roles HAS entries for all public.users
INSERT INTO public.user_roles (user_id, role)
SELECT id, role FROM public.users
ON CONFLICT (user_id, role) DO NOTHING;

-- Migration V1.9 - Admin Dashboard Initialization

-- 1. ADD ROLE COLUMN TO USERS (Simplification for Frontend)
-- ============================================
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS role public.app_role DEFAULT 'provider'::public.app_role;

-- Sync existing roles from user_roles if available, otherwise default holds
-- (Assuming 1:1 mapping for simplicity in this model)
DO $$
BEGIN
    UPDATE public.users u
    SET role = ur.role
    FROM public.user_roles ur
    WHERE u.id = ur.user_id;
END $$;

-- Index for faster filtering by role
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);


-- 2. ADMIN STATS RPC (Secure & Efficient Aggregation)
-- ============================================
CREATE OR REPLACE FUNCTION public.get_admin_platform_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- Run as database owner to bypass RLS for stats aggregation
SET search_path = public
AS $$
DECLARE
    total_providers_count INTEGER;
    pending_providers_count INTEGER;
    total_services_count INTEGER;
    total_leads_count INTEGER;
BEGIN
    -- Check if caller is admin
    IF NOT public.has_role(auth.uid(), 'admin') THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- 1. Total Providers (Users with role 'provider')
    SELECT COUNT(*) INTO total_providers_count 
    FROM public.users 
    WHERE role = 'provider';

    -- 2. Pending Validations (Providers table moderation_status)
    SELECT COUNT(*) INTO pending_providers_count 
    FROM public.providers 
    WHERE moderation_status = 'pending';

    -- 3. Total Services (Active)
    SELECT COUNT(*) INTO total_services_count 
    FROM public.services 
    WHERE is_active = true;

    -- 4. Total Leads (Analytics Events - clicks)
    -- Assuming 'contact_click' is the event type for leads
    SELECT COUNT(*) INTO total_leads_count 
    FROM public.analytics_events 
    WHERE event_type LIKE '%click%'; 

    RETURN json_build_object(
        'total_providers', total_providers_count,
        'pending_validations', pending_providers_count,
        'total_services', total_services_count,
        'total_leads_generated', total_leads_count
    );
END;
$$;


-- 3. UPDATE RLS FOR GLOBAL ADMIN ACCESS
-- ============================================

-- Function helper to check role column directly (faster than join)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Policy Updates: Add "Admins can view all" to key tables if not already present
-- (Using DROP/CREATE to ensure idempotency and correct definition using the new role col or helper)

-- Providers
DROP POLICY IF EXISTS "Admins can manage all providers" ON public.providers;
CREATE POLICY "Admins can manage all providers"
    ON public.providers FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Services
DROP POLICY IF EXISTS "Admins can manage all services" ON public.services;
CREATE POLICY "Admins can manage all services"
    ON public.services FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Analytics
DROP POLICY IF EXISTS "Admins can view all analytics" ON public.analytics_events;
CREATE POLICY "Admins can view all analytics"
    ON public.analytics_events FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Users/Profiles
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users"
    ON public.users FOR SELECT
    TO authenticated
    USING (public.is_admin());

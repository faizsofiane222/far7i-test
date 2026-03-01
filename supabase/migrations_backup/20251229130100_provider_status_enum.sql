-- Migration: Provider Status Management
-- Adds proper status enum and tracking fields

-- 2. UPDATE PROVIDERS TABLE
-- ==========================================
-- Just ensure valid values (keep as VARCHAR for now)
UPDATE public.providers
SET moderation_status = 'incomplete'
WHERE moderation_status NOT IN ('pending', 'approved', 'rejected', 'incomplete');

-- Set default
ALTER TABLE public.providers
ALTER COLUMN moderation_status SET DEFAULT 'incomplete';

-- 3. ADD TRACKING FIELDS
-- ==========================================
ALTER TABLE public.providers
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id);

-- 4. ADD INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_providers_status ON public.providers(moderation_status);
CREATE INDEX IF NOT EXISTS idx_providers_submitted ON public.providers(submitted_at DESC) WHERE submitted_at IS NOT NULL;

-- 5. UPDATE RLS POLICIES
-- ==========================================
-- Drop all existing policies
DROP POLICY IF EXISTS "Public can view providers" ON public.providers;
DROP POLICY IF EXISTS "Public can view approved providers" ON public.providers;
DROP POLICY IF EXISTS "Providers can view own profile" ON public.providers;
DROP POLICY IF EXISTS "Admins can view all providers" ON public.providers;
DROP POLICY IF EXISTS "Admins can update all providers" ON public.providers;
DROP POLICY IF EXISTS "Providers can update own profile" ON public.providers;
DROP POLICY IF EXISTS "Users can create provider profile" ON public.providers;

-- Recreate policies with correct logic
-- Public sees ONLY approved providers
CREATE POLICY "Public can view approved providers"
    ON public.providers FOR SELECT
    USING (moderation_status = 'approved');

-- Providers see their own (any status)
CREATE POLICY "Providers can view own profile"
    ON public.providers FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Admins see all
CREATE POLICY "Admins can view all providers"
    ON public.providers FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Providers can update their own
CREATE POLICY "Providers can update own profile"
    ON public.providers FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

-- Admins can update all
CREATE POLICY "Admins can update all providers"
    ON public.providers FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Users can create their provider profile
CREATE POLICY "Users can create provider profile"
    ON public.providers FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

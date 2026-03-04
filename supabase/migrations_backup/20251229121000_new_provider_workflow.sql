-- Migration: New Provider Workflow
-- Ensures new providers require admin approval

-- 1. UPDATE DEFAULT STATUS FOR NEW PROVIDERS
-- ==========================================
-- New providers should be 'pending' by default
ALTER TABLE public.providers 
ALTER COLUMN moderation_status SET DEFAULT 'pending';

-- Add index for faster moderation queries
CREATE INDEX IF NOT EXISTS idx_providers_moderation_status ON public.providers(moderation_status);
CREATE INDEX IF NOT EXISTS idx_providers_created_at ON public.providers(created_at);

-- 2. RPC: APPROVE NEW PROVIDER
-- ==========================================
CREATE OR REPLACE FUNCTION public.approve_new_provider(provider_id UUID)
RETURNS VOID AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    UPDATE public.providers
    SET 
        moderation_status = 'approved',
        updated_at = NOW()
    WHERE id = provider_id AND moderation_status = 'pending' AND pending_changes IS NULL;
    
    -- TODO: Could trigger welcome notification to provider here
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RPC: REJECT NEW PROVIDER
-- ==========================================
CREATE OR REPLACE FUNCTION public.reject_new_provider(provider_id UUID, reason TEXT)
RETURNS VOID AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    UPDATE public.providers
    SET 
        moderation_status = 'rejected',
        admin_notes = reason,
        updated_at = NOW()
    WHERE id = provider_id;
    
    -- TODO: Could trigger rejection notification to provider here
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RPC: GET MODERATION STATISTICS
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_moderation_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    SELECT json_build_object(
        'new_providers', (
            SELECT COUNT(*) FROM public.providers 
            WHERE moderation_status = 'pending' AND pending_changes IS NULL
        ),
        'pending_provider_changes', (
            SELECT COUNT(*) FROM public.providers 
            WHERE pending_changes IS NOT NULL
        ),
        'pending_service_changes', (
            SELECT COUNT(*) FROM public.services 
            WHERE pending_changes IS NOT NULL
        ),
        'pending_reviews', (
            SELECT COUNT(*) FROM public.reviews 
            WHERE moderation_status = 'pending'
        ),
        'approved_today', (
            SELECT COUNT(*) FROM public.providers 
            WHERE moderation_status = 'approved' 
            AND DATE(updated_at) = CURRENT_DATE
        ) + (
            SELECT COUNT(*) FROM public.reviews 
            WHERE moderation_status = 'approved' 
            AND DATE(moderated_at) = CURRENT_DATE
        ),
        'rejected_today', (
            SELECT COUNT(*) FROM public.providers 
            WHERE moderation_status = 'rejected' 
            AND DATE(updated_at) = CURRENT_DATE
        ) + (
            SELECT COUNT(*) FROM public.reviews 
            WHERE moderation_status = 'rejected' 
            AND DATE(moderated_at) = CURRENT_DATE
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. UPDATE RLS POLICIES
-- ==========================================
-- Only approved providers visible to public
DROP POLICY IF EXISTS "Public can view providers" ON public.providers;
CREATE POLICY "Public can view approved providers"
    ON public.providers FOR SELECT
    USING (moderation_status = 'approved');

-- Providers can see their own profile regardless of status
CREATE POLICY "Providers can view own profile"
    ON public.providers FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Admins can see all providers
CREATE POLICY "Admins can view all providers"
    ON public.providers FOR SELECT
    TO authenticated
    USING (public.is_admin());

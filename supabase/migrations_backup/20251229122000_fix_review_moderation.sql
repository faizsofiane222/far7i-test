-- Fix: Use existing 'status' column in reviews table instead of adding 'moderation_status'
-- The reviews table already has a 'status' column that serves the same purpose

-- Update the RPC functions to use 'status' instead of 'moderation_status'

-- 1. UPDATE APPROVE REVIEW FUNCTION
-- ==========================================
CREATE OR REPLACE FUNCTION public.approve_review(review_id UUID)
RETURNS VOID AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    UPDATE public.reviews
    SET 
        status = 'approved',
        updated_at = NOW()
    WHERE id = review_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. UPDATE REJECT REVIEW FUNCTION
-- ==========================================
CREATE OR REPLACE FUNCTION public.reject_review(review_id UUID, reason TEXT)
RETURNS VOID AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    -- Add admin_notes column if it doesn't exist
    ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS admin_notes TEXT;
    
    UPDATE public.reviews
    SET 
        status = 'rejected',
        admin_notes = reason,
        updated_at = NOW()
    WHERE id = review_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. UPDATE STATS FUNCTION TO USE 'status' COLUMN
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
            WHERE status = 'pending'
        ),
        'approved_today', (
            SELECT COUNT(*) FROM public.providers 
            WHERE moderation_status = 'approved' 
            AND DATE(updated_at) = CURRENT_DATE
        ) + (
            SELECT COUNT(*) FROM public.reviews 
            WHERE status = 'approved' 
            AND DATE(updated_at) = CURRENT_DATE
        ),
        'rejected_today', (
            SELECT COUNT(*) FROM public.providers 
            WHERE moderation_status = 'rejected' 
            AND DATE(updated_at) = CURRENT_DATE
        ) + (
            SELECT COUNT(*) FROM public.reviews 
            WHERE status = 'rejected' 
            AND DATE(updated_at) = CURRENT_DATE
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. ADD ADMIN_NOTES COLUMN TO REVIEWS IF NOT EXISTS
-- ==========================================
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reviews') THEN
        ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS admin_notes TEXT;
    END IF;
END $$;

-- 5. UPDATE RLS POLICIES FOR REVIEWS
-- ==========================================
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reviews') THEN
        -- Drop existing policies
        DROP POLICY IF EXISTS "Public can view reviews" ON public.reviews;
        DROP POLICY IF EXISTS "Public can view approved reviews" ON public.reviews;
        DROP POLICY IF EXISTS "Admins can view all reviews" ON public.reviews;
        DROP POLICY IF EXISTS "Users can view own reviews" ON public.reviews;
        DROP POLICY IF EXISTS "Clients can view their own reviews" ON public.reviews;
        
        -- Only show approved reviews to public
        CREATE POLICY "Public can view approved reviews"
            ON public.reviews FOR SELECT
            USING (status = 'approved');

        -- Admins can see all reviews
        CREATE POLICY "Admins can view all reviews"
            ON public.reviews FOR SELECT
            TO authenticated
            USING (public.is_admin());

        -- Users can see their own reviews regardless of status
        CREATE POLICY "Users can view own reviews"
            ON public.reviews FOR SELECT
            TO authenticated
            USING (client_id = auth.uid());
    END IF;
END $$;

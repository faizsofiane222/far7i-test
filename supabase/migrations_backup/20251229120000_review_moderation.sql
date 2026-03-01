-- Migration: Review Moderation System
-- Adds moderation capabilities for reviews/comments

-- 1. ADD MODERATION COLUMNS TO REVIEWS
-- ==========================================
DO $$
BEGIN
    -- Only alter if reviews table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reviews') THEN
        ALTER TABLE public.reviews
        ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'pending',
        ADD COLUMN IF NOT EXISTS admin_notes TEXT,
        ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES auth.users(id);

        -- Create index for faster queries
        CREATE INDEX IF NOT EXISTS idx_reviews_moderation_status ON public.reviews(moderation_status);
    END IF;
END $$;

-- 2. RPC: APPROVE REVIEW
-- ==========================================
CREATE OR REPLACE FUNCTION public.approve_review(review_id UUID)
RETURNS VOID AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    UPDATE public.reviews
    SET 
        moderation_status = 'approved',
        moderated_at = NOW(),
        moderated_by = auth.uid()
    WHERE id = review_id;
    
    -- TODO: Could trigger notification to provider here
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RPC: REJECT REVIEW
-- ==========================================
CREATE OR REPLACE FUNCTION public.reject_review(review_id UUID, reason TEXT)
RETURNS VOID AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    UPDATE public.reviews
    SET 
        moderation_status = 'rejected',
        admin_notes = reason,
        moderated_at = NOW(),
        moderated_by = auth.uid()
    WHERE id = review_id;
    
    -- TODO: Could trigger notification to reviewer here
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: RLS policies for reviews will be added in a later migration
-- after the reviews table is created in the main schema migration

-- Migration: Review Workflow RPC Functions
-- Complete workflow for review moderation with notifications

-- 1. APPROVE REVIEW WITH NOTIFICATION
-- ==========================================
CREATE OR REPLACE FUNCTION public.approve_review_with_notification(review_id UUID)
RETURNS JSON AS $$
DECLARE
    review_author_id UUID;
    provider_id_val UUID;
    provider_name VARCHAR;
BEGIN
    -- Check admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    -- Get review info
    SELECT r.client_id, r.provider_id, p.commercial_name
    INTO review_author_id, provider_id_val, provider_name
    FROM public.reviews r
    JOIN public.providers p ON r.provider_id = p.id
    WHERE r.id = review_id;
    
    IF review_author_id IS NULL THEN
        RAISE EXCEPTION 'Review not found';
    END IF;
    
    -- Update status
    UPDATE public.reviews
    SET status = 'approved', updated_at = NOW()
    WHERE id = review_id;
    
    -- Notify author
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
        review_author_id,
        'review_approved',
        '✅ Avis publié',
        'Votre avis sur "' || provider_name || '" a été approuvé et est maintenant visible.',
        '/providers/' || provider_id_val
    );
    
    RETURN json_build_object('success', true, 'message', 'Avis approuvé');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. REJECT REVIEW WITH NOTIFICATION
-- ==========================================
CREATE OR REPLACE FUNCTION public.reject_review_with_notification(
    review_id UUID,
    reason TEXT
)
RETURNS JSON AS $$
DECLARE
    review_author_id UUID;
BEGIN
    -- Check admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    -- Validate reason
    IF reason IS NULL OR TRIM(reason) = '' THEN
        RAISE EXCEPTION 'Rejection reason is required';
    END IF;
    
    -- Get review info
    SELECT client_id INTO review_author_id
    FROM public.reviews
    WHERE id = review_id;
    
    IF review_author_id IS NULL THEN
        RAISE EXCEPTION 'Review not found';
    END IF;
    
    -- Update status
    UPDATE public.reviews
    SET 
        status = 'rejected',
        admin_notes = reason,
        updated_at = NOW()
    WHERE id = review_id;
    
    -- Notify author
    INSERT INTO public.notifications (user_id, type, title, message)
    VALUES (
        review_author_id,
        'review_rejected',
        '⚠️ Avis non publié',
        'Votre avis n''a pas été approuvé. Raison: ' || reason
    );
    
    RETURN json_build_object('success', true, 'message', 'Avis rejeté');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

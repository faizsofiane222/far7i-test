-- Migration: Provider Workflow RPC Functions
-- Complete workflow for provider submission, approval, and rejection

-- 1. SUBMIT PROVIDER FOR VALIDATION
-- ==========================================
CREATE OR REPLACE FUNCTION public.submit_provider_for_validation(provider_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
    current_user_id UUID;
    provider_name VARCHAR;
BEGIN
    current_user_id := auth.uid();
    
    -- Verify ownership
    IF NOT EXISTS (
        SELECT 1 FROM public.providers 
        WHERE id = provider_id AND user_id = current_user_id
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    -- Get provider name
    SELECT commercial_name INTO provider_name
    FROM public.providers
    WHERE id = provider_id;
    
    -- Update status
    UPDATE public.providers
    SET 
        moderation_status = 'pending',
        submitted_at = NOW(),
        updated_at = NOW()
    WHERE id = provider_id;
    
    -- Create notifications for all admins
    INSERT INTO public.notifications (user_id, type, title, message, link)
    SELECT 
        ur.user_id,
        'new_provider_submission',
        'Nouveau prestataire à valider',
        'Le prestataire "' || provider_name || '" a soumis son profil pour validation',
        '/admin/moderation'
    FROM public.user_roles ur
    WHERE ur.role = 'admin';
    
    SELECT json_build_object(
        'success', true,
        'message', 'Profil soumis pour validation'
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. APPROVE PROVIDER
-- ==========================================
CREATE OR REPLACE FUNCTION public.approve_provider_with_notification(provider_id UUID)
RETURNS JSON AS $$
DECLARE
    provider_user_id UUID;
    provider_name VARCHAR;
BEGIN
    -- Check admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    -- Get provider info
    SELECT user_id, commercial_name INTO provider_user_id, provider_name
    FROM public.providers
    WHERE id = provider_id;
    
    IF provider_user_id IS NULL THEN
        RAISE EXCEPTION 'Provider not found';
    END IF;
    
    -- Update status
    UPDATE public.providers
    SET 
        moderation_status = 'approved',
        reviewed_at = NOW(),
        reviewed_by = auth.uid(),
        admin_notes = NULL,
        pending_changes = NULL,
        updated_at = NOW()
    WHERE id = provider_id;
    
    -- Notify provider
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
        provider_user_id,
        'provider_approved',
        '🎉 Profil approuvé !',
        'Félicitations ! Votre profil a été approuvé et est maintenant visible sur la marketplace.',
        '/partner/dashboard'
    );
    
    RETURN json_build_object(
        'success', true,
        'provider_name', provider_name,
        'message', 'Prestataire approuvé avec succès'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. REJECT PROVIDER
-- ==========================================
CREATE OR REPLACE FUNCTION public.reject_provider_with_notification(
    provider_id UUID,
    reason TEXT
)
RETURNS JSON AS $$
DECLARE
    provider_user_id UUID;
    provider_name VARCHAR;
BEGIN
    -- Check admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    -- Validate reason
    IF reason IS NULL OR TRIM(reason) = '' THEN
        RAISE EXCEPTION 'Rejection reason is required';
    END IF;
    
    -- Get provider info
    SELECT user_id, commercial_name INTO provider_user_id, provider_name
    FROM public.providers
    WHERE id = provider_id;
    
    IF provider_user_id IS NULL THEN
        RAISE EXCEPTION 'Provider not found';
    END IF;
    
    -- Update status
    UPDATE public.providers
    SET 
        moderation_status = 'rejected',
        admin_notes = reason,
        reviewed_at = NOW(),
        reviewed_by = auth.uid(),
        updated_at = NOW()
    WHERE id = provider_id;
    
    -- Notify provider
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
        provider_user_id,
        'provider_rejected',
        '⚠️ Profil nécessite des modifications',
        'Votre profil a été examiné. Raison du rejet: ' || reason || '. Vous pouvez modifier votre profil et le resoumettre.',
        '/partner/dashboard/profile'
    );
    
    RETURN json_build_object(
        'success', true,
        'provider_name', provider_name,
        'message', 'Prestataire rejeté'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. GET PROVIDER STATUS INFO
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_provider_status_info(provider_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'id', id,
        'commercial_name', commercial_name,
        'moderation_status', moderation_status,
        'submitted_at', submitted_at,
        'reviewed_at', reviewed_at,
        'admin_notes', admin_notes,
        'can_submit', (moderation_status IN ('incomplete', 'rejected'))
    ) INTO result
    FROM public.providers
    WHERE id = provider_id
    AND (user_id = auth.uid() OR public.is_admin());
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

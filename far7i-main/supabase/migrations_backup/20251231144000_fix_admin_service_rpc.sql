-- Fix Admin RPC: Use correct column name for services table
-- services table has 'moderated_at', not 'reviewed_at'

CREATE OR REPLACE FUNCTION public.approve_service_with_notification(service_id UUID)
RETURNS VOID AS $$
DECLARE
    p_user_id UUID;
    s_title TEXT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    SELECT p.user_id, s.title INTO p_user_id, s_title
    FROM public.services s
    JOIN public.providers p ON s.provider_id = p.id
    WHERE s.id = service_id;

    -- Update using moderated_at instead of reviewed_at
    UPDATE public.services
    SET 
        moderation_status = 'approved',
        moderated_at = NOW(),
        updated_at = NOW()
    WHERE id = service_id;

    -- Notify Provider
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
        p_user_id,
        'service_new_approved',
        '🎉 Nouvelle prestation en ligne !',
        'Votre prestation "' || s_title || '" a été approuvée et est désormais visible.',
        '/partner/dashboard/services'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

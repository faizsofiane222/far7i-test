-- Migration: Cleanup commune_id and fix RPC functions
-- Date: 2026-03-03

-- 1. Remove the foreign key constraint
ALTER TABLE public.providers DROP CONSTRAINT IF EXISTS providers_commune_id_fkey;

-- 2. Remove the column commune_id
ALTER TABLE public.providers DROP COLUMN IF EXISTS commune_id;

-- 3. Update the approve_provider_changes function (removed commune_id line)
CREATE OR REPLACE FUNCTION public.approve_provider_changes(target_provider_id UUID)
RETURNS VOID AS $$
DECLARE
    pending_data JSONB;
    p_user_id UUID;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    SELECT user_id, pending_changes INTO p_user_id, pending_data 
    FROM public.providers 
    WHERE id = target_provider_id;

    IF pending_data IS NULL THEN
        RAISE EXCEPTION 'No pending changes found';
    END IF;

    UPDATE public.providers
    SET
        commercial_name = COALESCE((pending_data->>'commercial_name'), commercial_name),
        bio = COALESCE((pending_data->>'bio'), bio),
        profile_picture_url = COALESCE((pending_data->>'profile_picture_url'), profile_picture_url),
        phone_number = COALESCE((pending_data->>'phone_number'), phone_number),
        wilaya_id = COALESCE((pending_data->>'wilaya_id')::UUID, wilaya_id),
        -- commune_id removed here
        social_link = COALESCE((pending_data->>'social_link'), social_link),
        website_link = COALESCE((pending_data->>'website_link'), website_link),
        willingness_to_travel = COALESCE((pending_data->>'willingness_to_travel')::BOOLEAN, willingness_to_travel),
        is_whatsapp_active = COALESCE((pending_data->>'is_whatsapp_active')::BOOLEAN, is_whatsapp_active),
        is_viber_active = COALESCE((pending_data->>'is_viber_active')::BOOLEAN, is_viber_active),
        
        moderation_status = 'approved',
        pending_changes = NULL,
        modification_submitted = FALSE,
        updated_at = NOW()
    WHERE id = target_provider_id;

    -- Notify Provider
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
        p_user_id,
        'provider_info_updated',
        '✅ Profil mis à jour !',
        'Les modifications apportées à votre profil ont été approuvées.',
        '/partner/dashboard/profile'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- FIX RPC VISIBILITY & SIGNATURES
-- ============================================================

-- Drop old versions to ensure clean state
DROP FUNCTION IF EXISTS public.handle_profile_moderation(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.handle_prestation_moderation(UUID, TEXT, TEXT);

-- 1. handle_profile_moderation (Standard Signature)
CREATE OR REPLACE FUNCTION public.handle_profile_moderation(
    p_user_id UUID, 
    p_action TEXT, 
    p_reason TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_updates JSONB;
BEGIN
    IF p_action = 'approve' THEN
        SELECT pending_updates INTO v_updates FROM public.users WHERE user_id = p_user_id;
        UPDATE public.users SET status = 'approved', pending_updates = NULL, rejection_reason = NULL, updated_at = NOW() WHERE user_id = p_user_id;
        UPDATE public.providers SET 
            commercial_name = COALESCE((v_updates->>'commercial_name'), commercial_name),
            bio = COALESCE((v_updates->>'bio'), bio),
            profile_picture_url = COALESCE((v_updates->>'profile_picture_url'), profile_picture_url),
            wilaya_id = CASE WHEN (v_updates->>'wilaya_id') IS NOT NULL AND (v_updates->>'wilaya_id') <> '' THEN (v_updates->>'wilaya_id')::uuid ELSE wilaya_id END,
            phone_number = COALESCE((v_updates->>'phone_number'), phone_number),
            social_link = COALESCE((v_updates->>'social_link'), social_link),
            is_whatsapp_active = COALESCE((v_updates->>'is_whatsapp_active')::boolean, is_whatsapp_active),
            is_viber_active = COALESCE((v_updates->>'is_viber_active')::boolean, is_viber_active),
            updated_at = NOW()
        WHERE user_id = p_user_id;
    ELSIF p_action = 'reject' THEN
        UPDATE public.users SET status = 'rejected', rejection_reason = p_reason, updated_at = NOW() WHERE user_id = p_user_id;
    END IF;
    RETURN TRUE;
END;
$$;

-- 2. handle_prestation_moderation (Standard Signature)
CREATE OR REPLACE FUNCTION public.handle_prestation_moderation(
    p_provider_id UUID, 
    p_action TEXT, 
    p_reason TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_action = 'approve' THEN
        UPDATE public.providers SET 
            status = 'approved', moderation_status = 'approved', rejection_reason = NULL,
            commercial_name = COALESCE((pending_updates->>'commercial_name'), commercial_name),
            bio = COALESCE((pending_updates->>'bio'), bio),
            profile_picture_url = COALESCE((pending_updates->>'profile_picture_url'), profile_picture_url),
            base_price = COALESCE((pending_updates->>'base_price')::numeric, base_price),
            pending_updates = NULL, updated_at = NOW()
        WHERE id = p_provider_id;
    ELSIF p_action = 'reject' THEN
        UPDATE public.providers SET status = 'rejected', moderation_status = 'rejected', rejection_reason = p_reason, updated_at = NOW() WHERE id = p_provider_id;
    END IF;
    RETURN TRUE;
END;
$$;

-- 3. Overloads to prevent 404 when reason is omitted in JSON
CREATE OR REPLACE FUNCTION public.handle_profile_moderation(p_user_id UUID, p_action TEXT) RETURNS BOOLEAN AS $$ 
    SELECT public.handle_profile_moderation($1, $2, NULL); 
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_prestation_moderation(p_provider_id UUID, p_action TEXT) RETURNS BOOLEAN AS $$ 
    SELECT public.handle_prestation_moderation($1, $2, NULL); 
$$ LANGUAGE sql SECURITY DEFINER;

-- 4. Expanded Grants
GRANT EXECUTE ON FUNCTION public.handle_profile_moderation(UUID, TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_profile_moderation(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_prestation_moderation(UUID, TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_prestation_moderation(UUID, TEXT) TO authenticated, service_role;

-- Force Cache Reload
NOTIFY pgrst, 'reload schema';

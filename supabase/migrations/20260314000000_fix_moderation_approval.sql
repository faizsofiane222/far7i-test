-- Fix approve_moderation_item to sync status and apply changes
CREATE OR REPLACE FUNCTION public.approve_moderation_item(p_table TEXT, p_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    IF p_table = 'users' THEN
        -- 1. Get the user_id (Auth UUID)
        SELECT user_id INTO v_user_id FROM public.users WHERE id = p_id;
        
        -- 2. Update users status
        UPDATE public.users 
        SET 
            status = 'approved', 
            pending_updates = NULL,
            updated_at = NOW()
        WHERE id = p_id;
        
        -- 3. SYNC: Update all associated providers to approved
        -- Also apply any pending_changes to the first provider entry if found
        UPDATE public.providers 
        SET 
            moderation_status = 'approved',
            status = 'approved', -- IMPORTANT: get_admin_moderation_list checks status first!
            commercial_name = COALESCE((pending_changes->>'commercial_name'), commercial_name),
            bio = COALESCE((pending_changes->>'bio'), bio),
            profile_picture_url = COALESCE((pending_changes->>'profile_picture_url'), profile_picture_url),
            wilaya_id = CASE 
                WHEN (pending_changes->>'wilaya_id') IS NOT NULL AND (pending_changes->>'wilaya_id') <> '' 
                THEN (pending_changes->>'wilaya_id')::uuid 
                ELSE wilaya_id 
            END,
            phone_number = COALESCE((pending_changes->>'phone_number'), phone_number),
            social_link = COALESCE((pending_changes->>'social_link'), social_link),
            provider_type = CASE 
                WHEN (pending_changes->>'provider_type') IS NOT NULL AND (pending_changes->>'provider_type') <> '' 
                THEN (pending_changes->>'provider_type')::provider_type 
                ELSE provider_type 
            END,
            is_whatsapp_active = COALESCE((pending_changes->>'is_whatsapp_active')::boolean, is_whatsapp_active),
            is_viber_active = COALESCE((pending_changes->>'is_viber_active')::boolean, is_viber_active),
            pending_changes = NULL,
            updated_at = NOW()
        WHERE user_id = v_user_id;

    ELSIF p_table = 'providers' THEN
        -- Update specific provider
        UPDATE public.providers 
        SET 
            moderation_status = 'approved',
            status = 'approved',
            commercial_name = COALESCE((pending_changes->>'commercial_name'), commercial_name),
            bio = COALESCE((pending_changes->>'bio'), bio),
            profile_picture_url = COALESCE((pending_changes->>'profile_picture_url'), profile_picture_url),
             wilaya_id = CASE 
                WHEN (pending_changes->>'wilaya_id') IS NOT NULL AND (pending_changes->>'wilaya_id') <> '' 
                THEN (pending_changes->>'wilaya_id')::uuid 
                ELSE wilaya_id 
            END,
            phone_number = COALESCE((pending_changes->>'phone_number'), phone_number),
            social_link = COALESCE((pending_changes->>'social_link'), social_link),
            provider_type = CASE 
                WHEN (pending_changes->>'provider_type') IS NOT NULL AND (pending_changes->>'provider_type') <> '' 
                THEN (pending_changes->>'provider_type')::provider_type 
                ELSE provider_type 
            END,
            is_whatsapp_active = COALESCE((pending_changes->>'is_whatsapp_active')::boolean, is_whatsapp_active),
            is_viber_active = COALESCE((pending_changes->>'is_viber_active')::boolean, is_viber_active),
            pending_changes = NULL,
            updated_at = NOW()
        WHERE id = p_id;
        
        -- SYNC: Also ensure users status is approved if AT LEAST one provider is approved
        SELECT user_id INTO v_user_id FROM public.providers WHERE id = p_id;
        UPDATE public.users SET status = 'approved' WHERE user_id = v_user_id;

    ELSIF p_table = 'reviews' THEN
        UPDATE public.reviews SET status = 'approved' WHERE id = p_id;
    END IF;
    
    RETURN TRUE;
END;
$$;

-- Fix reject_moderation_item to sync rejection status
CREATE OR REPLACE FUNCTION public.reject_moderation_item(p_table TEXT, p_id UUID, p_reason TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    IF p_table = 'users' THEN
        -- Get the user_id (Auth UUID)
        SELECT user_id INTO v_user_id FROM public.users WHERE id = p_id;
        
        UPDATE public.users SET status = 'rejected', rejection_reason = p_reason WHERE id = p_id;
        
        -- SYNC: Mark all associated providers as rejected if identity is rejected
        UPDATE public.providers SET moderation_status = 'rejected', status = 'rejected' WHERE user_id = v_user_id;

    ELSIF p_table = 'providers' THEN
        UPDATE public.providers SET moderation_status = 'rejected', status = 'rejected', rejection_reason = p_reason WHERE id = p_id;
        
        -- Note: We don't necessarily reject the user identity if one specific prestation is rejected.
    ELSIF p_table = 'reviews' THEN
        UPDATE public.reviews SET status = 'rejected', rejection_reason = p_reason WHERE id = p_id;
    END IF;
    
    RETURN TRUE;
END;
$$;

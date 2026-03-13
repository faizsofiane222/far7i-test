-- Fix approve_moderation_item to sync status and apply changes
CREATE OR REPLACE FUNCTION public.approve_moderation_item(p_table TEXT, p_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_updates JSONB;
BEGIN
    IF p_table = 'users' THEN
        -- 1. Get the profile metadata (using correct column pending_updates)
        SELECT pending_updates, user_id INTO v_updates, v_user_id FROM public.users WHERE id = p_id;
        
        -- Fallback: if not found by id, try matching p_id to user_id directly
        IF v_user_id IS NULL THEN
            SELECT pending_updates, user_id INTO v_updates, v_user_id FROM public.users WHERE user_id = p_id;
        END IF;

        -- 2. Update users status
        UPDATE public.users 
        SET 
            status = 'approved', 
            pending_updates = NULL,
            updated_at = NOW()
        WHERE id = p_id OR user_id = p_id;
        
        -- 3. SYNC: Update all associated providers to approved
        UPDATE public.providers 
        SET 
            moderation_status = 'approved',
            status = 'approved',
            commercial_name = COALESCE((pending_updates->>'commercial_name'), commercial_name),
            bio = COALESCE((pending_updates->>'bio'), bio),
            profile_picture_url = COALESCE((pending_updates->>'profile_picture_url'), profile_picture_url),
            wilaya_id = CASE 
                WHEN (pending_updates->>'wilaya_id') IS NOT NULL AND (pending_updates->>'wilaya_id') <> '' 
                THEN (pending_updates->>'wilaya_id')::uuid 
                ELSE wilaya_id 
            END,
            phone_number = COALESCE((pending_updates->>'phone_number'), phone_number),
            social_link = COALESCE((pending_updates->>'social_link'), social_link),
            provider_type = CASE 
                WHEN (pending_updates->>'provider_type') IS NOT NULL AND (pending_updates->>'provider_type') <> '' 
                THEN (pending_updates->>'provider_type')::provider_type 
                ELSE provider_type 
            END,
            is_whatsapp_active = COALESCE((pending_updates->>'is_whatsapp_active')::boolean, is_whatsapp_active),
            is_viber_active = COALESCE((pending_updates->>'is_viber_active')::boolean, is_viber_active),
            pending_updates = NULL,
            updated_at = NOW()
        WHERE user_id = v_user_id;

    ELSIF p_table = 'providers' THEN
        -- Update specific provider
        UPDATE public.providers 
        SET 
            moderation_status = 'approved',
            status = 'approved',
            commercial_name = COALESCE((pending_updates->>'commercial_name'), commercial_name),
            bio = COALESCE((pending_updates->>'bio'), bio),
            profile_picture_url = COALESCE((pending_updates->>'profile_picture_url'), profile_picture_url),
            wilaya_id = CASE 
                WHEN (pending_updates->>'wilaya_id') IS NOT NULL AND (pending_updates->>'wilaya_id') <> '' 
                THEN (pending_updates->>'wilaya_id')::uuid 
                ELSE wilaya_id 
            END,
            phone_number = COALESCE((pending_updates->>'phone_number'), phone_number),
            social_link = COALESCE((pending_updates->>'social_link'), social_link),
            provider_type = CASE 
                WHEN (pending_updates->>'provider_type') IS NOT NULL AND (pending_updates->>'provider_type') <> '' 
                THEN (pending_updates->>'provider_type')::provider_type 
                ELSE provider_type 
            END,
            is_whatsapp_active = COALESCE((pending_updates->>'is_whatsapp_active')::boolean, is_whatsapp_active),
            is_viber_active = COALESCE((pending_updates->>'is_viber_active')::boolean, is_viber_active),
            pending_updates = NULL,
            updated_at = NOW()
        WHERE id = p_id;
        
        -- SYNC: Also ensure users status is approved if AT LEAST one provider is approved
        SELECT user_id INTO v_user_id FROM public.providers WHERE id = p_id;
        UPDATE public.users SET status = 'approved' WHERE user_id = v_user_id OR id = v_user_id;

    ELSIF p_table = 'reviews' THEN
        UPDATE public.reviews SET status = 'approved' WHERE id = p_id;
    END IF;
    
    RETURN TRUE;
END;
$$;

-- Refined Moderation List function to ensure status consistency
CREATE OR REPLACE FUNCTION public.get_admin_moderation_list()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN (
        SELECT json_agg(partner)
        FROM (
            SELECT 
                u.id as user_id,
                u.display_name,
                u.email,
                (
                    SELECT json_build_object(
                        'id', u.id,
                        'display_name', u.display_name,
                        'email', u.email,
                        'status', COALESCE(u.status, 'pending'),
                        'rejection_reason', u.rejection_reason,
                        'pending_updates', u.pending_updates,
                        'created_at', u.created_at,
                        'commercial_name', p_main.commercial_name,
                        'provider_type', p_main.provider_type,
                        'phone_number', p_main.phone_number,
                        'social_link', p_main.social_link,
                        'moderation_status', COALESCE(u.status, p_main.moderation_status, 'pending'), -- Priority to user status
                        'is_whatsapp_active', p_main.is_whatsapp_active,
                        'is_viber_active', p_main.is_viber_active,
                        'wilaya_id', p_main.wilaya_id
                    )
                    FROM public.providers p_main
                    WHERE p_main.user_id = u.user_id
                    LIMIT 1
                ) as profile,
                COALESCE(
                    (
                        SELECT json_agg(p_item)
                        FROM (
                            SELECT 
                                p.id,
                                p.commercial_name,
                                p.provider_type,
                                p.phone_number,
                                p.social_link,
                                p.is_whatsapp_active,
                                p.is_viber_active,
                                p.wilaya_id,
                                COALESCE(p.status, p.moderation_status, 'pending') as status,
                                p.moderation_status,
                                p.rejection_reason,
                                p.pending_updates,
                                p.created_at,
                                COALESCE(
                                    (
                                        SELECT json_agg(m)
                                        FROM (
                                            SELECT media_url, is_main
                                            FROM public.provider_media
                                            WHERE provider_id = p.id
                                        ) m
                                    ), '[]'::json
                                ) as gallery,
                                COALESCE(
                                    (
                                        SELECT json_agg(r_item)
                                        FROM (
                                            SELECT 
                                                r.id, r.client_name, r.rating,
                                                r.comment, r.status, r.rejection_reason, r.created_at
                                            FROM public.reviews r
                                            WHERE r.provider_id = p.id
                                            ORDER BY r.created_at DESC
                                        ) r_item
                                    ), '[]'::json
                                ) as reviews
                            FROM public.providers p
                            WHERE p.user_id = u.user_id
                        ) p_item
                    ), '[]'::json
                ) as prestations
            FROM public.users u
            WHERE EXISTS (
                SELECT 1 FROM public.user_roles ur 
                WHERE ur.user_id = u.user_id AND ur.role = 'provider'
            )
            ORDER BY u.created_at DESC
        ) partner
    );
END;
$$;


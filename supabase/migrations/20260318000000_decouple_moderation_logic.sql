-- ============================================================
-- DECOUPLE MODERATION LOGIC (PROFILE VS PRESTATION)
-- ============================================================

-- 1. Update status labels to match official requirements
INSERT INTO public.moderation_statuses (slug, label, color_bg, color_text)
VALUES 
    ('pending', 'En attente de validation', 'bg-orange-100', 'text-orange-700'),
    ('approved', 'Validé', 'bg-emerald-100', 'text-emerald-700'),
    ('rejected', 'Rejeté', 'bg-red-100', 'text-red-700')
ON CONFLICT (slug) DO UPDATE SET 
    label = EXCLUDED.label;

-- 2. Independent RPC: handle_profile_moderation
-- This handles ONLY the user profile info (users table + provider header)
CREATE OR REPLACE FUNCTION public.handle_profile_moderation(
    p_user_id UUID, 
    p_action TEXT, -- 'approve' or 'reject'
    p_reason TEXT DEFAULT NULL
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
        -- Get pending updates
        SELECT pending_updates INTO v_updates FROM public.users WHERE user_id = p_user_id;

        -- 1. Update Users Table
        UPDATE public.users 
        SET 
            status = 'approved', 
            pending_updates = NULL,
            rejection_reason = NULL,
            updated_at = NOW()
        WHERE user_id = p_user_id;
        
        -- 2. Update Provider Header (Sync shared info if any)
        UPDATE public.providers 
        SET 
            commercial_name = COALESCE((v_updates->>'commercial_name'), commercial_name),
            bio = COALESCE((v_updates->>'bio'), bio),
            profile_picture_url = COALESCE((v_updates->>'profile_picture_url'), profile_picture_url),
            wilaya_id = CASE 
                WHEN (v_updates->>'wilaya_id') IS NOT NULL AND (v_updates->>'wilaya_id') <> '' 
                THEN (v_updates->>'wilaya_id')::uuid 
                ELSE wilaya_id 
            END,
            phone_number = COALESCE((v_updates->>'phone_number'), phone_number),
            social_link = COALESCE((v_updates->>'social_link'), social_link),
            is_whatsapp_active = COALESCE((v_updates->>'is_whatsapp_active')::boolean, is_whatsapp_active),
            is_viber_active = COALESCE((v_updates->>'is_viber_active')::boolean, is_viber_active),
            updated_at = NOW()
        WHERE user_id = p_user_id;

    ELSIF p_action = 'reject' THEN
        UPDATE public.users 
        SET 
            status = 'rejected', 
            rejection_reason = p_reason,
            updated_at = NOW()
        WHERE user_id = p_user_id;
    END IF;
    
    RETURN TRUE;
END;
$$;

-- 3. Independent RPC: handle_prestation_moderation
-- This handles ONLY a specific service (providers table)
CREATE OR REPLACE FUNCTION public.handle_prestation_moderation(
    p_provider_id UUID, 
    p_action TEXT, -- 'approve' or 'reject'
    p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_action = 'approve' THEN
        UPDATE public.providers 
        SET 
            status = 'approved',
            moderation_status = 'approved',
            rejection_reason = NULL,
            -- Apply pending updates for the service itself
            commercial_name = COALESCE((pending_updates->>'commercial_name'), commercial_name),
            bio = COALESCE((pending_updates->>'bio'), bio),
            profile_picture_url = COALESCE((pending_updates->>'profile_picture_url'), profile_picture_url),
            base_price = COALESCE((pending_updates->>'base_price')::numeric, base_price),
            pending_updates = NULL,
            updated_at = NOW()
        WHERE id = p_provider_id;

    ELSIF p_action = 'reject' THEN
        UPDATE public.providers 
        SET 
            status = 'rejected', 
            moderation_status = 'rejected',
            rejection_reason = p_reason,
            updated_at = NOW()
        WHERE id = p_provider_id;
    END IF;
    
    RETURN TRUE;
END;
$$;

-- 4. Final sweep of obsolete columns
DO $$ 
BEGIN
    ALTER TABLE public.providers DROP COLUMN IF EXISTS website_link;
    ALTER TABLE public.providers DROP COLUMN IF EXISTS years_of_experience;
    ALTER TABLE public.providers DROP COLUMN IF EXISTS willingness_to_travel;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 5. Grant permissions
GRANT EXECUTE ON FUNCTION public.handle_profile_moderation(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_prestation_moderation(UUID, TEXT, TEXT) TO authenticated;

-- Notify
NOTIFY pgrst, 'reload schema';

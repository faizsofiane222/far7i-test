-- ============================================================
-- STRUCTURAL CLEANUP & DYNAMIC MODERATION V2
-- ============================================================

-- 1. Create Moderation Statuses Lookup Table (Dynamic System)
CREATE TABLE IF NOT EXISTS public.moderation_statuses (
    slug TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    color_bg TEXT,
    color_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Default Statuses
INSERT INTO public.moderation_statuses (slug, label, color_bg, color_text)
VALUES 
    ('pending', 'À Valider', 'bg-orange-100', 'text-orange-700'),
    ('approved', 'Approuvé', 'bg-emerald-100', 'text-emerald-700'),
    ('rejected', 'Refusé', 'bg-red-100', 'text-red-700'),
    ('incomplete', 'Incomplet', 'bg-slate-100', 'text-slate-600')
ON CONFLICT (slug) DO UPDATE SET 
    label = EXCLUDED.label,
    color_bg = EXCLUDED.color_bg,
    color_text = EXCLUDED.color_text;

-- 2. Clean Up Obsolete Columns in providers
DO $$ 
BEGIN
    ALTER TABLE public.providers DROP COLUMN IF EXISTS website_link;
    ALTER TABLE public.providers DROP COLUMN IF EXISTS years_of_experience;
    ALTER TABLE public.providers DROP COLUMN IF EXISTS willingness_to_travel;
    ALTER TABLE public.providers DROP COLUMN IF EXISTS modification_submitted;
    -- Remove redundant 'status' if it matches 'moderation_status' but we actually need to unify
    -- The user wants a clean structure. Let's keep status as the main field and deprecate moderation_status if possible, 
    -- but for backward compatibility we keep both for one more iteration.
END $$;

-- 3. FIX: approve_moderation_item (With proper DECLARE and SYNC)
CREATE OR REPLACE FUNCTION public.approve_moderation_item(p_table TEXT, p_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_updates JSONB;
    v_user_id UUID;
BEGIN
    IF p_table = 'users' THEN
        -- Get updates and user anchor
        SELECT pending_updates, user_id INTO v_updates, v_user_id FROM public.users WHERE id = p_id;
        
        -- Fallback: if p_id is actually the user_id (common in some flows)
        IF v_user_id IS NULL THEN
            v_user_id := p_id;
        END IF;

        -- 1. Update Users Table
        UPDATE public.users 
        SET 
            status = 'approved', 
            pending_updates = NULL,
            updated_at = NOW()
        WHERE id = p_id OR user_id = p_id;
        
        -- 2. Update Associated Providers (Profiles & Services)
        UPDATE public.providers 
        SET 
            moderation_status = 'approved',
            status = 'approved',
            -- Apply pending updates if they exist
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
            pending_updates = NULL,
            updated_at = NOW()
        WHERE user_id = v_user_id;

    ELSIF p_table = 'providers' THEN
        -- Get context
        SELECT user_id, pending_updates INTO v_user_id, v_updates FROM public.providers WHERE id = p_id;

        -- 1. Update Specific Provider
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
            is_whatsapp_active = COALESCE((pending_updates->>'is_whatsapp_active')::boolean, is_whatsapp_active),
            is_viber_active = COALESCE((pending_updates->>'is_viber_active')::boolean, is_viber_active),
            pending_updates = NULL,
            updated_at = NOW()
        WHERE id = p_id;
        
        -- 2. SYNC: Ensure the parent user is also approved 
        IF v_user_id IS NOT NULL THEN
            UPDATE public.users SET status = 'approved' WHERE user_id = v_user_id OR id = v_user_id;
        END IF;

    ELSIF p_table = 'reviews' THEN
        UPDATE public.reviews SET status = 'approved' WHERE id = p_id;
    END IF;
    
    RETURN TRUE;
END;
$$;

-- 4. FIX: get_admin_moderation_list (Remove obsolete columns and fix joins)
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
                -- Nested Profile (Exhaustive & Dynamic)
                (
                    SELECT json_build_object(
                        'id', u.id,
                        'display_name', u.display_name,
                        'email', u.email,
                        'status', COALESCE(u.status, 'pending'),
                        'rejection_reason', u.rejection_reason,
                        'pending_updates', u.pending_updates,
                        'created_at', u.created_at,
                        'bio', p_main.bio,
                        'profile_picture_url', p_main.profile_picture_url,
                        'phone_number', p_main.phone_number,
                        'social_link', p_main.social_link,
                        'provider_type', p_main.provider_type,
                        'wilaya_id', p_main.wilaya_id,
                        'is_whatsapp_active', p_main.is_whatsapp_active,
                        'is_viber_active', p_main.is_viber_active
                    )
                    FROM public.providers p_main 
                    WHERE p_main.user_id = u.user_id 
                    LIMIT 1
                ) as profile,
                -- Nested Prestations 
                COALESCE(
                    (
                        SELECT json_agg(p_item)
                        FROM (
                            SELECT 
                                p.id,
                                p.commercial_name,
                                p.category_slug,
                                p.bio,
                                p.phone_number,
                                p.social_link,
                                p.profile_picture_url,
                                p.base_price,
                                COALESCE(p.status, p.moderation_status, 'pending') as status,
                                p.rejection_reason,
                                p.pending_updates,
                                p.created_at,
                                -- Gallery
                                COALESCE(
                                    (
                                        SELECT json_agg(m)
                                        FROM (
                                            SELECT media_url, is_main, sort_order
                                            FROM public.provider_media
                                            WHERE provider_id = p.id
                                            ORDER BY sort_order ASC
                                        ) m
                                    ), '[]'::json
                                ) as gallery,
                                -- Specifics
                                CASE 
                                    WHEN p.category_slug = 'lieu_de_reception' THEN (SELECT to_jsonb(v) FROM public.provider_venues v WHERE v.provider_id = p.id)
                                    WHEN p.category_slug IN ('traiteur', 'gateau_traditionnel', 'patisserie_sales', 'piece_montee_tartes') THEN (SELECT to_jsonb(c) FROM public.provider_catering c WHERE c.provider_id = p.id)
                                    WHEN p.category_slug IN ('dj_orchestre', 'animation_musicale_traditionnelle') THEN (SELECT to_jsonb(mu) FROM public.provider_music mu WHERE mu.provider_id = p.id)
                                    WHEN p.category_slug IN ('location_voiture', 'location_tenues') THEN (SELECT to_jsonb(re) FROM public.provider_rentals re WHERE re.provider_id = p.id)
                                    WHEN p.category_slug IN ('coiffure_beaute', 'beaute_bien_etre', 'habilleuse') THEN (SELECT to_jsonb(be) FROM public.provider_beauty be WHERE be.provider_id = p.id)
                                    ELSE NULL
                                END as specifics
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

-- 5. Final Notify
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- SINGLE SOURCE OF TRUTH (SSOT) REFACTOR
-- ============================================================

-- 1. Unify Statuses & Clean Obsolete References in get_admin_moderation_list
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
                u.user_id as user_id, -- Use user_id (anchor to auth.users)
                u.display_name,
                u.email,
                -- Nested Profile (Consolidated & Cleaned)
                (
                    SELECT json_build_object(
                        'id', p_main.id,
                        'user_id', p_main.user_id,
                        'display_name', u.display_name,
                        'email', u.email,
                        'status', COALESCE(p_main.status, p_main.moderation_status, 'pending'), -- Read from provider record
                        'rejection_reason', p_main.rejection_reason,
                        'pending_updates', p_main.pending_updates,
                        'created_at', p_main.created_at,
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
                    WHERE p_main.user_id = u.user_id -- Correct Join
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
                                    WHEN p.category_slug IN ('photographe', 'videaste') THEN (SELECT to_jsonb(ph) FROM public.provider_photographer ph WHERE ph.provider_id = p.id)
                                    WHEN p.category_slug IN ('dj_orchestre', 'animation_musicale_traditionnelle') THEN (SELECT to_jsonb(mu) FROM public.provider_music mu WHERE mu.provider_id = p.id)
                                    WHEN p.category_slug IN ('location_voiture', 'location_tenues') THEN (SELECT to_jsonb(re) FROM public.provider_rentals re WHERE re.provider_id = p.id)
                                    WHEN p.category_slug IN ('coiffure_beaute', 'beaute_bien_etre', 'habilleuse') THEN (SELECT to_jsonb(be) FROM public.provider_beauty be WHERE be.provider_id = p.id)
                                    ELSE NULL
                                END as specifics
                            FROM public.providers p
                            WHERE p.user_id = u.user_id -- Correct Join
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

-- 2. Clean providers table from any residual dead columns
DO $$ 
BEGIN
    ALTER TABLE public.providers DROP COLUMN IF EXISTS website_link;
    ALTER TABLE public.providers DROP COLUMN IF EXISTS years_of_experience;
    ALTER TABLE public.providers DROP COLUMN IF EXISTS willingness_to_travel;
    -- Note: commune_id already dropped by previous migrations
END $$;

-- 3. Ensure handle_new_user initiates providers with 'pending' status
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
    role_val public.app_role;
    p_type_val public.provider_type;
BEGIN
    -- Determine role from metadata
    IF (NEW.raw_user_meta_data->>'role') = 'provider' THEN
        role_val := 'provider'::public.app_role;
    ELSIF (NEW.raw_user_meta_data->>'role') = 'admin' THEN
        role_val := 'admin'::public.app_role;
    ELSE
        role_val := 'client'::public.app_role;
    END IF;

    -- Determine provider type
    IF (NEW.raw_user_meta_data->>'partner_type') = 'agency' THEN
        p_type_val := 'agency'::public.provider_type;
    ELSE
        p_type_val := 'individual'::public.provider_type;
    END IF;

    -- 1. Insert Role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, role_val)
    ON CONFLICT (user_id, role) DO NOTHING;

    -- 2. Insert Generic Profile
    INSERT INTO public.users (user_id, email, display_name, status)
    VALUES (
        NEW.id, 
        NEW.email, 
        NEW.raw_user_meta_data->>'display_name',
        'pending' -- SSoT: Everyone starts at pending
    )
    ON CONFLICT (user_id) DO NOTHING;

    -- 3. Insert Provider Profile
    IF role_val = 'provider' THEN
        INSERT INTO public.providers (
            user_id,
            commercial_name,
            provider_type,
            phone_number,
            social_link,
            moderation_status,
            status
        )
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'business_name', NEW.raw_user_meta_data->>'display_name', 'Unnamed Business'),
            p_type_val,
            COALESCE(NEW.raw_user_meta_data->>'phone', ''),
            NEW.raw_user_meta_data->>'social_link',
            'pending',
            'pending'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

NOTIFY pgrst, 'reload schema';

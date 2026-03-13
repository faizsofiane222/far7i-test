-- Update get_admin_moderation_list to include full details from junction tables
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
                -- Nested Profile (Exhaustive)
                (
                    SELECT json_build_object(
                        'id', u.id,
                        'display_name', u.display_name,
                        'email', u.email,
                        'status', COALESCE(u.status, 'pending'),
                        'rejection_reason', u.rejection_reason,
                        'pending_updates', u.pending_updates,
                        'created_at', u.created_at,
                        -- Added for immersive view
                        'bio', p_main.bio,
                        'profile_picture_url', p_main.profile_picture_url,
                        'phone_number', p_main.phone_number,
                        'social_link', p_main.social_link,
                        'website_link', p_main.website_link,
                        'years_of_experience', p_main.years_of_experience,
                        'provider_type', p_main.provider_type,
                        'wilaya_id', p_main.wilaya_id,
                        'is_whatsapp_active', p_main.is_whatsapp_active,
                        'is_viber_active', p_main.is_viber_active
                    )
                    FROM public.providers p_main 
                    WHERE p_main.user_id = u.id 
                    LIMIT 1
                ) as profile,
                -- Nested Prestations (Exhaustive)
                COALESCE(
                    (
                        SELECT json_agg(p_item)
                        FROM (
                            SELECT 
                                p.*,
                                COALESCE(p.status, p.moderation_status, 'pending') as status,
                                -- Full Media Gallery
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
                                -- Specifics based on category
                                CASE 
                                    WHEN p.category_slug = 'lieu_de_reception' THEN (SELECT to_jsonb(v) FROM public.provider_venues v WHERE v.provider_id = p.id)
                                    WHEN p.category_slug IN ('traiteur', 'gateau_traditionnel', 'patisserie_sales', 'piece_montee_tartes') THEN (SELECT to_jsonb(c) FROM public.provider_catering c WHERE c.provider_id = p.id)
                                    WHEN p.category_slug IN ('photographe', 'videaste') THEN (SELECT to_jsonb(ph) FROM public.provider_photographer ph WHERE ph.provider_id = p.id)
                                    WHEN p.category_slug IN ('dj_orchestre', 'animation_musicale_traditionnelle') THEN (SELECT to_jsonb(mu) FROM public.provider_music mu WHERE mu.provider_id = p.id)
                                    WHEN p.category_slug IN ('location_voiture', 'location_tenues') THEN (SELECT to_jsonb(re) FROM public.provider_rentals re WHERE re.provider_id = p.id)
                                    WHEN p.category_slug IN ('coiffure_beaute', 'beaute_bien_etre', 'habilleuse') THEN (SELECT to_jsonb(be) FROM public.provider_beauty be WHERE be.provider_id = p.id)
                                    ELSE NULL
                                END as specifics,
                                -- Nested Reviews
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
                            WHERE p.user_id = u.id
                        ) p_item
                    ), '[]'::json
                ) as prestations
            FROM public.users u
            WHERE EXISTS (
                SELECT 1 FROM public.user_roles ur 
                WHERE ur.user_id = u.id AND ur.role = 'provider'
            )
            ORDER BY u.created_at DESC
        ) partner
    );
END;
$$;

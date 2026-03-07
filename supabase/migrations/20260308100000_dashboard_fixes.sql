-- ============================================================
-- DASHBOARD & MODERATION FIXES
-- Version: 20260308100000
-- ============================================================

-- 1. Add visitor_session_id to page_views for unique visitor tracking
ALTER TABLE public.page_views 
ADD COLUMN IF NOT EXISTS visitor_session_id TEXT;

-- Index for unique visitor counting
CREATE INDEX IF NOT EXISTS idx_page_views_session ON public.page_views(visitor_session_id);

-- 2. Fix get_visitor_stats: count UNIQUE sessions instead of all hits
DROP FUNCTION IF EXISTS public.get_visitor_stats(TIMESTAMPTZ, TIMESTAMPTZ);
CREATE OR REPLACE FUNCTION public.get_visitor_stats(p_start_date TIMESTAMPTZ, p_end_date TIMESTAMPTZ)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count BIGINT;
BEGIN
    SELECT COUNT(DISTINCT COALESCE(visitor_session_id, id::TEXT)) INTO v_count
    FROM public.page_views
    WHERE visited_at >= p_start_date AND visited_at <= p_end_date;
    
    RETURN COALESCE(v_count, 0);
END;
$$;

-- 3. New: get_visitor_evolution — time series for chart
CREATE OR REPLACE FUNCTION public.get_visitor_evolution(p_start_date TIMESTAMPTZ, p_end_date TIMESTAMPTZ)
RETURNS TABLE(
    day DATE,
    unique_visitors BIGINT,
    page_views BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        DATE(visited_at) as day,
        COUNT(DISTINCT COALESCE(visitor_session_id, id::TEXT)) as unique_visitors,
        COUNT(*) as page_views
    FROM public.page_views
    WHERE visited_at >= p_start_date AND visited_at <= p_end_date
    GROUP BY DATE(visited_at)
    ORDER BY day ASC;
END;
$$;

-- 4. Fix get_admin_kpis: count pending using BOTH status columns
DROP FUNCTION IF EXISTS public.get_admin_kpis();
CREATE OR REPLACE FUNCTION public.get_admin_kpis()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total_providers BIGINT;
    v_total_services BIGINT;
    v_pending_providers BIGINT;
    v_pending_services BIGINT;
    v_wilaya_dist JSON;
BEGIN
    SELECT COUNT(DISTINCT ur.user_id) INTO v_total_providers
    FROM public.user_roles ur
    WHERE ur.role = 'provider';

    SELECT COUNT(*) INTO v_total_services
    FROM public.providers;

    SELECT COUNT(DISTINCT user_id) INTO v_pending_providers
    FROM public.providers
    WHERE 
        status = 'pending' 
        OR moderation_status = 'pending'
        OR (pending_updates IS NOT NULL AND COALESCE(status, moderation_status) != 'rejected');

    SELECT COUNT(*) INTO v_pending_services
    FROM public.providers
    WHERE 
        status = 'pending' 
        OR moderation_status = 'pending'
        OR (pending_updates IS NOT NULL AND COALESCE(status, moderation_status) != 'rejected');

    SELECT json_agg(t) INTO v_wilaya_dist
    FROM (
        SELECT 
            w.name as wilaya,
            COUNT(p.id) as count
        FROM public.wilayas w
        LEFT JOIN public.providers p ON w.id = p.wilaya_id
        GROUP BY w.name
        HAVING COUNT(p.id) > 0
        ORDER BY count DESC
        LIMIT 15
    ) t;

    RETURN json_build_object(
        'total_providers', v_total_providers,
        'total_services', v_total_services,
        'pending_providers', v_pending_providers,
        'pending_services', v_pending_services,
        'wilaya_distribution', COALESCE(v_wilaya_dist, '[]'::json)
    );
END;
$$;

-- 5. Fix get_admin_moderation_list: safe version, only guaranteed core columns
-- Core providers columns (from 20251231000000_core_schema.sql):
--   id, user_id, commercial_name, provider_type, phone_number, social_link,
--   moderation_status, created_at, updated_at
-- Additional columns added by later safe migrations:
--   wilaya_id (20260221000001), is_whatsapp_active, is_viber_active (20260303130000)
--   status, rejection_reason, pending_updates (20260307160000)
DROP FUNCTION IF EXISTS public.get_admin_moderation_list();
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
                -- Nested Profile object
                (
                    SELECT json_build_object(
                        'id', u.id,
                        'display_name', u.display_name,
                        'email', u.email,
                        'status', COALESCE(u.status, 'pending'),
                        'rejection_reason', u.rejection_reason,
                        'pending_updates', u.pending_updates,
                        'created_at', u.created_at,
                        -- Core providers columns only
                        'commercial_name', p_main.commercial_name,
                        'provider_type', p_main.provider_type,
                        'phone_number', p_main.phone_number,
                        'social_link', p_main.social_link,
                        'moderation_status', p_main.moderation_status,
                        'is_whatsapp_active', p_main.is_whatsapp_active,
                        'is_viber_active', p_main.is_viber_active,
                        'wilaya_id', p_main.wilaya_id,
                        'wilaya_name', w_main.name
                    )
                    FROM public.providers p_main
                    LEFT JOIN public.wilayas w_main ON w_main.id = p_main.wilaya_id
                    WHERE p_main.user_id = u.user_id
                    LIMIT 1
                ) as profile,
                -- Nested Prestations list
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
                                w.name as wilaya_name,
                                COALESCE(p.status, p.moderation_status, 'pending') as status,
                                p.moderation_status,
                                p.rejection_reason,
                                p.pending_updates,
                                p.created_at,
                                -- Media Gallery
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
                                -- Reviews
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
                            LEFT JOIN public.wilayas w ON w.id = p.wilaya_id
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

-- 6. Grant permissions
GRANT EXECUTE ON FUNCTION public.get_visitor_stats(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_visitor_evolution(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_kpis() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_moderation_list() TO authenticated;

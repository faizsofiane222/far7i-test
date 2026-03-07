-- ============================================================
-- ADMIN DASHBOARD KPIS & VISITOR TRACKING
-- ============================================================

-- 1. Create page_views table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.page_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visited_at TIMESTAMPTZ DEFAULT now(),
    path TEXT NOT NULL,
    viewer_id UUID REFERENCES auth.users(id),
    viewer_ip TEXT
);

-- Index for date range filtering
CREATE INDEX IF NOT EXISTS idx_page_views_visited_at ON public.page_views(visited_at);

-- 2. Function to get visitor stats
CREATE OR REPLACE FUNCTION public.get_visitor_stats(p_start_date TIMESTAMPTZ, p_end_date TIMESTAMPTZ)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count BIGINT;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM public.page_views
    WHERE visited_at >= p_start_date AND visited_at <= p_end_date;
    
    RETURN v_count;
END;
$$;

-- 3. Function to get main admin KPIs
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
    -- Acquisition: Total Partners (Users with role provider)
    SELECT COUNT(DISTINCT ur.user_id) INTO v_total_providers
    FROM public.user_roles ur
    WHERE ur.role = 'provider';

    -- Acquisition: Total Services (Entries in providers table)
    SELECT COUNT(*) INTO v_total_services
    FROM public.providers;

    -- Charge de travail: Pending unique providers
    SELECT COUNT(DISTINCT user_id) INTO v_pending_providers
    FROM public.providers
    WHERE moderation_status = 'pending';

    -- Charge de travail: Pending services
    SELECT COUNT(*) INTO v_pending_services
    FROM public.providers
    WHERE moderation_status = 'pending';

    -- Géographie: Wilaya distribution
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

-- 4. RLS Policies
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Allow anonymous and authenticated to insert (public tracking)
CREATE POLICY "Anyone can insert page views" ON public.page_views
    FOR INSERT TO public WITH CHECK (true);

-- Allow admins to view
CREATE POLICY "Admins can view page views" ON public.page_views
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

-- Grant access to RPCs
GRANT EXECUTE ON FUNCTION public.get_visitor_stats(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_kpis() TO authenticated;

-- 1. Create Analytics Tables
CREATE TABLE IF NOT EXISTS public.provider_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
    viewer_ip TEXT, -- Optional, for basic unique view tracking
    viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- If logged in
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.provider_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
    contact_type TEXT NOT NULL, -- e.g., 'phone', 'whatsapp', 'email', 'social'
    viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- If logged in
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
    client_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.provider_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Analytics Policies
-- Providers can read their own views and leads
CREATE POLICY "Providers can read own views" ON public.provider_views FOR SELECT USING (provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid()));
CREATE POLICY "Anyone can insert views" ON public.provider_views FOR INSERT WITH CHECK (true);

CREATE POLICY "Providers can read own leads" ON public.provider_leads FOR SELECT USING (provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid()));
CREATE POLICY "Anyone can insert leads" ON public.provider_leads FOR INSERT WITH CHECK (true);

-- Reviews Policies
-- Anyone can read approved reviews or reviews they wrote
CREATE POLICY "Public read approved reviews" ON public.reviews FOR SELECT USING (status = 'approved' OR client_id = auth.uid());
-- Providers can read all reviews for their profile
CREATE POLICY "Providers read own reviews" ON public.reviews FOR SELECT USING (provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid()));
-- Logged in users can write reviews
CREATE POLICY "Auth users insert reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (client_id = auth.uid());


-- 3. Create Dashboard KPI RPC Function
CREATE OR REPLACE FUNCTION public.get_provider_dashboard_stats(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    res JSONB;
    v_provider_id UUID;

    v_total_views INT;
    v_views_last_month INT;
    v_views_prev_month INT;
    v_views_trend NUMERIC;
    
    v_total_leads INT;
    v_leads_last_month INT;
    v_leads_prev_month INT;
    v_leads_trend NUMERIC;
    
    v_avg_rating NUMERIC;
    v_reviews_count INT;
    
    v_chart_data JSONB;
    v_recent_reviews JSONB;
    v_top_services JSONB;
    v_provider_category TEXT;
    v_commercial_name TEXT;
BEGIN
    -- Get provider ID from user ID
    SELECT id INTO v_provider_id FROM public.providers WHERE user_id = p_user_id;

    IF v_provider_id IS NULL THEN
        RETURN jsonb_build_object('error', 'Provider not found for this user');
    END IF;

    -- Views Stats
    SELECT COUNT(*) INTO v_total_views FROM public.provider_views WHERE provider_id = v_provider_id;
    
    SELECT COUNT(*) INTO v_views_last_month 
    FROM public.provider_views 
    WHERE provider_id = v_provider_id AND created_at >= date_trunc('month', current_date);
    
    SELECT COUNT(*) INTO v_views_prev_month 
    FROM public.provider_views 
    WHERE provider_id = v_provider_id 
      AND created_at >= date_trunc('month', current_date - interval '1 month') 
      AND created_at < date_trunc('month', current_date);
    
    IF v_views_prev_month > 0 THEN
        v_views_trend := round(((v_views_last_month - v_views_prev_month)::numeric / v_views_prev_month) * 100, 1);
    ELSE
        v_views_trend := CASE WHEN v_views_last_month > 0 THEN 100 ELSE 0 END;
    END IF;

    -- Leads Stats
    SELECT COUNT(*) INTO v_total_leads FROM public.provider_leads WHERE provider_id = v_provider_id;
    
    SELECT COUNT(*) INTO v_leads_last_month 
    FROM public.provider_leads 
    WHERE provider_id = v_provider_id AND created_at >= date_trunc('month', current_date);
    
    SELECT COUNT(*) INTO v_leads_prev_month 
    FROM public.provider_leads 
    WHERE provider_id = v_provider_id 
      AND created_at >= date_trunc('month', current_date - interval '1 month') 
      AND created_at < date_trunc('month', current_date);
    
    IF v_leads_prev_month > 0 THEN
        v_leads_trend := round(((v_leads_last_month - v_leads_prev_month)::numeric / v_leads_prev_month) * 100, 1);
    ELSE
        v_leads_trend := CASE WHEN v_leads_last_month > 0 THEN 100 ELSE 0 END;
    END IF;

    -- Reviews Stats
    SELECT COUNT(*), COALESCE(ROUND(AVG(rating), 1), 0) INTO v_reviews_count, v_avg_rating 
    FROM public.reviews 
    WHERE provider_id = v_provider_id AND status = 'approved';
    
    -- Chart Data (last 6 months)
    SELECT jsonb_agg(
        jsonb_build_object(
            'month', CASE EXTRACT(MONTH FROM m.month)
                        WHEN 1 THEN 'Jan' WHEN 2 THEN 'FÃ©v' WHEN 3 THEN 'Mar'
                        WHEN 4 THEN 'Avr' WHEN 5 THEN 'Mai' WHEN 6 THEN 'Juin'
                        WHEN 7 THEN 'Juil' WHEN 8 THEN 'AoÃ»t' WHEN 9 THEN 'Sep'
                        WHEN 10 THEN 'Oct' WHEN 11 THEN 'Nov' WHEN 12 THEN 'DÃ©c'
                     END,
            'views', COALESCE(v.views, 0),
            'leads', COALESCE(l.leads, 0)
        ) ORDER BY m.month
    ) INTO v_chart_data
    FROM (
        SELECT generate_series(date_trunc('month', current_date - interval '5 months'), date_trunc('month', current_date), '1 month') AS month
    ) m
    LEFT JOIN (
        SELECT date_trunc('month', created_at) as month, count(*) as views 
        FROM public.provider_views WHERE provider_id = v_provider_id GROUP BY 1
    ) v ON v.month = m.month
    LEFT JOIN (
        SELECT date_trunc('month', created_at) as month, count(*) as leads 
        FROM public.provider_leads WHERE provider_id = v_provider_id GROUP BY 1
    ) l ON l.month = m.month;

    -- Recent reviews
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', id,
            'client', client_name,
            'service', 'Service Principal',
            'rating', rating,
            'date', to_char(created_at, 'YYYY-MM-DD'),
            'text', comment
        ) ORDER BY created_at DESC
    ), '[]'::jsonb) INTO v_recent_reviews
    FROM (
        SELECT * FROM public.reviews WHERE provider_id = v_provider_id AND status = 'approved' ORDER BY created_at DESC LIMIT 5
    ) r;

    -- Top services (For now, just the main provider category)
    SELECT category_slug, commercial_name INTO v_provider_category, v_commercial_name FROM public.providers WHERE id = v_provider_id;
    
    v_top_services := jsonb_build_array(
        jsonb_build_object(
            'id', '1',
            'title', COALESCE((SELECT label FROM public.service_categories WHERE slug = v_provider_category), 'Ma Prestation'),
            'views', v_total_views,
            'leads', v_total_leads
        )
    );

    -- Build final JSON result
    res := jsonb_build_object(
        'totalLeads', v_total_leads,
        'leadsTrend', CASE WHEN v_leads_trend >= 0 THEN '+' || v_leads_trend::text || '%' ELSE v_leads_trend::text || '%' END,
        'totalViews', v_total_views,
        'viewsTrend', CASE WHEN v_views_trend >= 0 THEN '+' || v_views_trend::text || '%' ELSE v_views_trend::text || '%' END,
        'averageRating', v_avg_rating,
        'reviewsCount', v_reviews_count,
        'chartData', COALESCE(v_chart_data, '[]'::jsonb),
        'recentReviews', v_recent_reviews,
        'topServices', v_top_services
    );

    RETURN res;
END;
$$;

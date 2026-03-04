-- Create Analytics Event Type Enum
DO $$ BEGIN
    CREATE TYPE public.event_type AS ENUM (
        'profile_view', 
        'service_view', 
        'contact_whatsapp', 
        'contact_viber', 
        'contact_phone', 
        'social_click'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Analytics Events Table
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
    event_type public.event_type NOT NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    visitor_id TEXT, -- Hashed IP or Session ID
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_provider_id ON public.analytics_events(provider_id);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.analytics_events(event_type);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts for tracking from public site
CREATE POLICY "Allow public tracking inserts" 
ON public.analytics_events FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Allow providers to see their own analytics
CREATE POLICY "Providers can view their own analytics" 
ON public.analytics_events FOR SELECT 
TO authenticated
USING (
    provider_id IN (
        SELECT id FROM public.providers WHERE user_id = auth.uid()
    )
);

-- RPC to track events securely
CREATE OR REPLACE FUNCTION public.track_event(
    p_provider_id UUID,
    p_event_type public.event_type,
    p_service_id UUID DEFAULT NULL,
    p_visitor_id TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.analytics_events (provider_id, event_type, service_id, visitor_id)
    VALUES (p_provider_id, p_event_type, p_service_id, p_visitor_id);
END;
$$;

-- Global Dashboard Stats Aggregator
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(
    p_provider_id UUID,
    p_days_ago INTEGER DEFAULT 30
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_leads INTEGER;
    v_total_views INTEGER;
    v_conversion_rate NUMERIC;
    v_chart_data JSON;
    v_top_services JSON;
BEGIN
    -- 1. Total Leads (Contact actions)
    SELECT COUNT(*) INTO v_total_leads
    FROM public.analytics_events
    WHERE provider_id = p_provider_id
      AND event_type IN ('contact_whatsapp', 'contact_viber', 'contact_phone')
      AND created_at >= now() - (p_days_ago || ' days')::interval;

    -- 2. Total Views
    SELECT COUNT(*) INTO v_total_views
    FROM public.analytics_events
    WHERE provider_id = p_provider_id
      AND event_type IN ('profile_view', 'service_view')
      AND created_at >= now() - (p_days_ago || ' days')::interval;

    -- 3. Conversion Rate
    IF v_total_views > 0 THEN
        v_conversion_rate := ROUND((v_total_leads::NUMERIC / v_total_views::NUMERIC) * 100, 2);
    ELSE
        v_conversion_rate := 0;
    END IF;

    -- 4. Chart Data (Daily breakdown)
    WITH daily_stats AS (
        SELECT 
            date_trunc('day', created_at)::date as d,
            COUNT(*) FILTER (WHERE event_type IN ('profile_view', 'service_view')) as views,
            COUNT(*) FILTER (WHERE event_type IN ('contact_whatsapp', 'contact_viber', 'contact_phone')) as leads
        FROM public.analytics_events
        WHERE provider_id = p_provider_id
          AND created_at >= now() - (p_days_ago || ' days')::interval
        GROUP BY 1
        ORDER BY 1 ASC
    )
    SELECT json_agg(daily_stats) INTO v_chart_data FROM daily_stats;

    -- 5. Top Services
    WITH service_stats AS (
        SELECT 
            s.title,
            COUNT(*) as views
        FROM public.analytics_events ae
        JOIN public.services s ON ae.service_id = s.id
        WHERE ae.provider_id = p_provider_id
          AND ae.event_type = 'service_view'
          AND ae.created_at >= now() - (p_days_ago || ' days')::interval
        GROUP BY s.title
        ORDER BY views DESC
        LIMIT 5
    )
    SELECT json_agg(service_stats) INTO v_top_services FROM service_stats;

    RETURN json_build_object(
        'totalLeads', v_total_leads,
        'totalViews', v_total_views,
        'conversionRate', v_conversion_rate,
        'chartData', v_chart_data,
        'topServices', v_top_services
    );
END;
$$;

-- Update Dashboard RPC to support dynamic filtering
CREATE OR REPLACE FUNCTION public.get_provider_dashboard_stats(
    p_user_id UUID,
    p_provider_id UUID DEFAULT NULL,
    p_category_slug TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    res JSONB;
    v_provider_ids UUID[];

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
BEGIN
    -- 1. Identify which providers we are looking at
    IF p_provider_id IS NOT NULL THEN
        -- Specific provider (service)
        v_provider_ids := ARRAY[p_provider_id];
    ELSIF p_category_slug IS NOT NULL AND p_category_slug != 'all' THEN
        -- Specific category for this user
        SELECT array_agg(id) INTO v_provider_ids 
        FROM public.providers 
        WHERE user_id = p_user_id AND category_slug = p_category_slug;
    ELSE
        -- All providers for this user
        SELECT array_agg(id) INTO v_provider_ids 
        FROM public.providers 
        WHERE user_id = p_user_id;
    END IF;

    IF v_provider_ids IS NULL OR array_length(v_provider_ids, 1) = 0 THEN
        RETURN jsonb_build_object(
            'totalLeads', 0,
            'leadsTrend', '+0%',
            'totalViews', 0,
            'viewsTrend', '+0%',
            'averageRating', 0,
            'reviewsCount', 0,
            'chartData', '[]'::jsonb,
            'recentReviews', '[]'::jsonb,
            'topServices', '[]'::jsonb
        );
    END IF;

    -- Views Stats
    SELECT COUNT(*) INTO v_total_views FROM public.provider_views WHERE provider_id = ANY(v_provider_ids);
    
    SELECT COUNT(*) INTO v_views_last_month 
    FROM public.provider_views 
    WHERE provider_id = ANY(v_provider_ids) AND created_at >= date_trunc('month', current_date);
    
    SELECT COUNT(*) INTO v_views_prev_month 
    FROM public.provider_views 
    WHERE provider_id = ANY(v_provider_ids) 
      AND created_at >= date_trunc('month', current_date - interval '1 month') 
      AND created_at < date_trunc('month', current_date);
    
    IF v_views_prev_month > 0 THEN
        v_views_trend := round(((v_views_last_month - v_views_prev_month)::numeric / v_views_prev_month) * 100, 1);
    ELSE
        v_views_trend := CASE WHEN v_views_last_month > 0 THEN 100 ELSE 0 END;
    END IF;

    -- Leads Stats
    SELECT COUNT(*) INTO v_total_leads FROM public.provider_leads WHERE provider_id = ANY(v_provider_ids);
    
    SELECT COUNT(*) INTO v_leads_last_month 
    FROM public.provider_leads 
    WHERE provider_id = ANY(v_provider_ids) AND created_at >= date_trunc('month', current_date);
    
    SELECT COUNT(*) INTO v_leads_prev_month 
    FROM public.provider_leads 
    WHERE provider_id = ANY(v_provider_ids) 
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
    WHERE provider_id = ANY(v_provider_ids) AND status = 'approved';
    
    -- Chart Data (last 6 months)
    SELECT jsonb_agg(
        jsonb_build_object(
            'month', CASE EXTRACT(MONTH FROM m.month)
                        WHEN 1 THEN 'Jan' WHEN 2 THEN 'Fev' WHEN 3 THEN 'Mar'
                        WHEN 4 THEN 'Avr' WHEN 5 THEN 'Mai' WHEN 6 THEN 'Juin'
                        WHEN 7 THEN 'Juil' WHEN 8 THEN 'Aout' WHEN 9 THEN 'Sep'
                        WHEN 10 THEN 'Oct' WHEN 11 THEN 'Nov' WHEN 12 THEN 'Dec'
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
        FROM public.provider_views WHERE provider_id = ANY(v_provider_ids) GROUP BY 1
    ) v ON v.month = m.month
    LEFT JOIN (
        SELECT date_trunc('month', created_at) as month, count(*) as leads 
        FROM public.provider_leads WHERE provider_id = ANY(v_provider_ids) GROUP BY 1
    ) l ON l.month = m.month;

    -- Recent reviews
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', id,
            'client', client_name,
            'service', (SELECT commercial_name FROM public.providers WHERE id = r.provider_id),
            'rating', rating,
            'date', to_char(created_at, 'YYYY-MM-DD'),
            'text', comment
        ) ORDER BY created_at DESC
    ), '[]'::jsonb) INTO v_recent_reviews
    FROM (
        SELECT * FROM public.reviews WHERE provider_id = ANY(v_provider_ids) AND status = 'approved' ORDER BY created_at DESC LIMIT 5
    ) r;

    -- Individual Services Ranking (only show if we have multiple providers)
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', p.id,
            'title', p.commercial_name,
            'views', COALESCE(v.cnt, 0),
            'leads', COALESCE(l.cnt, 0)
        ) ORDER BY COALESCE(v.cnt, 0) DESC
    ), '[]'::jsonb) INTO v_top_services
    FROM public.providers p
    LEFT JOIN (SELECT provider_id, count(*) as cnt FROM public.provider_views GROUP BY 1) v ON v.provider_id = p.id
    LEFT JOIN (SELECT provider_id, count(*) as cnt FROM public.provider_leads GROUP BY 1) l ON l.provider_id = p.id
    WHERE p.id = ANY(v_provider_ids);

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

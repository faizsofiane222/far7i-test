-- Fix security warnings: Set search_path for all functions
-- ============================================

-- 1. Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- 2. Fix update_provider_rating function
CREATE OR REPLACE FUNCTION update_provider_rating()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE providers
    SET 
        rating = (
            SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0)
            FROM reviews
            WHERE provider_id = NEW.provider_id AND status = 'approved'
        ),
        review_count = (
            SELECT COUNT(*)
            FROM reviews
            WHERE provider_id = NEW.provider_id AND status = 'approved'
        )
    WHERE id = NEW.provider_id;
    RETURN NEW;
END;
$$;

-- 3. Fix search_providers function
CREATE OR REPLACE FUNCTION search_providers(
    search_query TEXT, 
    filter_category TEXT DEFAULT NULL, 
    filter_wilaya TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    business_name VARCHAR,
    category VARCHAR,
    wilaya VARCHAR,
    rating DECIMAL,
    review_count INTEGER,
    verified BOOLEAN,
    featured BOOLEAN
)
LANGUAGE PLPGSQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.business_name,
        p.category,
        p.wilaya,
        p.rating,
        p.review_count,
        p.verified,
        p.featured
    FROM providers p
    WHERE 
        p.status = 'active'
        AND (filter_category IS NULL OR p.category = filter_category)
        AND (filter_wilaya IS NULL OR p.wilaya = filter_wilaya)
        AND (
            search_query IS NULL OR
            p.business_name ILIKE '%' || search_query || '%' OR
            p.description ILIKE '%' || search_query || '%'
        )
    ORDER BY 
        p.featured DESC,
        p.rating DESC,
        p.review_count DESC;
END;
$$;

-- 4. Fix get_provider_stats function
CREATE OR REPLACE FUNCTION get_provider_stats(provider_uuid UUID)
RETURNS JSON
LANGUAGE PLPGSQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    stats JSON;
BEGIN
    SELECT json_build_object(
        'total_bookings', COUNT(DISTINCT b.id),
        'completed_bookings', COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'completed'),
        'average_rating', COALESCE(ROUND(AVG(r.rating)::numeric, 2), 0),
        'total_reviews', COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'approved'),
        'response_rate', ROUND(
            COALESCE(
                (COUNT(DISTINCT b.id) FILTER (WHERE b.responded_at IS NOT NULL)::DECIMAL / 
                NULLIF(COUNT(DISTINCT b.id), 0) * 100),
                0
            ), 2
        )
    ) INTO stats
    FROM providers p
    LEFT JOIN bookings b ON p.id = b.provider_id
    LEFT JOIN reviews r ON p.id = r.provider_id
    WHERE p.id = provider_uuid
    GROUP BY p.id;
    
    RETURN COALESCE(stats, '{}'::json);
END;
$$;
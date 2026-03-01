-- View to aggregate provider ratings and review counts
-- This view allows easy retrieval of stats for each provider without complex frontend aggregation.

CREATE OR REPLACE VIEW public.provider_stats AS
SELECT 
    provider_id,
    COALESCE(ROUND(AVG(rating), 1), 0) as rating_avg,
    COUNT(id) as review_count
FROM 
    public.reviews
WHERE 
    status = 'approved'
GROUP BY 
    provider_id;

-- Ensure RLS doesn't block reading the view (views inherit permissions generally, but explicit grants are good)
GRANT SELECT ON public.provider_stats TO authenticated, anon;

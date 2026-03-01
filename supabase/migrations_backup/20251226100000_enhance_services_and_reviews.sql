-- ============================================
-- ENHANCE SERVICES & REVIEWS
-- ============================================

-- 1. STORAGE BUCKET FOR SERVICES
-- ============================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('services-media', 'services-media', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for services-media
CREATE POLICY "Public Service Media Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'services-media');

CREATE POLICY "Provider Service Media Upload" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'services-media' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Provider Service Media Delete" 
ON storage.objects FOR DELETE 
USING (
    bucket_id = 'services-media' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. ENHANCE REVIEWS TABLE
-- ============================================

-- Add service_id to reviews if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'reviews' AND COLUMN_NAME = 'service_id') THEN
        ALTER TABLE public.reviews ADD COLUMN service_id UUID REFERENCES public.services(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. CREATE VIEW FOR SERVICE RATINGS (Aggregated)
-- ============================================
CREATE OR REPLACE VIEW public.service_rating_stats AS
SELECT 
    service_id,
    ROUND(AVG(rating)::numeric, 1) as average_rating,
    COUNT(*) as review_count
FROM public.reviews
WHERE status = 'approved' AND service_id IS NOT NULL
GROUP BY service_id;

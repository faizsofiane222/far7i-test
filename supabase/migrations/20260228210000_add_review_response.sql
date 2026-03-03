-- Add provider_response column to reviews table
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS provider_response TEXT;

-- Policy to allow providers to update their own reviews with a response
-- Note: 'provider_id' references 'providers.id', which has 'user_id'
DROP POLICY IF EXISTS "Providers can update own reviews" ON public.reviews;
CREATE POLICY "Providers can update own reviews" ON public.reviews
    FOR UPDATE TO authenticated
    USING (provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid()))
    WITH CHECK (provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid()));

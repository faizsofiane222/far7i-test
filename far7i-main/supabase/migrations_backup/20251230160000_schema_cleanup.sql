-- Migration: Schema Cleanup & Optimization
-- Dropping legacy tables and redundant columns from V0

-- 1. DROP LEGACY TABLES
-- ===========================================
DROP TABLE IF EXISTS public.categories CASCADE;

-- 2. CLEAN UP PROVIDERS TABLE
-- ===========================================
ALTER TABLE public.providers 
    -- Redundant string columns (replaced by junction tables or new UUID fields)
    DROP COLUMN IF EXISTS category CASCADE,
    DROP COLUMN IF EXISTS subcategories CASCADE,
    DROP COLUMN IF EXISTS wilaya CASCADE,
    DROP COLUMN IF EXISTS coverage_areas CASCADE,
    DROP COLUMN IF EXISTS portfolio_images CASCADE,
    DROP COLUMN IF EXISTS services CASCADE,
    
    -- Legacy/Duplicate naming (renamed in V1, but may have remained as duplicates)
    DROP COLUMN IF EXISTS business_name CASCADE,
    DROP COLUMN IF EXISTS description CASCADE,
    DROP COLUMN IF EXISTS contact_phone CASCADE,
    DROP COLUMN IF EXISTS contact_whatsapp CASCADE,
    DROP COLUMN IF EXISTS contact_address CASCADE,
    DROP COLUMN IF EXISTS contact_website CASCADE,
    DROP COLUMN IF EXISTS social_facebook CASCADE,
    DROP COLUMN IF EXISTS social_instagram CASCADE,
    DROP COLUMN IF EXISTS social_tiktok CASCADE,
    
    -- Legacy status column (replaced by moderation_status)
    DROP COLUMN IF EXISTS status CASCADE;

-- 2.1 DROP OLD CHECK CONSTRAINTS IF ANY REMAIN
ALTER TABLE public.providers DROP CONSTRAINT IF EXISTS providers_status_check;
ALTER TABLE public.providers DROP CONSTRAINT IF EXISTS providers_category_check;
ALTER TABLE public.providers DROP CONSTRAINT IF EXISTS providers_wilaya_check;

-- 3. ENFORCE CASCADE DELETE ON REMAINING JUNCTION TABLES
-- ===========================================
-- (Ensuring we don't have blockages)
-- Note: These might already have it, but we reinforce it.

ALTER TABLE IF EXISTS public.provider_services 
    DROP CONSTRAINT IF EXISTS provider_services_provider_id_fkey,
    ADD CONSTRAINT provider_services_provider_id_fkey 
    FOREIGN KEY (provider_id) REFERENCES public.providers(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.provider_events 
    DROP CONSTRAINT IF EXISTS provider_events_provider_id_fkey,
    ADD CONSTRAINT provider_events_provider_id_fkey 
    FOREIGN KEY (provider_id) REFERENCES public.providers(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.provider_travel_zones 
    DROP CONSTRAINT IF EXISTS provider_travel_zones_provider_id_fkey,
    ADD CONSTRAINT provider_travel_zones_provider_id_fkey 
    FOREIGN KEY (provider_id) REFERENCES public.providers(id) ON DELETE CASCADE;

-- 4. CLEAN UP UNUSED VIEWS OR FUNCTIONS IF ANY
-- ===========================================
-- (None identified at this stage that would block refactoring)

-- 5. RE-SYNC INDEXES
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_providers_moderation_status_new ON public.providers(moderation_status);
CREATE INDEX IF NOT EXISTS idx_providers_wilaya_id ON public.providers(wilaya_id);

-- Re-architecting the onboarding schema to use 'providers' as the central table

-- 1. Updates to existing public.providers table
ALTER TABLE IF EXISTS public.providers 
ADD COLUMN IF NOT EXISTS category_slug TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS travel_wilayas text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS events_accepted text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS base_price NUMERIC,
ADD COLUMN IF NOT EXISTS price_factors text[] DEFAULT '{}';
-- Note: commercial_name, wilaya_id, description/bio already exist or will be mapped to existing columns.

-- 2. Create specific tables (One-to-One with providers)

CREATE TABLE IF NOT EXISTS public.provider_venues (
    provider_id UUID PRIMARY KEY REFERENCES public.providers(id) ON DELETE CASCADE,
    capacity_min INTEGER DEFAULT 0,
    capacity_max INTEGER DEFAULT 0,
    separated_spaces BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.provider_catering (
    provider_id UUID PRIMARY KEY REFERENCES public.providers(id) ON DELETE CASCADE,
    product_types text[] DEFAULT '{}',
    delivery_options text[] DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS public.provider_music (
    provider_id UUID PRIMARY KEY REFERENCES public.providers(id) ON DELETE CASCADE,
    music_styles text[] DEFAULT '{}',
    equipment_provided text[] DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS public.provider_rentals (
    provider_id UUID PRIMARY KEY REFERENCES public.providers(id) ON DELETE CASCADE,
    with_chauffeur BOOLEAN DEFAULT false,
    vehicle_types text[] DEFAULT '{}',
    caution_amount NUMERIC DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.provider_beauty (
    provider_id UUID PRIMARY KEY REFERENCES public.providers(id) ON DELETE CASCADE,
    services_included text[] DEFAULT '{}'
);

-- 3. Create media table
CREATE TABLE IF NOT EXISTS public.provider_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    is_main BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.provider_venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_catering ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_music ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_beauty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_media ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Public read, Provider all)

CREATE POLICY "Public read provider venues" ON public.provider_venues FOR SELECT USING (true);
CREATE POLICY "Provider update own venues" ON public.provider_venues FOR ALL USING (provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid()));

CREATE POLICY "Public read provider catering" ON public.provider_catering FOR SELECT USING (true);
CREATE POLICY "Provider update own catering" ON public.provider_catering FOR ALL USING (provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid()));

CREATE POLICY "Public read provider music" ON public.provider_music FOR SELECT USING (true);
CREATE POLICY "Provider update own music" ON public.provider_music FOR ALL USING (provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid()));

CREATE POLICY "Public read provider rentals" ON public.provider_rentals FOR SELECT USING (true);
CREATE POLICY "Provider update own rentals" ON public.provider_rentals FOR ALL USING (provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid()));

CREATE POLICY "Public read provider beauty" ON public.provider_beauty FOR SELECT USING (true);
CREATE POLICY "Provider update own beauty" ON public.provider_beauty FOR ALL USING (provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid()));

CREATE POLICY "Public read provider media" ON public.provider_media FOR SELECT USING (true);
CREATE POLICY "Provider update own media" ON public.provider_media FOR ALL USING (provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid()));

-- 4. Create service_images bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('service_images', 'service_images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'service_images');
CREATE POLICY "Auth Insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'service_images');
CREATE POLICY "Auth Delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'service_images');

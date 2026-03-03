-- Migration V1.7 - My Services Module
-- This migration sets up the infrastructure for providers to manage their specific service offers.

-- 1. ENUMS & LOOKUPS
-- ============================================

DO $$ BEGIN
    CREATE TYPE public.service_price_unit AS ENUM ('per_event', 'per_hour', 'per_day', 'per_person', 'fixed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.inclusion_type AS ENUM ('included', 'optional', 'excluded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. TABLES
-- ============================================

-- Main Services Table
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
    service_category_id UUID NOT NULL REFERENCES public.service_categories(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    description TEXT, -- Rich Text content
    base_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    price_unit public.service_price_unit NOT NULL DEFAULT 'per_event',
    short_pitch TEXT, -- For the pricing card
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service Media (Limit 5 in UI)
CREATE TABLE IF NOT EXISTS public.service_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service Inclusions (Pills with status)
CREATE TABLE IF NOT EXISTS public.service_inclusions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    item_text VARCHAR(255) NOT NULL,
    inclusion_type public.inclusion_type NOT NULL DEFAULT 'included',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service Options (Add-ons)
CREATE TABLE IF NOT EXISTS public.service_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service FAQs
CREATE TABLE IF NOT EXISTS public.service_faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. INDEXES & PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_services_provider_id ON public.services(provider_id);
CREATE INDEX IF NOT EXISTS idx_services_category_id ON public.services(service_category_id);
CREATE INDEX IF NOT EXISTS idx_service_media_service_id ON public.service_media(service_id);
CREATE INDEX IF NOT EXISTS idx_service_inclusions_service_id ON public.service_inclusions(service_id);
CREATE INDEX IF NOT EXISTS idx_service_options_service_id ON public.service_options(service_id);
CREATE INDEX IF NOT EXISTS idx_service_faqs_service_id ON public.service_faqs(service_id);

-- 4. RLS POLICIES
-- ============================================
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_inclusions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_faqs ENABLE ROW LEVEL SECURITY;

-- Services Policies
CREATE POLICY "Anyone can view active services"
    ON public.services FOR SELECT
    USING (is_active = true);

CREATE POLICY "Providers can manage their own services"
    ON public.services FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.providers 
        WHERE id = provider_id AND user_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.providers 
        WHERE id = provider_id AND user_id = auth.uid()
    ));

-- Nested Relations Policies (Cascading access through Service ownership)
-- For simplicity and consistency, we check the provider of the linked service

CREATE POLICY "Service owners can manage media"
    ON public.service_media FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.services s
        JOIN public.providers p ON s.provider_id = p.id
        WHERE s.id = service_id AND p.user_id = auth.uid()
    ));

CREATE POLICY "Service owners can manage inclusions"
    ON public.service_inclusions FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.services s
        JOIN public.providers p ON s.provider_id = p.id
        WHERE s.id = service_id AND p.user_id = auth.uid()
    ));

CREATE POLICY "Service owners can manage options"
    ON public.service_options FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.services s
        JOIN public.providers p ON s.provider_id = p.id
        WHERE s.id = service_id AND p.user_id = auth.uid()
    ));

CREATE POLICY "Service owners can manage faqs"
    ON public.service_faqs FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.services s
        JOIN public.providers p ON s.provider_id = p.id
        WHERE s.id = service_id AND p.user_id = auth.uid()
    ));

-- 5. TRIGGER FOR UPDATED_AT
-- ============================================
CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON public.services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

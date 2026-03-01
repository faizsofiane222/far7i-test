-- Migration for Photographer / Videographer category
-- Date: 2026-02-28

CREATE TABLE IF NOT EXISTS public.provider_photographer (
    provider_id UUID PRIMARY KEY REFERENCES public.providers(id) ON DELETE CASCADE,
    coverage_options text[] DEFAULT '{}',
    service_types text[] DEFAULT '{}',
    technical_options text[] DEFAULT '{}',
    deliverables text[] DEFAULT '{}',
    delivery_time_weeks INTEGER DEFAULT 4,
    acompte_demande TEXT,
    politique_annulation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.provider_photographer ENABLE ROW LEVEL SECURITY;

-- Basic Policies
CREATE POLICY "Public read provider photographer" ON public.provider_photographer FOR SELECT USING (true);
CREATE POLICY "Provider update own photographer" ON public.provider_photographer FOR ALL USING (provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid()));

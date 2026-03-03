-- Migration for Catering (Traiteur)
-- Define handle_updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Enrich existing provider_catering table
ALTER TABLE IF EXISTS public.provider_catering 
    ADD COLUMN IF NOT EXISTS capacity_min integer DEFAULT 0,
    ADD COLUMN IF NOT EXISTS capacity_max integer,
    ADD COLUMN IF NOT EXISTS cuisine_types text[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS restoration_types_sale text[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS restoration_types_sucre text[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS menus_types text,
    ADD COLUMN IF NOT EXISTS formules_personnalisables text,
    ADD COLUMN IF NOT EXISTS delivery_possible boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS service_on_site boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS staff_service boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS staff_maitre_hotel boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS rent_dishes boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS rent_cutlery boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS rent_tablecloths boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS setup_table_dressing boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS setup_simple_decor boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS cleaning_post_event boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS dietary_allergies_management boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS acompte_demande text,
    ADD COLUMN IF NOT EXISTS politique_annulation text,
    ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
    ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Enable RLS
ALTER TABLE public.provider_catering ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.provider_catering;
CREATE POLICY "Public profiles are viewable by everyone" ON public.provider_catering
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Providers can update their own catering info" ON public.provider_catering;
CREATE POLICY "Providers can update their own catering info" ON public.provider_catering
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM public.providers WHERE id = provider_catering.provider_id
        )
    );

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_updated_at_provider_catering ON public.provider_catering;
CREATE TRIGGER set_updated_at_provider_catering
    BEFORE UPDATE ON public.provider_catering
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Add index
CREATE INDEX IF NOT EXISTS idx_provider_catering_provider_id ON public.provider_catering(provider_id);

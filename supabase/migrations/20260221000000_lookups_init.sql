-- Create Lookup Tables

CREATE TABLE IF NOT EXISTS public.wilayas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(2) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.communes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    wilaya_id UUID REFERENCES public.wilayas(id) ON DELETE CASCADE NOT NULL
);

CREATE TABLE IF NOT EXISTS public.service_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.event_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    active BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE public.wilayas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_types ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Public read wilayas" ON public.wilayas FOR SELECT USING (active = true);
CREATE POLICY "Public read communes" ON public.communes FOR SELECT USING (true);
CREATE POLICY "Public read service categories" ON public.service_categories FOR SELECT USING (active = true);
CREATE POLICY "Public read event types" ON public.event_types FOR SELECT USING (active = true);

-- Insert Data
INSERT INTO public.wilayas (code, name) VALUES
('16', 'Alger'),
('31', 'Oran'),
('25', 'Constantine'),
('09', 'Blida'),
('06', 'Béjaïa')
ON CONFLICT (code) DO NOTHING;

-- Insert a few communes corresponding to the wilayas
DO $$
DECLARE
    alger_id UUID;
    oran_id UUID;
BEGIN
    SELECT id INTO alger_id FROM public.wilayas WHERE code = '16';
    SELECT id INTO oran_id FROM public.wilayas WHERE code = '31';
    
    IF alger_id IS NOT NULL THEN
        INSERT INTO public.communes (name, wilaya_id) VALUES
        ('Alger Centre', alger_id),
        ('Sidi M''Hamed', alger_id),
        ('Kouba', alger_id),
        ('El Biar', alger_id);
    END IF;

    IF oran_id IS NOT NULL THEN
        INSERT INTO public.communes (name, wilaya_id) VALUES
        ('Oran', oran_id),
        ('Es Sénia', oran_id),
        ('Bir El Djir', oran_id);
    END IF;
END $$;

-- Insert Service Categories
INSERT INTO public.service_categories (label, slug) VALUES
('Photographe', 'photographe'),
('DJ / Animation', 'dj'),
('Salle des fêtes', 'salle'),
('Traiteur', 'traiteur'),
('Décoration', 'decoration')
ON CONFLICT (slug) DO NOTHING;

-- Insert Event Types
INSERT INTO public.event_types (label, slug) VALUES
('Mariage', 'mariage'),
('Fiançailles', 'fiancailles'),
('Anniversaire', 'anniversaire'),
('Soutenance', 'soutenance')
ON CONFLICT (slug) DO NOTHING;

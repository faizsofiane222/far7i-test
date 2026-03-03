-- ============================================
-- PROVIDER PROFILE IDENTITY V1 MIGRATION
-- ============================================

-- 1. EXTEND LOOKUP TABLES
-- ============================================

-- Communes Table
CREATE TABLE IF NOT EXISTS public.communes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wilaya_id UUID NOT NULL REFERENCES public.wilayas(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(wilaya_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_communes_wilaya_id ON public.communes(wilaya_id);

-- Service Categories Table (Refined)
CREATE TABLE IF NOT EXISTS public.service_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    label VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event Types Table
CREATE TABLE IF NOT EXISTS public.event_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    label VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ALTER PROVIDERS TABLE
-- ============================================

-- Rename existing columns for consistency with V1 spec
ALTER TABLE public.providers RENAME COLUMN business_name TO commercial_name;
ALTER TABLE public.providers RENAME COLUMN description TO bio;
ALTER TABLE public.providers RENAME COLUMN contact_phone TO phone_number;

-- Add new identity and contact columns
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS wilaya_id UUID REFERENCES public.wilayas(id);
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS commune_id UUID REFERENCES public.communes(id);
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS willingness_to_travel BOOLEAN DEFAULT false;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS is_whatsapp_active BOOLEAN DEFAULT false;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS is_viber_active BOOLEAN DEFAULT false;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS main_social_link TEXT;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS website_link TEXT;

-- 3. JUNCTION TABLES FOR EXPERTISE
-- ============================================

-- Link providers to multiple services
CREATE TABLE IF NOT EXISTS public.provider_services (
    provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.service_categories(id) ON DELETE CASCADE,
    PRIMARY KEY (provider_id, category_id)
);

-- Link providers to multiple event types
CREATE TABLE IF NOT EXISTS public.provider_events (
    provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE,
    event_type_id UUID REFERENCES public.event_types(id) ON DELETE CASCADE,
    PRIMARY KEY (provider_id, event_type_id)
);

-- 4. AUTO-SLUG LOGIC
-- ============================================

CREATE OR REPLACE FUNCTION public.generate_provider_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 1;
BEGIN
  -- Generate base slug from commercial_name
  base_slug := lower(regexp_replace(NEW.commercial_name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  
  final_slug := base_slug;
  
  -- Handle duplicates
  WHILE EXISTS (SELECT 1 FROM public.providers WHERE slug = final_slug AND id != NEW.id) LOOP
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  
  NEW.slug := final_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_provider_slug ON public.providers;
CREATE TRIGGER trg_generate_provider_slug
BEFORE INSERT OR UPDATE OF commercial_name
ON public.providers
FOR EACH ROW
EXECUTE FUNCTION public.generate_provider_slug();

-- 5. SEED DATA
-- ============================================

-- Seed Wilayas (Completing the 58 list)
INSERT INTO public.wilayas (code, slug, name, name_ar) VALUES
('01', 'adrar', 'Adrar', 'أدرار'),
('02', 'chlef', 'Chlef', 'الشلف'),
('03', 'laghouat', 'Laghouat', 'الأغواط'),
('04', 'oum-el-bouaghi', 'Oum El Bouaghi', 'أم البواقي'),
('05', 'batna', 'Batna', 'باتنة'),
('07', 'biskra', 'Biskra', 'بسكرة'),
('08', 'bechar', 'Béchar', 'بشار'),
('11', 'tamanrasset', 'Tamanrasset', 'تمنراست'),
('12', 'tebessa', 'Tébessa', 'تبسة'),
('13', 'tlemcen', 'Tlemcen', 'تلمسان'),
('14', 'tiaret', 'Tiaret', 'تيارت'),
('17', 'djelfa', 'Djelfa', 'الجلفة'),
('18', 'jijel', 'Jijel', 'جيجل'),
('20', 'saida', 'Saïda', 'سعيدة'),
('21', 'skikda', 'Skikda', 'سكيكدة'),
('22', 'sidi-bel-abbes', 'Sidi Bel Abbès', 'سيدي بلعباس'),
('24', 'guelma', 'Guelma', 'قالمة'),
('26', 'medea', 'Médéa', 'المدية'),
('27', 'mostaganem', 'Mostaganem', 'مستغانم'),
('28', 'm-sila', 'M''Sila', 'المسيلة'),
('29', 'mascara', 'Mascara', 'معسكر'),
('30', 'ouargla', 'Ouargla', 'ورقلة'),
('32', 'el-bayadh', 'El Bayadh', 'البيض'),
('33', 'illizi', 'Illizi', 'إليزي'),
('34', 'bordj-bou-arreridj', 'Bordj Bou Arréridj', 'برج بوعريريج'),
('35', 'boumerdes', 'Boumerdès', 'بومرداس'),
('36', 'el-tarf', 'El Tarf', 'الطارف'),
('37', 'tindouf', 'Tindouf', 'تندوف'),
('38', 'tissemsilt', 'Tissemsilt', 'تيسمسيلت'),
('39', 'el-oued', 'El Oued', 'الوادي'),
('40', 'khenchela', 'Khenchela', 'خنشلة'),
('41', 'souk-ahras', 'Souk Ahras', 'سوق أهراس'),
('43', 'mila', 'Mila', 'ميلة'),
('44', 'ain-defla', 'Aïn Defla', 'عين الدفلى'),
('45', 'naama', 'Naâma', 'النعامة'),
('46', 'ain-temouchent', 'Aïn Témouchent', 'عين تموشنت'),
('47', 'ghardaia', 'Ghardaïa', 'غرداية'),
('48', 'relizane', 'Relizane', 'غليزان'),
('49', 'el-m-ghair', 'El M''Ghair', 'المغير'),
('50', 'el-meniaa', 'El Meniaâ', 'المنيعة'),
('51', 'ouled-djellal', 'Ouled Djellal', 'أولاد جلال'),
('52', 'bordj-badji-mokhtar', 'Bordj Badji Mokhtar', 'برج باجي مختار'),
('53', 'beni-abbes', 'Béni Abbès', 'بني عباس'),
('54', 'timimoun', 'Timimoun', 'تيميمون'),
('55', 'touggourt', 'Touggourt', 'تقرت'),
('56', 'djanet', 'Djanet', 'جانت'),
('57', 'inh-salah', 'In Salah', 'عين صالح'),
('58', 'inh-guezzam', 'In Guezzam', 'عين قزام')
ON CONFLICT (code) DO NOTHING;

-- Seed Sample Communes for Alger (Code 16)
WITH alger AS (SELECT id FROM public.wilayas WHERE code = '16')
INSERT INTO public.communes (wilaya_id, name, slug) VALUES
((SELECT id FROM alger), 'Alger Centre', 'alger-centre'),
((SELECT id FROM alger), 'Sidi M''Hamed', 'sidi-m-hamed'),
((SELECT id FROM alger), 'El Biar', 'el-biar'),
((SELECT id FROM alger), 'Hydra', 'hydra'),
((SELECT id FROM alger), 'Dely Ibrahim', 'dely-ibrahim'),
((SELECT id FROM alger), 'Cheraga', 'cheraga'),
((SELECT id FROM alger), 'Kouba', 'kouba'),
((SELECT id FROM alger), 'Bab El Oued', 'bab-el-oued'),
((SELECT id FROM alger), 'Bordj El Kiffan', 'bordj-el-kiffan'),
((SELECT id FROM alger), 'Reghaia', 'reghaia')
ON CONFLICT (wilaya_id, slug) DO NOTHING;

-- Seed Service Categories
INSERT INTO public.service_categories (name, label) VALUES
('photographe', 'Photographe'),
('videaste', 'Vidéaste'),
('dj', 'DJ'),
('salle-des-fetes', 'Salle des fêtes'),
('traiteur', 'Traiteur'),
('negafa', 'Negafa'),
('coiffeuse', 'Coiffeuse / Maquilleuse'),
('patissier', 'Pâtissier'),
('location-voiture', 'Location de voiture')
ON CONFLICT (name) DO NOTHING;

-- Seed Event Types
INSERT INTO public.event_types (name, label) VALUES
('mariage', 'Mariage'),
('fiancailles', 'Fiançailles'),
('circoncision', 'Circoncision'),
('anniversaire', 'Anniversaire'),
('autre-fete', 'Autre fête')
ON CONFLICT (name) DO NOTHING;

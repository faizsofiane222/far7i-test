-- Migration V1.8 - Service Category Suggestions
-- Move hardcoded suggestions from frontend to database

-- 1. TABLE CREATION
-- ============================================
CREATE TABLE IF NOT EXISTS public.service_category_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_label VARCHAR(255) NOT NULL, -- Storing label directly for simplicity in seeding, or we can look up IDs
    item_text VARCHAR(255) NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_suggestions_category_label ON public.service_category_suggestions(category_label);

-- 3. RLS POLICIES
-- ============================================
ALTER TABLE public.service_category_suggestions ENABLE ROW LEVEL SECURITY;

-- Everyone can read suggestions
CREATE POLICY "Anyone can view service category suggestions"
    ON public.service_category_suggestions FOR SELECT
    USING (true);

-- Only admins/service role can manage (for now, manual management via dashboard)
-- We add a policy that effectively disables writes from client for safety, 
-- unless we want to allow providers to suggest new global items (future feature).

-- 4. SEED DATA
-- ============================================
INSERT INTO public.service_category_suggestions (category_label, item_text, is_default) VALUES
    -- Default / Common
    ('default', 'SAV & Support', true),
    ('default', 'Déplacement', true),
    ('default', 'Assurance', true),

    -- Photographe
    ('Photographe', 'Retouche photo numérique', true),
    ('Photographe', 'Galerie en ligne sécurisée', true),
    ('Photographe', 'Album photo physique', true),
    ('Photographe', 'Clé USB avec fichiers HD', true),
    ('Photographe', 'Deuxième photographe', true),

    -- DJ
    ('DJ', 'Sonorisation complète', true),
    ('DJ', 'Jeux de lumières', true),
    ('DJ', 'Micro sans fil', true),
    ('DJ', 'Fumée lourde / Étincelles', true),
    ('DJ', 'Playliste personnalisée', true),

    -- Traiteur
    ('Traiteur', 'Service à table', true),
    ('Traiteur', 'Vaisselle & Nappage', true),
    ('Traiteur', 'Boissons à volonté', true),
    ('Traiteur', 'Gâteau de mariage', true),
    ('Traiteur', 'Serveurs dédiés', true),

    -- Salle
    ('Salle', 'Nettoyage', true),
    ('Salle', 'Sécurité / Gardiennage', true),
    ('Salle', 'Parking', true),
    ('Salle', 'Climatisation / Chauffage', true),
    ('Salle', 'Loge mariée', true),

    -- Déco
    ('Déco', 'Installation complète', true),
    ('Déco', 'Fleurs fraîches', true),
    ('Déco', 'Arche de cérémonie', true),
    ('Déco', 'Centres de table', true),
    ('Déco', 'Désinstallation', true);

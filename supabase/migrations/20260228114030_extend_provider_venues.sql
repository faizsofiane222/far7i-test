-- Enrichissement de la table `provider_venues` (Salles des fÃªtes)
-- BasÃ© sur les caractÃ©ristiques Ã©tendues dÃ©finies par l'utilisateur.

ALTER TABLE IF EXISTS public.provider_venues 
    -- 3. CapacitÃ©s & configurations
    ADD COLUMN IF NOT EXISTS surface_m2 INTEGER,
    -- (capacity_min et capacity_max existent dÃ©jÃ  selon 20260222201000)
    
    -- 4. Espaces disponibles
    ADD COLUMN IF NOT EXISTS salle_femmes_cap INTEGER,
    ADD COLUMN IF NOT EXISTS salle_hommes_cap INTEGER,
    ADD COLUMN IF NOT EXISTS salle_mixte_cap INTEGER, -- = salle unique globale
    ADD COLUMN IF NOT EXISTS salle_dinatoire BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS couverts_par_service INTEGER,
    ADD COLUMN IF NOT EXISTS jardin BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS terrasse BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS piscine BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS parking_places INTEGER,
    ADD COLUMN IF NOT EXISTS loge_maries_nb INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS loge_invites_nb INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS salle_attente BOOLEAN DEFAULT false,

    -- 5. Services internes & Ã©quipements
    -- Service
    ADD COLUMN IF NOT EXISTS serveurs_mixte BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS serveuses_femmes BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS nettoyage_inclus BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS securite_incluse BOOLEAN DEFAULT false,
    -- AmÃ©nagement
    ADD COLUMN IF NOT EXISTS piste_danse BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS mobilier_inclus BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS nappes_incluses BOOLEAN DEFAULT false,
    -- Confort
    ADD COLUMN IF NOT EXISTS climatisation BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS chauffage BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS ventilation BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS acces_pmr BOOLEAN DEFAULT false,
    -- Technique
    ADD COLUMN IF NOT EXISTS sonorisation_base BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS jeux_lumiere BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS videoprojecteur BOOLEAN DEFAULT false,

    -- 6. Services Ã©vÃ©nementiels supplÃ©mentaires (Restauration / Anim)
    -- 'impose', 'libre', 'aucun'
    ADD COLUMN IF NOT EXISTS traiteur_type TEXT DEFAULT 'libre',
    ADD COLUMN IF NOT EXISTS cuisine_equipee BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS vaisselle_incluse BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS eau_incluse BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS cafe_inclus BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS the_inclus BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS jus_inclus BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS dj_inclus BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS animateur_inclus BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS valet_inclus BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS cameras_incluses BOOLEAN DEFAULT false,

    -- 7. Tarification & conditions
    ADD COLUMN IF NOT EXISTS acompte_pourcentage NUMERIC,
    ADD COLUMN IF NOT EXISTS politique_annulation TEXT,

    -- 8. Informations pratiques complÃ©mentaires
    ADD COLUMN IF NOT EXISTS horaires_journee BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS horaires_soiree BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS horaires_nuit BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS contraintes_regles TEXT;

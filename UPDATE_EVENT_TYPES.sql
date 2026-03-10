-- Copy this query and paste it in your Supabase SQL Editor to update all event types.
-- This guarantees every form (which already queries this table) will have exactly this list.

BEGIN;

-- Supprimer l'existant pour rafraîchir la liste proprement
DELETE FROM public.event_types;

-- Insérer la nouvelle nomenclature (les identifiants seront générés automatiquement)
INSERT INTO public.event_types (id, slug, label, active) VALUES
(gen_random_uuid(), 'mariage', 'Mariage', true),
(gen_random_uuid(), 'fiancailles', 'Fiançailles (khotba)', true),
(gen_random_uuid(), 'naissance', 'Naissance (z''yada, sbou3)', true),
(gen_random_uuid(), 'circoncision', 'Circoncision', true),
(gen_random_uuid(), 'anniversaire', 'Anniversaire', true),
(gen_random_uuid(), 'reussite', 'Fête de réussite (BAC, BEM, master, thèse...)', true),
(gen_random_uuid(), 'soutenance', 'Soutenance universitaire', true),
(gen_random_uuid(), 'professionnel', 'Événement professionnel (conférence, séminaire, team building, événement scolaire ou associatif)', true);

COMMIT;

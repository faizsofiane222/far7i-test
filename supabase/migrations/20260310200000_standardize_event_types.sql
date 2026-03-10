-- Insert the exact list of standardized event types for the platform
-- This script replaces all existing rows to ensure the exact list is applied.

BEGIN;

-- First, delete all old event_types (assuming dependencies cascade or don't block. We assume providers store array of strings `events_accepted`, not FK, based on previous code)
DELETE FROM public.event_types;

-- Insert the new standardized list
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

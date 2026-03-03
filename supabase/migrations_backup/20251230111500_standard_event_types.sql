-- Migration: Standardize Event Types
-- This replaces existing event types with the new standardized list

-- Disable RLS for this operation if needed (not usually in migrations)
-- Truncate existing event types (will cascade delete provider_events)
TRUNCATE public.event_types CASCADE;

-- Insert standardized event types
INSERT INTO public.event_types (name, label) VALUES
('mariage', 'Mariage'),
('fiancailles_khotba', 'Fiançailles (khotba)'),
('naissance_sbou3', 'Naissance (z’yada, sbou3)'),
('circoncision', 'Circoncision'),
('anniversaire', 'Anniversaire'),
('fete_reussite', 'Fête de réussite (BAC, BEM, master, thèse…)'),
('soutenance_universitaire', 'Soutenance universitaire'),
('evenement_professionnel', 'Événement professionnel (conférence, séminaire, team building, événement scolaire ou associatif)');

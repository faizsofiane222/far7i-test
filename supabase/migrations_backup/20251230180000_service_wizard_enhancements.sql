-- Migration: Service Wizard Enhancements
-- Add quality_score and step_completed columns to services table

ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS quality_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS step_completed INTEGER DEFAULT 1;

-- Update RLS if necessary (usually not needed for just adding columns if existing policy is broad)

COMMENT ON COLUMN public.services.quality_score IS 'Score de qualité de la prestation (0-100) pour le tri et la visibilité.';
COMMENT ON COLUMN public.services.step_completed IS 'Dernière étape validée par le prestataire dans le wizard (1-4).';

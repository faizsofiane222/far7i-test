ALTER TABLE public.services ADD COLUMN IF NOT EXISTS quality_score INTEGER DEFAULT 0;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS step_completed INTEGER DEFAULT 1;

COMMENT ON COLUMN public.services.quality_score IS 'Score de qualité de la prestation (0-100) pour le tri et la visibilité.';
COMMENT ON COLUMN public.services.step_completed IS 'Dernière étape validée par le prestataire dans le wizard (1-4).';

-- Force schema reload
NOTIFY pgrst, 'reload schema';

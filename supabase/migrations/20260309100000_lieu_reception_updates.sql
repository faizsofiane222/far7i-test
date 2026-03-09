-- Adding fixed amount deposit column to provider_venues
ALTER TABLE public.provider_venues 
ADD COLUMN IF NOT EXISTS acompte_montant NUMERIC DEFAULT 0;

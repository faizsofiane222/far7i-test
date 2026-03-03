-- Extend provider_music for V1 Definitif — DJ / ORCHESTRE
ALTER TABLE public.provider_music
ADD COLUMN IF NOT EXISTS is_dj BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_orchestra BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS animation_options TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS equipment_options TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS acompte_demande BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS caution_demande BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS politique_annulation TEXT;

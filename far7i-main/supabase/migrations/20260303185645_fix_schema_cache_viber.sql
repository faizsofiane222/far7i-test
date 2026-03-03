-- Force addition of is_viber_active and reload schema cache

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name='providers' AND column_name='is_viber_active'
    ) THEN
        ALTER TABLE public.providers ADD COLUMN is_viber_active BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

COMMENT ON COLUMN public.providers.is_viber_active IS 'Indicates if the provider uses Viber';

-- Reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';

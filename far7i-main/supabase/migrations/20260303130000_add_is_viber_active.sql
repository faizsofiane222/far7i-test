-- Add is_viber_active and ensure is_whatsapp_active exists in providers table

DO $$ 
BEGIN
    -- 1. Check/Add is_whatsapp_active
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name='providers' AND column_name='is_whatsapp_active'
    ) THEN
        ALTER TABLE public.providers ADD COLUMN is_whatsapp_active BOOLEAN DEFAULT FALSE;
    END IF;

    -- 2. Check/Add is_viber_active
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name='providers' AND column_name='is_viber_active'
    ) THEN
        ALTER TABLE public.providers ADD COLUMN is_viber_active BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Update the comments for documentation
COMMENT ON COLUMN public.providers.is_whatsapp_active IS 'Indicates if the provider uses WhatsApp';
COMMENT ON COLUMN public.providers.is_viber_active IS 'Indicates if the provider uses Viber';

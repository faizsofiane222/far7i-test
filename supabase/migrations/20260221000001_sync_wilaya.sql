-- 1. Add wilaya_id to providers
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name='providers' AND column_name='wilaya_id'
    ) THEN
        ALTER TABLE public.providers ADD COLUMN wilaya_id UUID REFERENCES public.wilayas(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 2. Add is_whatsapp_active to providers
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name='providers' AND column_name='is_whatsapp_active'
    ) THEN
        ALTER TABLE public.providers ADD COLUMN is_whatsapp_active BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 3. Update handle_new_user trigger to save wilaya_id
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    default_display_name TEXT;
    user_role TEXT;
    p_wilaya_id UUID;
BEGIN
    -- Extract display name from metadata
    default_display_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name', 
        NEW.raw_user_meta_data->>'name', 
        NEW.raw_user_meta_data->>'display_name', 
        NEW.raw_user_meta_data->>'businessName',
        NEW.raw_user_meta_data->>'business_name',
        SPLIT_PART(NEW.email, '@', 1)
    );

    -- Extract Role (default to client)
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'client');

    -- Attempt to parse wilaya_id
    BEGIN
        p_wilaya_id := (NEW.raw_user_meta_data->>'wilaya')::UUID;
    EXCEPTION WHEN OTHERS THEN
        p_wilaya_id := NULL;
    END;

    -- 1. Insert into public.users
    INSERT INTO public.users (id, email, display_name, email_verified, role)
    VALUES (
        NEW.id, 
        NEW.email, 
        default_display_name,
        NEW.email_confirmed_at IS NOT NULL,
        user_role
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        display_name = COALESCE(public.users.display_name, EXCLUDED.display_name),
        email_verified = EXCLUDED.email_verified,
        role = EXCLUDED.role;
    
    -- 2. Insert into public.user_roles
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, user_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    -- 3. If Provider, create Provider Record with Registration Metadata
    IF user_role = 'provider' THEN
        INSERT INTO public.providers (
            user_id, 
            commercial_name, 
            phone_number, 
            provider_type, 
            main_social_link,
            email,
            moderation_status,
            wilaya_id
        )
        VALUES (
            NEW.id,
            COALESCE(
                NEW.raw_user_meta_data->>'business_name', 
                NEW.raw_user_meta_data->>'businessName', 
                default_display_name
            ),
            NEW.raw_user_meta_data->>'phone',
            NEW.raw_user_meta_data->>'partner_type',
            NEW.raw_user_meta_data->>'social_link',
            NEW.email,
            'incomplete',
            p_wilaya_id
        )
        ON CONFLICT (user_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

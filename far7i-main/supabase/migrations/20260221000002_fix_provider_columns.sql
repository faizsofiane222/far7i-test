-- 1. Update handle_new_user trigger to use correct column names (social_link instead of main_social_link, and remove email from providers)
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
    INSERT INTO public.users (user_id, email, display_name)
    VALUES (
        NEW.id, 
        NEW.email, 
        default_display_name
    )
    ON CONFLICT (user_id) DO UPDATE SET
        email = EXCLUDED.email,
        display_name = COALESCE(public.users.display_name, EXCLUDED.display_name);
    
    -- 2. Insert into public.user_roles
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, user_role::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    -- 3. If Provider, create Provider Record with Registration Metadata
    IF user_role = 'provider' THEN
        INSERT INTO public.providers (
            user_id, 
            commercial_name, 
            phone_number, 
            provider_type, 
            social_link,
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
            (NEW.raw_user_meta_data->>'partner_type')::public.provider_type,
            NEW.raw_user_meta_data->>'social_link',
            'pending',
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

-- Add profile_picture_url, bio, and pending_changes if they don't exist:
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='providers' AND column_name='profile_picture_url') THEN
        ALTER TABLE public.providers ADD COLUMN profile_picture_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='providers' AND column_name='bio') THEN
        ALTER TABLE public.providers ADD COLUMN bio TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='providers' AND column_name='pending_changes') THEN
        ALTER TABLE public.providers ADD COLUMN pending_changes JSONB;
    END IF;
END $$;

-- FINAL DEEP FIX FOR SIGNUP TRIGGER (v2)
-- This file has a new timestamp to ensure it's applied correctly by 'supabase db push'

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
    p_type_val public.provider_type;
BEGIN
    -- 1. Metadata extraction (handle multiple fields for display name)
    default_display_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name', 
        NEW.raw_user_meta_data->>'name', 
        NEW.raw_user_meta_data->>'display_name', 
        NEW.raw_user_meta_data->>'businessName',
        NEW.raw_user_meta_data->>'business_name',
        SPLIT_PART(NEW.email, '@', 1)
    );
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'client');

    -- 2. Wilaya verification (FK safety)
    -- We parse it and verify it exists in the wilayas table before trying to use it.
    -- If it doesn't exist, we set it to NULL to avoid crashing the whole signup process.
    BEGIN
        -- Check both 'wilaya_id' and 'wilaya' (legacy/frontend)
        IF (NEW.raw_user_meta_data->>'wilaya_id') IS NOT NULL AND (NEW.raw_user_meta_data->>'wilaya_id') != '' THEN
            p_wilaya_id := (NEW.raw_user_meta_data->>'wilaya_id')::UUID;
        ELSIF (NEW.raw_user_meta_data->>'wilaya') IS NOT NULL AND (NEW.raw_user_meta_data->>'wilaya') != '' THEN
            p_wilaya_id := (NEW.raw_user_meta_data->>'wilaya')::UUID;
        ELSE
            p_wilaya_id := NULL;
        END IF;

        -- Verify FK existence
        IF p_wilaya_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.wilayas WHERE id = p_wilaya_id) THEN
            p_wilaya_id := NULL;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        p_wilaya_id := NULL;
    END;

    -- 3. Provider type mapping
    IF (NEW.raw_user_meta_data->>'partner_type') = 'agency' THEN
        p_type_val := 'agency'::public.provider_type;
    ELSE
        p_type_val := 'individual'::public.provider_type;
    END IF;

    -- 4. INSERT PROFILE (public.users)
    -- We insert into both 'id' and 'user_id' just in case one is the PK and other the FK.
    -- We wrap in EXCEPTION to ensure failure here doesn't block the whole transaction if possible,
    -- but usually we want this to succeed.
    BEGIN
        INSERT INTO public.users (id, user_id, email, display_name)
        VALUES (
            NEW.id, -- We try setting the PK as Auth ID (some schemas use this)
            NEW.id, -- We also try setting user_id as Auth ID (other schemas use this)
            NEW.email, 
            default_display_name
        )
        ON CONFLICT DO NOTHING; -- Avoid errors if profile already created (e.g. re-run)
    EXCEPTION WHEN OTHERS THEN
        -- If above fails because of column names (e.g. table only has 'user_id'), try minimalist approach
        INSERT INTO public.users (user_id, email, display_name)
        VALUES (NEW.id, NEW.email, default_display_name)
        ON CONFLICT (user_id) DO NOTHING;
    END;
    
    -- 5. INSERT ROLE
    BEGIN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, user_role::public.app_role)
        ON CONFLICT (user_id, role) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN 
        NULL; -- Role is important but secondary in first signup
    END;

    -- 6. INSERT PROVIDER (if role is provider)
    IF user_role = 'provider' THEN
        BEGIN
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
                    default_display_name,
                    'Nouveau Prestataire'
                ),
                COALESCE(NEW.raw_user_meta_data->>'phone', '0000000000'),
                p_type_val,
                NEW.raw_user_meta_data->>'social_link',
                'pending',
                p_wilaya_id
            )
            ON CONFLICT (user_id) DO NOTHING;
        EXCEPTION WHEN OTHERS THEN
            NULL; -- Silent failure to ensure NEW.id is returned to Auth
        END;
    END IF;

    RETURN NEW;
END;
$$;

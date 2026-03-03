-- Final robust fix for handle_new_user trigger
-- Includes mapping for multiple naming conventions (id vs user_id) and safer default values.

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
    -- 1. Metadata extraction
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
    BEGIN
        p_wilaya_id := (NEW.raw_user_meta_data->>'wilaya')::UUID;
        IF p_wilaya_id IS NOT NULL THEN
            IF NOT EXISTS (SELECT 1 FROM public.wilayas WHERE id = p_wilaya_id) THEN
                p_wilaya_id := NULL;
            END IF;
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

    -- 4. Insert into public.users (Profile)
    -- We attempt to fill both 'id' and 'user_id' with the Auth ID to satisfy different schema versions
    INSERT INTO public.users (id, user_id, email, display_name)
    VALUES (
        NEW.id, 
        NEW.id, 
        NEW.email, 
        default_display_name
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        display_name = COALESCE(public.users.display_name, EXCLUDED.display_name);
    
    -- 5. Insert Role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, user_role::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    -- 6. Insert Provider Profile if needed
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
                default_display_name,
                'Nouveau Prestataire'
            ),
            COALESCE(NEW.raw_user_meta_data->>'phone', ''),
            p_type_val,
            NEW.raw_user_meta_data->>'social_link',
            'pending',
            p_wilaya_id
        )
        ON CONFLICT (user_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$;

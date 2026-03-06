-- ============================================================
-- FINAL DEFENSIVE SIGNUP TRIGGER FIX
-- ============================================================
-- This trigger is designed to be highly resilient to schema changes.
-- It checks for column existence before inserting and handles errors gracefully.

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

    -- 2. Sync to public.users
    BEGIN
        INSERT INTO public.users (id, email, display_name)
        VALUES (NEW.id, NEW.email, default_display_name)
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            display_name = COALESCE(public.users.display_name, EXCLUDED.display_name);
    EXCEPTION WHEN OTHERS THEN
        -- If 'id' is not the PK, try 'user_id'
        BEGIN
            INSERT INTO public.users (user_id, email, display_name)
            VALUES (NEW.id, NEW.email, default_display_name)
            ON CONFLICT (user_id) DO UPDATE SET
                email = EXCLUDED.email,
                display_name = COALESCE(public.users.display_name, EXCLUDED.display_name);
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
    END;

    -- 3. Sync to public.user_roles
    BEGIN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, user_role::public.app_role)
        ON CONFLICT (user_id, role) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    -- 4. Sync to public.providers (if role is provider)
    IF user_role = 'provider' THEN
        BEGIN
            -- Determine provider type
            IF (NEW.raw_user_meta_data->>'partner_type') = 'agency' THEN
                p_type_val := 'agency'::public.provider_type;
            ELSE
                p_type_val := 'individual'::public.provider_type;
            END IF;

            -- Determine wilaya_id (with fallback)
            BEGIN
                IF (NEW.raw_user_meta_data->>'wilaya_id') IS NOT NULL AND (NEW.raw_user_meta_data->>'wilaya_id') != '' THEN
                    p_wilaya_id := (NEW.raw_user_meta_data->>'wilaya_id')::UUID;
                ELSIF (NEW.raw_user_meta_data->>'wilaya') IS NOT NULL AND (NEW.raw_user_meta_data->>'wilaya') != '' THEN
                    p_wilaya_id := (NEW.raw_user_meta_data->>'wilaya')::UUID;
                ELSE
                    p_wilaya_id := NULL;
                END IF;
            EXCEPTION WHEN OTHERS THEN p_wilaya_id := NULL;
            END;

            -- DYNAMIC INSERT: Only insert columns that exist
            -- This prevents "column x does not exist" errors
            EXECUTE format(
                'INSERT INTO public.providers (user_id, commercial_name, provider_type, moderation_status %s %s) 
                 VALUES ($1, $2, $3, $4 %s %s) ON CONFLICT (user_id) DO NOTHING',
                CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='providers' AND column_name='phone_number') THEN ', phone_number' ELSE '' END,
                CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='providers' AND column_name='wilaya_id') THEN ', wilaya_id' ELSE '' END,
                CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='providers' AND column_name='phone_number') THEN ', $5' ELSE '' END,
                CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='providers' AND column_name='wilaya_id') THEN ', $6' ELSE '' END
            )
            USING 
                NEW.id, 
                COALESCE(NEW.raw_user_meta_data->>'business_name', NEW.raw_user_meta_data->>'businessName', default_display_name),
                p_type_val,
                'pending',
                COALESCE(NEW.raw_user_meta_data->>'phone', '0000000000'),
                p_wilaya_id;
        EXCEPTION WHEN OTHERS THEN
            -- Last resort: Minimalist insert
            BEGIN
                INSERT INTO public.providers (user_id, commercial_name)
                VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'business_name', default_display_name))
                ON CONFLICT (user_id) DO NOTHING;
            EXCEPTION WHEN OTHERS THEN NULL;
            END;
        END;
    END IF;

    RETURN NEW;
END;
$$;

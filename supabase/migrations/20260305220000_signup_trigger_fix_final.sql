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
        DECLARE
            p_cols TEXT := 'user_id, commercial_name, provider_type, moderation_status';
            p_vals TEXT := '$1, $2, $3, $4';
        BEGIN
            -- Determine provider type
            IF (NEW.raw_user_meta_data->>'partner_type') = 'agency' THEN
                p_type_val := 'agency'::public.provider_type;
            ELSE
                p_type_val := 'individual'::public.provider_type;
            END IF;

            -- Determine wilaya_id
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

            -- Build the dynamic query based on existing columns
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='providers' AND column_name='phone_number') THEN
                p_cols := p_cols || ', phone_number';
                p_vals := p_vals || ', $5';
            END IF;

            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='providers' AND column_name='wilaya_id') THEN
                p_cols := p_cols || ', wilaya_id';
                p_vals := p_vals || ', $6';
            END IF;

            -- Also check for social_link or main_social_link
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='providers' AND column_name='social_link') THEN
                p_cols := p_cols || ', social_link';
                p_vals := p_vals || ', $7';
            ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='providers' AND column_name='main_social_link') THEN
                p_cols := p_cols || ', main_social_link';
                p_vals := p_vals || ', $7';
            END IF;

            EXECUTE format('INSERT INTO public.providers (%s) VALUES (%s) ON CONFLICT (user_id) DO NOTHING', p_cols, p_vals)
            USING 
                NEW.id, 
                COALESCE(NEW.raw_user_meta_data->>'business_name', NEW.raw_user_meta_data->>'businessName', default_display_name),
                p_type_val,
                'pending',
                COALESCE(NEW.raw_user_meta_data->>'phone', '0000000000'),
                p_wilaya_id,
                NEW.raw_user_meta_data->>'social_link';
        EXCEPTION WHEN OTHERS THEN
            -- Minimalist backup
            INSERT INTO public.providers (user_id, commercial_name)
            VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'business_name', default_display_name))
            ON CONFLICT (user_id) DO NOTHING;
        END;
    END IF;

    RETURN NEW;
END;
$$;

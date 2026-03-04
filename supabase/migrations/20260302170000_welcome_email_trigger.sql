-- 1. Add email_confirmed_at to public.users to allow easy dashboard webhooks
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name='users' AND column_name='email_confirmed_at'
    ) THEN
        ALTER TABLE public.users ADD COLUMN email_confirmed_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 2. Update the sync function to include email confirmation
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
    -- Metadata extraction
    default_display_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name', 
        NEW.raw_user_meta_data->>'name', 
        NEW.raw_user_meta_data->>'display_name', 
        NEW.raw_user_meta_data->>'businessName',
        NEW.raw_user_meta_data->>'business_name',
        SPLIT_PART(NEW.email, '@', 1)
    );
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'client');

    -- Sync to public.users (Profile)
    INSERT INTO public.users (user_id, email, display_name, email_confirmed_at)
    VALUES (NEW.id, NEW.email, default_display_name, NEW.email_confirmed_at)
    ON CONFLICT (user_id) DO UPDATE SET
        email = EXCLUDED.email,
        display_name = COALESCE(public.users.display_name, EXCLUDED.display_name),
        email_confirmed_at = EXCLUDED.email_confirmed_at;

    -- ... rest of the logic (roles, providers) remains the same in the database
    -- (This assumes the rest of the logic is already in the DB from previous migrations)
    -- To be safe, we re-apply the roles/providers logic from the latest robust version
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, user_role::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    IF user_role = 'provider' THEN
        -- Wilaya extraction
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

        IF (NEW.raw_user_meta_data->>'partner_type') = 'agency' THEN
            p_type_val := 'agency'::public.provider_type;
        ELSE
            p_type_val := 'individual'::public.provider_type;
        END IF;

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
            COALESCE(NEW.raw_user_meta_data->>'business_name', NEW.raw_user_meta_data->>'businessName', default_display_name),
            COALESCE(NEW.raw_user_meta_data->>'phone', '0000000000'),
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

-- 3. Create a separate update trigger to sync email confirmation when it happens later
CREATE OR REPLACE FUNCTION public.sync_user_confirmation()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.users
  SET email_confirmed_at = NEW.email_confirmed_at,
      updated_at = now()
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_confirmation();

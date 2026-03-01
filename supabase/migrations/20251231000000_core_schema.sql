-- ==========================================
-- FAR7I CORE SCHEMA INITIALIZATION
-- ==========================================

-- 1. Create Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'provider', 'client');
CREATE TYPE public.provider_type AS ENUM ('individual', 'agency');

-- 2. Create User Roles Table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, role)
);

-- 3. Create Public Users Table (Generic Profile)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    email TEXT NOT NULL,
    display_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Providers Table (Partner Details)
CREATE TABLE IF NOT EXISTS public.providers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    commercial_name TEXT NOT NULL,
    provider_type public.provider_type NOT NULL DEFAULT 'individual',
    phone_number TEXT NOT NULL,
    social_link TEXT,
    moderation_status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Set up Row Level Security (RLS) basics (Admin bypassing everything is often done elsewhere, but we secure basic reads)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own roles
CREATE POLICY "Users can read own roles" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile" ON public.users
    FOR SELECT USING (auth.uid() = user_id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = user_id);

-- Allow providers to read their own data
CREATE POLICY "Providers can read own data" ON public.providers
    FOR SELECT USING (auth.uid() = user_id);

-- Allow providers to update their own data
CREATE POLICY "Providers can update own data" ON public.providers
    FOR UPDATE USING (auth.uid() = user_id);

-- Allow public read of approved providers (Assuming moderation_status 'approved' will be used later)
CREATE POLICY "Public can view approved providers" ON public.providers
    FOR SELECT USING (moderation_status = 'approved');


-- 6. Trigger to automatically handle new signups from Auth
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
    role_val public.app_role;
    p_type_val public.provider_type;
BEGIN
    -- Determine role from metadata, default to client
    IF (NEW.raw_user_meta_data->>'role') = 'provider' THEN
        role_val := 'provider'::public.app_role;
    ELSIF (NEW.raw_user_meta_data->>'role') = 'admin' THEN
        role_val := 'admin'::public.app_role;
    ELSE
        role_val := 'client'::public.app_role;
    END IF;

    -- Determine provider type
    IF (NEW.raw_user_meta_data->>'partner_type') = 'agency' THEN
        p_type_val := 'agency'::public.provider_type;
    ELSE
        p_type_val := 'individual'::public.provider_type;
    END IF;

    -- 1. Insert Role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, role_val)
    ON CONFLICT (user_id, role) DO NOTHING;

    -- 2. Insert Generic Profile
    INSERT INTO public.users (user_id, email, display_name)
    VALUES (
        NEW.id, 
        NEW.email, 
        NEW.raw_user_meta_data->>'display_name'
    )
    ON CONFLICT (user_id) DO NOTHING;

    -- 3. Insert Provider Profile if role is provider
    IF role_val = 'provider' THEN
        INSERT INTO public.providers (
            user_id,
            commercial_name,
            provider_type,
            phone_number,
            social_link
        )
        VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'business_name', NEW.raw_user_meta_data->>'display_name', 'Unnamed Business'),
            p_type_val,
            COALESCE(NEW.raw_user_meta_data->>'phone', ''),
            NEW.raw_user_meta_data->>'social_link'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

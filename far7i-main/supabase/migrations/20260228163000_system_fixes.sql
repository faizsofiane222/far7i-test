-- 1. Create Notifications Table (Fix 404)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'info', 'success', 'warning', 'error'
    title TEXT NOT NULL,
    message TEXT,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- 2. Fix Reviews Jointure (Fix 400)
-- The profiles table is actually 'public.users' in this setup.
-- We add an explicit foreign key to help PostgREST understand the link for profiles:client_id(full_name)
-- Actually, let's check if 'profiles' view or table exists. If not, we use 'users'.
-- In Services.tsx, it asks for 'profiles:client_id(full_name)'.
-- Let's create a VIEW 'profiles' if it doesn't exist, as an alias for 'users'.
CREATE OR REPLACE VIEW public.profiles AS 
SELECT user_id as id, email, display_name as full_name, created_at FROM public.users;

-- 3. Ensure Cascade Deletes for Providers (Fix Delete issue)
-- Already handled in most migrations, but let's be thorough for all children
ALTER TABLE public.provider_venues 
    DROP CONSTRAINT IF EXISTS provider_venues_provider_id_fkey,
    ADD CONSTRAINT provider_venues_provider_id_fkey 
    FOREIGN KEY (provider_id) REFERENCES public.providers(id) ON DELETE CASCADE;

-- Same for catering if it exists
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'provider_catering') THEN
        ALTER TABLE public.provider_catering 
            DROP CONSTRAINT IF EXISTS provider_catering_provider_id_fkey,
            ADD CONSTRAINT provider_catering_provider_id_fkey 
            FOREIGN KEY (provider_id) REFERENCES public.providers(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. Fix providers INSERT policy (Review 403)
-- Already added in 20260228154500, but let's ensure it's correct
DROP POLICY IF EXISTS "Users can insert own provider profile" ON public.providers;
CREATE POLICY "Users can insert own provider profile" ON public.providers
    FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = user_id);

-- Also allow update
DROP POLICY IF EXISTS "Users can update own data" ON public.providers;
CREATE POLICY "Users can update own data" ON public.providers
    FOR UPDATE USING (auth.uid() = user_id);

-- 5. Fix service_categories (Review 400 on slug)
-- Ensure 'slug' is searchable and public
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read service categories" ON public.service_categories;
CREATE POLICY "Public read service categories" ON public.service_categories FOR SELECT USING (true);

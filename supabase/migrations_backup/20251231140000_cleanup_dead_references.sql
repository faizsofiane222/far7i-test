-- Migration: Cleanup Dead Functions and References (Score System)
-- This migration removes all orphan references to the deleted score system.

-- 1. Drop trigger on providers that calls the missing function
DROP TRIGGER IF EXISTS trg_provider_score_sync ON public.providers;
DROP TRIGGER IF EXISTS trg_update_profile_completion_score ON public.providers;

-- 2. Drop the generated column or old column if it somehow persists (Safety)
ALTER TABLE public.providers DROP COLUMN IF EXISTS profile_completion_score;

-- 3. Drop known policy that references the score
DROP POLICY IF EXISTS "Providers can see their own score" ON public.providers;

-- 4. Clean up broken policies via loop (Safe Mode)
DO $$
DECLARE
    pol_name text;
BEGIN
    FOR pol_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'providers' 
        AND policyname ILIKE '%score%'
    LOOP
        RAISE NOTICE 'Dropping stale policy: %', pol_name;
        EXECUTE 'DROP POLICY "' || pol_name || '" ON public.providers';
    END LOOP;
END $$;

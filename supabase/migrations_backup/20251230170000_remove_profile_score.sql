-- Migration: Remove Profile Completion Score
-- Status: Obsolete as all fields are now mandatory

-- 1. Drop the column from providers table
ALTER TABLE public.providers DROP COLUMN IF EXISTS profile_completion_score;

-- 2. Drop any functions/triggers if they exist (clean up legacy remains)
DROP FUNCTION IF EXISTS public.calculate_profile_completion_score(UUID) CASCADE;
DROP TRIGGER IF EXISTS trg_update_profile_completion_score ON public.providers;

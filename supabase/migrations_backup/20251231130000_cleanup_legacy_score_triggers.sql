-- Migration: Robust Cleanup of Profile Score System
-- Ensures all legacy triggers and functions related to profile score are removed definitively

-- 1. Drop known triggers associated with score maintenance
DROP TRIGGER IF EXISTS trg_provider_score_sync ON public.providers;
DROP TRIGGER IF EXISTS trg_update_profile_completion_score ON public.providers;

-- 2. Drop the trigger functions (Cascade to be sure)
DROP FUNCTION IF EXISTS public.trg_fn_sync_provider_score() CASCADE;
DROP FUNCTION IF EXISTS public.fn_compute_score_from_data(TEXT, TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, INTEGER, BOOLEAN, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.fn_calculate_completion_score(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.calculate_profile_completion_score(UUID) CASCADE;

-- 3. Just in case, ensure the column is really gone
ALTER TABLE public.providers DROP COLUMN IF EXISTS profile_completion_score;

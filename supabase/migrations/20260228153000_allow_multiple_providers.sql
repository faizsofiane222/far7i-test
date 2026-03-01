-- Migration to allow multiple providers (services) per user
-- 1. Remove the unique constraint on user_id in the providers table
ALTER TABLE public.providers DROP CONSTRAINT IF EXISTS providers_user_id_key;

-- 2. Ensure indices exist for performance
CREATE INDEX IF NOT EXISTS idx_providers_user_id ON public.providers(user_id);

-- Optional: If there was a unique index instead of a constraint
DROP INDEX IF EXISTS providers_user_id_idx;

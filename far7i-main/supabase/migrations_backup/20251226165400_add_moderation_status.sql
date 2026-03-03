-- Migration: Add moderation_status to providers (missing in early migrations)
ALTER TABLE public.providers
ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'pending';

-- Copy over from legacy status if applicable
UPDATE public.providers SET moderation_status = status WHERE moderation_status = 'pending';

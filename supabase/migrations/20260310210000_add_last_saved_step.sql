-- Add last_saved_step to providers to remember the last step of the draft
ALTER TABLE public.providers 
ADD COLUMN IF NOT EXISTS last_saved_step INTEGER DEFAULT 1;

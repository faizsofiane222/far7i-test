-- Make user_id nullable to support Shadow/Guest Profiles
alter table providers alter column user_id drop not null;

-- Ensure RLS policies handle null user_id correctly
-- Existing "Admins can do everything" policies likely use "FOR ALL" which covers everything.
-- "Users can update own" uses "auth.uid() = user_id", which naturally returns false for NULL user_id, protecting them from public edit.

-- Add a partial index for performance on unclaimed profiles if needed, or just standard index
create index if not exists idx_providers_user_id on providers(user_id);
create index if not exists idx_providers_unclaimed on providers(id) where user_id is null;

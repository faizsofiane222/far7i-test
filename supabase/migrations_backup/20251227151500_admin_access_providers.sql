-- Allow Admins to View and Manage ALL Providers (including Shadow Profiles with user_id = null)

-- Drop existing admin policy if it exists (to prevent conflicts, though previous grep was inconclusive)
drop policy if exists "Admins can manage all providers" on public.providers;

-- Create comprehensive Admin policy
create policy "Admins can manage all providers"
  on public.providers
  for all
  using (
    public.has_role(auth.uid(), 'admin')
  )
  with check (
    public.has_role(auth.uid(), 'admin')
  );

-- Ensure RLS is enabled
alter table public.providers enable row level security;

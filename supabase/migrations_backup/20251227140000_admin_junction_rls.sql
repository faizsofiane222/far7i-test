-- Allow Admins to manage all junction tables regardless of user_id
-- This resolves RLS violations when an Admin edits another user's provider profile

-- 1. Policies for provider_services
create policy "Admins can do everything on provider_services"
  on provider_services
  for all
  using (
    public.has_role(auth.uid(), 'admin')
  )
  with check (
    public.has_role(auth.uid(), 'admin')
  );

-- 2. Policies for provider_events
create policy "Admins can do everything on provider_events"
  on provider_events
  for all
  using (
    public.has_role(auth.uid(), 'admin')
  )
  with check (
    public.has_role(auth.uid(), 'admin')
  );

-- 3. Policies for provider_travel_zones
create policy "Admins can do everything on provider_travel_zones"
  on provider_travel_zones
  for all
  using (
    public.has_role(auth.uid(), 'admin')
  )
  with check (
    public.has_role(auth.uid(), 'admin')
  );

-- Ensure RLS is enabled (just to be safe, though likely already on)
alter table provider_services enable row level security;
alter table provider_events enable row level security;
alter table provider_travel_zones enable row level security;

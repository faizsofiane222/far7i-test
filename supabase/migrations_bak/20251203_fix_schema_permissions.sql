-- Grant necessary permissions to anon and authenticated roles
-- This fixes the "permission denied for schema public" error

-- Grant USAGE on the public schema to anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant SELECT on all existing tables to anon (for public data)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant SELECT on all existing tables to authenticated users
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant INSERT on client_waitlist and provider_waitlist to anon (for signups)
GRANT INSERT ON TABLE public.client_waitlist TO anon;
GRANT INSERT ON TABLE public.provider_waitlist TO anon;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO authenticated;

-- Note: RLS policies will still control what data users can actually access
-- These grants only allow the roles to attempt operations, RLS provides fine-grained control

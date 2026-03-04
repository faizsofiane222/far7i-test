-- Grant necessary permissions to anon and authenticated roles for provider_waitlist
-- This ensures the provider registration form works correctly

-- Ensure USAGE on schema (should already exist from previous migration)
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Explicitly grant INSERT on provider_waitlist to anon
GRANT INSERT ON TABLE public.provider_waitlist TO anon, authenticated;

-- Grant SELECT on provider_waitlist for reading data
GRANT SELECT ON TABLE public.provider_waitlist TO anon, authenticated;

-- Ensure all sequences are accessible
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

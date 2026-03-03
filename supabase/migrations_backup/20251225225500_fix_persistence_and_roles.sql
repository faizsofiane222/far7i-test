-- Migration V1.6 - Fix Profile Persistence & RLS
-- This migration ensures that partners can save their profile and expertise data correctly.

-- 1. Permissive Insert for Providers
-- Allow any authenticated user to create their first profile record.
DROP POLICY IF EXISTS "Providers can create their profile" ON public.providers;
CREATE POLICY "Providers can create their profile"
    ON public.providers FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- 2. RLS for Junction Tables
-- ============================================

-- Provider Services
ALTER TABLE public.provider_services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Providers can manage their own services" ON public.provider_services;
CREATE POLICY "Providers can manage their own services"
    ON public.provider_services FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.providers 
        WHERE id = provider_id AND user_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.providers 
        WHERE id = provider_id AND user_id = auth.uid()
    ));

-- Provider Events
ALTER TABLE public.provider_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Providers can manage their own events" ON public.provider_events;
CREATE POLICY "Providers can manage their own events"
    ON public.provider_events FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.providers 
        WHERE id = provider_id AND user_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.providers 
        WHERE id = provider_id AND user_id = auth.uid()
    ));

-- Provider Travel Zones
ALTER TABLE public.provider_travel_zones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Providers can manage their own travel zones" ON public.provider_travel_zones;
CREATE POLICY "Providers can manage their own travel zones"
    ON public.provider_travel_zones FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.providers 
        WHERE id = provider_id AND user_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.providers 
        WHERE id = provider_id AND user_id = auth.uid()
    ));

-- 3. Auto-Role Upgrade Trigger
-- When a profile is created in public.providers, ensure the user has the 'provider' role.
CREATE OR REPLACE FUNCTION public.handle_provider_upgrade()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert 'provider' role if it doesn't exist
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, 'provider')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_provider_upgrade ON public.providers;
CREATE TRIGGER trg_provider_upgrade
AFTER INSERT ON public.providers
FOR EACH ROW
EXECUTE FUNCTION public.handle_provider_upgrade();

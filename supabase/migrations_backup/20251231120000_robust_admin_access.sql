-- Migration V10: COMPREHENSIVE ADMIN SYNC FIX
-- This ensures Admins can see ALL data across services and provider profiles.

-- 1. Standardize Public is_admin()
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Service Relations
-- ==========================================
-- Services
DROP POLICY IF EXISTS "Admins can view all services" ON public.services;
CREATE POLICY "Admins can view all services" ON public.services FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "Admins can manage all services" ON public.services;
CREATE POLICY "Admins can manage all services" ON public.services FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Service Media (Public & Admin)
DROP POLICY IF EXISTS "Anyone can view active service media" ON public.service_media;
CREATE POLICY "Anyone can view active service media" ON public.service_media FOR SELECT USING (EXISTS (SELECT 1 FROM public.services s WHERE s.id = service_id AND s.is_active = true));
DROP POLICY IF EXISTS "Admins can manage all service media" ON public.service_media;
CREATE POLICY "Admins can manage all service media" ON public.service_media FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Service Inclusions
DROP POLICY IF EXISTS "Admins can manage all service inclusions" ON public.service_inclusions;
CREATE POLICY "Admins can manage all service inclusions" ON public.service_inclusions FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Service Options
DROP POLICY IF EXISTS "Admins can manage all service options" ON public.service_options;
CREATE POLICY "Admins can manage all service options" ON public.service_options FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Service FAQs
DROP POLICY IF EXISTS "Admins can manage all service faqs" ON public.service_faqs;
CREATE POLICY "Admins can manage all service faqs" ON public.service_faqs FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


-- 3. Provider Junction Tables (Categories, Events, Zones)
-- ==========================================
DROP POLICY IF EXISTS "Admins can do everything on provider_services" ON provider_services;
CREATE POLICY "Admins can manage all provider_services" ON provider_services FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can do everything on provider_events" ON provider_events;
CREATE POLICY "Admins can manage all provider_events" ON provider_events FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can do everything on provider_travel_zones" ON provider_travel_zones;
CREATE POLICY "Admins can manage all provider_travel_zones" ON provider_travel_zones FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================
-- FIX SCORE LOGIC & SETUP STORAGE
-- ============================================

-- 1. STORAGE BUCKET SETUP
-- ============================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('provider-profiles', 'provider-profiles', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for Storage
CREATE POLICY "Public Access for profiles" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'provider-profiles');

CREATE POLICY "Provider Upload Access" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'provider-profiles' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Provider Delete Access" 
ON storage.objects FOR DELETE 
USING (
    bucket_id = 'provider-profiles' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. REFINED SCORE CALCULATION FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.fn_calculate_completion_score(p_id UUID)
RETURNS INTEGER AS $$
DECLARE
    score INTEGER := 0;
    p_row RECORD;
    has_services BOOLEAN;
BEGIN
    -- Get provider data
    SELECT profile_picture_url, commercial_name, bio, phone_number, wilaya_id, main_social_link 
    INTO p_row 
    FROM public.providers 
    WHERE id = p_id;

    IF NOT FOUND THEN RETURN 0; END IF;

    -- 1. Avatar (+20%)
    IF p_row.profile_picture_url IS NOT NULL AND p_row.profile_picture_url != '' THEN
        score := score + 20;
    END IF;

    -- 2. Commercial Name (+10%)
    IF p_row.commercial_name IS NOT NULL AND p_row.commercial_name != '' THEN
        score := score + 10;
    END IF;

    -- 3. Bio (+20%)
    IF p_row.bio IS NOT NULL AND length(p_row.bio) >= 10 THEN
        score := score + 20;
    END IF;

    -- 4. Phone (+15%)
    IF p_row.phone_number IS NOT NULL AND p_row.phone_number != '' THEN
        score := score + 15;
    END IF;

    -- 5. Services selected (+15%)
    SELECT EXISTS (SELECT 1 FROM public.provider_services WHERE provider_id = p_id) INTO has_services;
    IF has_services THEN
        score := score + 15;
    END IF;

    -- 6. Location Set (+10%)
    IF p_row.wilaya_id IS NOT NULL THEN
        score := score + 10;
    END IF;

    -- 7. Social Link (+10%)
    IF p_row.main_social_link IS NOT NULL AND p_row.main_social_link != '' THEN
        score := score + 10;
    END IF;

    RETURN score;
END;
$$ LANGUAGE plpgsql;

-- 3. TRIGGERS
-- ============================================

-- A. Trigger for providers table (BEFORE)
CREATE OR REPLACE FUNCTION public.trg_fn_sync_provider_score()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate score using the central function
    -- Note: When called BEFORE update on providers, it will use the NEW values
    -- EXCEPT for junction table checks which query the DB (might be slightly stale if in the same transaction, but for Providers table it's fine)
    NEW.profile_completion_score := public.fn_calculate_completion_score(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_provider_score_sync ON public.providers;
CREATE TRIGGER trg_provider_score_sync
BEFORE INSERT OR UPDATE OF profile_picture_url, commercial_name, bio, phone_number, wilaya_id, main_social_link
ON public.providers
FOR EACH ROW
EXECUTE FUNCTION public.trg_fn_sync_provider_score();

-- B. Trigger for junction tables (AFTER)
CREATE OR REPLACE FUNCTION public.trg_fn_junction_score_sync()
RETURNS TRIGGER AS $$
DECLARE
    target_provider_id UUID;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_provider_id := OLD.provider_id;
    ELSE
        target_provider_id := NEW.provider_id;
    END IF;

    UPDATE public.providers 
    SET profile_completion_score = public.fn_calculate_completion_score(target_provider_id)
    WHERE id = target_provider_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Services
DROP TRIGGER IF EXISTS trg_score_sync_services ON public.provider_services;
CREATE TRIGGER trg_score_sync_services
AFTER INSERT OR DELETE OR UPDATE ON public.provider_services
FOR EACH ROW EXECUTE FUNCTION public.trg_fn_junction_score_sync();

-- Events
DROP TRIGGER IF EXISTS trg_score_sync_events ON public.provider_events;
CREATE TRIGGER trg_score_sync_events
AFTER INSERT OR DELETE OR UPDATE ON public.provider_events
FOR EACH ROW EXECUTE FUNCTION public.trg_fn_junction_score_sync();

-- Travel Zones
DROP TRIGGER IF EXISTS trg_score_sync_travel ON public.provider_travel_zones;
CREATE TRIGGER trg_score_sync_travel
AFTER INSERT OR DELETE OR UPDATE ON public.provider_travel_zones
FOR EACH ROW EXECUTE FUNCTION public.trg_fn_junction_score_sync();

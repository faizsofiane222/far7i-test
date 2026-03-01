-- ============================================
-- PROVIDER PROFILE V1.1 MIGRATION
-- ============================================

-- 1. ADD COMPLETION SCORE COLUMN
-- ============================================
ALTER TABLE public.providers 
ADD COLUMN IF NOT EXISTS profile_completion_score INTEGER DEFAULT 0;

-- 2. TRAVEL ZONES TABLE (MOBILITY)
-- ============================================
CREATE TABLE IF NOT EXISTS public.provider_travel_zones (
    provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE,
    wilaya_id UUID REFERENCES public.wilayas(id) ON DELETE CASCADE,
    PRIMARY KEY (provider_id, wilaya_id)
);

-- 3. COMPLETION SCORE LOGIC
-- ============================================

CREATE OR REPLACE FUNCTION public.calculate_profile_score()
RETURNS TRIGGER AS $$
DECLARE
    score INTEGER := 0;
    p_id UUID;
    p_row RECORD;
    has_services BOOLEAN;
    has_location BOOLEAN;
BEGIN
    -- Determine the provider ID based on the triggering table
    IF TG_TABLE_NAME = 'providers' THEN
        p_id := NEW.id;
    ELSE
        p_id := NEW.provider_id;
    END IF;

    -- Get the provider row
    SELECT * INTO p_row FROM public.providers WHERE id = p_id;
    
    -- Scoring Logic
    -- 1. Avatar (+20%)
    IF p_row.profile_picture_url IS NOT NULL AND p_row.profile_picture_url != '' THEN
        score := score + 20;
    END IF;

    -- 2. Commercial Name (+10%)
    IF p_row.commercial_name IS NOT NULL AND p_row.commercial_name != '' THEN
        score := score + 10;
    END IF;

    -- 3. Bio (+20%)
    IF p_row.bio IS NOT NULL AND p_row.bio != '' AND length(p_row.bio) > 10 THEN
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

    -- Update the score in the providers table
    UPDATE public.providers SET profile_completion_score = score WHERE id = p_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. TRIGGERS
-- ============================================

-- Trigger on providers update
DROP TRIGGER IF EXISTS trg_update_profile_score ON public.providers;
CREATE TRIGGER trg_update_profile_score
AFTER INSERT OR UPDATE OF commercial_name, bio, profile_picture_url, phone_number, wilaya_id, main_social_link
ON public.providers
FOR EACH ROW
EXECUTE FUNCTION public.calculate_profile_score();

-- Trigger on expertise changes
DROP TRIGGER IF EXISTS trg_update_score_on_services ON public.provider_services;
CREATE TRIGGER trg_update_score_on_services
AFTER INSERT OR DELETE ON public.provider_services
FOR EACH ROW
EXECUTE FUNCTION public.calculate_profile_score();

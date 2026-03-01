-- Migration to refine profile score logic and enforce mandatory fields
-- V1.3 - Weight adjustment and bio validation

-- 1. Adjust providers table schema for mandatory fields
-- First, make old redundant fields nullable to avoid lint/insert errors
ALTER TABLE public.providers 
ALTER COLUMN category DROP NOT NULL,
ALTER COLUMN wilaya DROP NOT NULL,
ALTER COLUMN contact_email DROP NOT NULL;

-- Now make mandatory fields NOT NULL (Careful: this might fail if existing data is null)
-- We'll use COALESCE or defaults if necessary, but in a local dev reset it's fine.
UPDATE public.providers SET commercial_name = 'Non renseigné' WHERE commercial_name IS NULL;
UPDATE public.providers SET bio = '' WHERE bio IS NULL;
UPDATE public.providers SET phone_number = '' WHERE phone_number IS NULL;

ALTER TABLE public.providers 
ALTER COLUMN commercial_name SET NOT NULL,
ALTER COLUMN bio SET NOT NULL,
ALTER COLUMN phone_number SET NOT NULL;

-- Note: wilaya_id is left nullable for DB flexibility during initial signup, 
-- but will be required for "Published" status in UI/Score.

-- 2. Update the refined score calculation function
CREATE OR REPLACE FUNCTION public.fn_calculate_completion_score(p_id UUID)
RETURNS INTEGER AS $$
DECLARE
    score INTEGER := 0;
    p_row RECORD;
    has_services BOOLEAN;
    has_events BOOLEAN;
    travel_zones_count INTEGER;
BEGIN
    -- Get provider data
    SELECT 
        profile_picture_url, 
        commercial_name, 
        bio, 
        phone_number, 
        wilaya_id, 
        main_social_link,
        website_link,
        provider_type,
        years_of_experience,
        willingness_to_travel
    INTO p_row 
    FROM public.providers 
    WHERE id = p_id;

    IF NOT FOUND THEN RETURN 0; END IF;

    -- === MANDATORY FIELDS (Total 35%) ===

    -- 1. Commercial Name (+5%)
    IF p_row.commercial_name IS NOT NULL AND p_row.commercial_name != '' AND p_row.commercial_name != 'Non renseigné' THEN
        score := score + 5;
    END IF;

    -- 2. Bio >= 200 chars (+10%)
    IF p_row.bio IS NOT NULL AND length(p_row.bio) >= 200 THEN
        score := score + 10;
    END IF;

    -- 3. Phone (+5%)
    IF p_row.phone_number IS NOT NULL AND p_row.phone_number != '' THEN
        score := score + 5;
    END IF;

    -- 4. Wilaya ID (+5%)
    IF p_row.wilaya_id IS NOT NULL THEN
        score := score + 5;
    END IF;

    -- 5. Services selected (+5%)
    SELECT EXISTS (SELECT 1 FROM public.provider_services WHERE provider_id = p_id) INTO has_services;
    IF has_services THEN
        score := score + 5;
    END IF;

    -- 6. Events types selected (+5%)
    SELECT EXISTS (SELECT 1 FROM public.provider_events WHERE provider_id = p_id) INTO has_events;
    IF has_events THEN
        score := score + 5;
    END IF;


    -- === OPTIONAL / PREMIUM FIELDS (Total 65%) ===

    -- 7. Avatar (+20%) - High weight as requested for optional premium feel
    IF p_row.profile_picture_url IS NOT NULL AND p_row.profile_picture_url != '' THEN
        score := score + 20;
    END IF;

    -- 8. Social Link (+10%)
    IF p_row.main_social_link IS NOT NULL AND p_row.main_social_link != '' THEN
        score := score + 10;
    END IF;

    -- 9. Website Link (+10%)
    IF p_row.website_link IS NOT NULL AND p_row.website_link != '' THEN
        score := score + 10;
    END IF;

    -- 10. Provider Type (+10%)
    IF p_row.provider_type IS NOT NULL AND p_row.provider_type != '' THEN
        score := score + 10;
    END IF;

    -- 11. Experience (+5%)
    IF p_row.years_of_experience IS NOT NULL AND p_row.years_of_experience > 0 THEN
        score := score + 5;
    END IF;

    -- 12. Travel Zones (+10%)
    IF p_row.willingness_to_travel = true THEN
        SELECT count(*) INTO travel_zones_count FROM public.provider_travel_zones WHERE provider_id = p_id;
        IF travel_zones_count > 0 THEN
            score := score + 10;
        END IF;
    END IF;

    RETURN score;
END;
$$ LANGUAGE plpgsql;

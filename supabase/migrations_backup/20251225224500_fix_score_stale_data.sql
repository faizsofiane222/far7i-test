-- Migration V1.4 - Fix Score Calculation Stale Data Issue
-- The previous implementation used a BEFORE trigger that called a function
-- which performed a SELECT on the row being updated, leading to stale data.

-- 1. Create a core calculation function that takes all values as arguments
CREATE OR REPLACE FUNCTION public.fn_compute_score_from_data(
    p_profile_picture_url TEXT,
    p_commercial_name TEXT,
    p_bio TEXT,
    p_phone_number TEXT,
    p_wilaya_id UUID,
    p_main_social_link TEXT,
    p_website_link TEXT,
    p_provider_type TEXT,
    p_years_of_experience INTEGER,
    p_willingness_to_travel BOOLEAN,
    p_provider_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    score INTEGER := 0;
    has_services BOOLEAN;
    has_events BOOLEAN;
    travel_zones_count INTEGER;
BEGIN
    -- === MANDATORY FIELDS (Total 35%) ===

    -- 1. Commercial Name (+5%)
    IF p_commercial_name IS NOT NULL AND p_commercial_name != '' AND p_commercial_name != 'Non renseigné' THEN
        score := score + 5;
    END IF;

    -- 2. Bio >= 200 chars (+10%)
    IF p_bio IS NOT NULL AND length(p_bio) >= 200 THEN
        score := score + 10;
    END IF;

    -- 3. Phone (+5%)
    IF p_phone_number IS NOT NULL AND p_phone_number != '' THEN
        score := score + 5;
    END IF;

    -- 4. Wilaya ID (+5%)
    IF p_wilaya_id IS NOT NULL THEN
        score := score + 5;
    END IF;

    -- 5. Services selected (+5%)
    SELECT EXISTS (SELECT 1 FROM public.provider_services WHERE provider_id = p_provider_id) INTO has_services;
    IF has_services THEN
        score := score + 5;
    END IF;

    -- 6. Events types selected (+5%)
    SELECT EXISTS (SELECT 1 FROM public.provider_events WHERE provider_id = p_provider_id) INTO has_events;
    IF has_events THEN
        score := score + 5;
    END IF;


    -- === OPTIONAL / PREMIUM FIELDS (Total 65%) ===

    -- 7. Avatar (+20%)
    IF p_profile_picture_url IS NOT NULL AND p_profile_picture_url != '' THEN
        score := score + 20;
    END IF;

    -- 8. Social Link (+10%)
    IF p_main_social_link IS NOT NULL AND p_main_social_link != '' THEN
        score := score + 10;
    END IF;

    -- 9. Website Link (+10%)
    IF p_website_link IS NOT NULL AND p_website_link != '' THEN
        score := score + 10;
    END IF;

    -- 10. Provider Type (+10%)
    IF p_provider_type IS NOT NULL AND p_provider_type != '' THEN
        score := score + 10;
    END IF;

    -- 11. Experience (+5%)
    IF p_years_of_experience IS NOT NULL AND p_years_of_experience > 0 THEN
        score := score + 5;
    END IF;

    -- 12. Travel Zones (+10%)
    IF p_willingness_to_travel = true THEN
        SELECT count(*) INTO travel_zones_count FROM public.provider_travel_zones WHERE provider_id = p_provider_id;
        IF travel_zones_count > 0 THEN
            score := score + 10;
        END IF;
    END IF;

    RETURN score;
END;
$$ LANGUAGE plpgsql;

-- 2. Update the wrapper function to use the core calculator
CREATE OR REPLACE FUNCTION public.fn_calculate_completion_score(p_id UUID)
RETURNS INTEGER AS $$
DECLARE
    p_row RECORD;
BEGIN
    SELECT * INTO p_row FROM public.providers WHERE id = p_id;
    IF NOT FOUND THEN RETURN 0; END IF;

    RETURN public.fn_compute_score_from_data(
        p_row.profile_picture_url,
        p_row.commercial_name,
        p_row.bio,
        p_row.phone_number,
        p_row.wilaya_id,
        p_row.main_social_link,
        p_row.website_link,
        p_row.provider_type,
        p_row.years_of_experience,
        p_row.willingness_to_travel,
        p_id
    );
END;
$$ LANGUAGE plpgsql;

-- 3. Update the provider trigger to use NEW values directly
CREATE OR REPLACE FUNCTION public.trg_fn_sync_provider_score()
RETURNS TRIGGER AS $$
BEGIN
    NEW.profile_completion_score := public.fn_compute_score_from_data(
        NEW.profile_picture_url,
        NEW.commercial_name,
        NEW.bio,
        NEW.phone_number,
        NEW.wilaya_id,
        NEW.main_social_link,
        NEW.website_link,
        NEW.provider_type,
        NEW.years_of_experience,
        NEW.willingness_to_travel,
        NEW.id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Ensure the trigger watches ALL relevant columns
DROP TRIGGER IF EXISTS trg_provider_score_sync ON public.providers;
CREATE TRIGGER trg_provider_score_sync
BEFORE INSERT OR UPDATE OF 
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
ON public.providers
FOR EACH ROW
EXECUTE FUNCTION public.trg_fn_sync_provider_score();

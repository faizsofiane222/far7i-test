-- Migration to add provider_type and years_of_experience to providers table
-- and update the score calculation function accordingly.

-- 1. Add columns to providers table
ALTER TABLE public.providers 
ADD COLUMN IF NOT EXISTS provider_type TEXT, -- 'agency' or 'individual'
ADD COLUMN IF NOT EXISTS years_of_experience INTEGER DEFAULT 0;

-- 2. Update the refined score calculation function
CREATE OR REPLACE FUNCTION public.fn_calculate_completion_score(p_id UUID)
RETURNS INTEGER AS $$
DECLARE
    score INTEGER := 0;
    p_row RECORD;
    has_services BOOLEAN;
BEGIN
    -- Get provider data
    SELECT 
        profile_picture_url, 
        commercial_name, 
        bio, 
        phone_number, 
        wilaya_id, 
        main_social_link,
        provider_type,
        years_of_experience
    INTO p_row 
    FROM public.providers 
    WHERE id = p_id;

    IF NOT FOUND THEN RETURN 0; END IF;

    -- 1. Avatar (+15%) - Adjusted from 20% to accommodate new fields
    IF p_row.profile_picture_url IS NOT NULL AND p_row.profile_picture_url != '' THEN
        score := score + 15;
    END IF;

    -- 2. Commercial Name (+10%)
    IF p_row.commercial_name IS NOT NULL AND p_row.commercial_name != '' THEN
        score := score + 10;
    END IF;

    -- 3. Bio (+15%) - Adjusted from 20%
    IF p_row.bio IS NOT NULL AND length(p_row.bio) >= 10 THEN
        score := score + 15;
    END IF;

    -- 4. Phone (+10%) - Adjusted from 15%
    IF p_row.phone_number IS NOT NULL AND p_row.phone_number != '' THEN
        score := score + 10;
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

    -- 8. Provider Type (+10%) - NEW
    IF p_row.provider_type IS NOT NULL AND p_row.provider_type != '' THEN
        score := score + 10;
    END IF;

    -- 9. Experience (+5%) - NEW
    IF p_row.years_of_experience IS NOT NULL AND p_row.years_of_experience > 0 THEN
        score := score + 5;
    END IF;

    RETURN score;
END;
$$ LANGUAGE plpgsql;

-- 3. Update existing triggers if necessary (already watching specific columns on Providers)
-- The existing trigger trg_provider_score_sync on public.providers should be updated to watch the new columns.

DROP TRIGGER IF EXISTS trg_provider_score_sync ON public.providers;
CREATE TRIGGER trg_provider_score_sync
BEFORE INSERT OR UPDATE OF 
    profile_picture_url, 
    commercial_name, 
    bio, 
    phone_number, 
    wilaya_id, 
    main_social_link,
    provider_type,
    years_of_experience
ON public.providers
FOR EACH ROW
EXECUTE FUNCTION public.trg_fn_sync_provider_score();

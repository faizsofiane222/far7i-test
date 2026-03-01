-- Migration V1.5 - Equal Weights for Profile Score
-- Simplified model: 10 fields, each worth 10%

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
BEGIN
    -- 1. Mode de travail (Type) (+10%)
    IF p_provider_type IS NOT NULL AND p_provider_type != '' THEN
        score := score + 10;
    END IF;

    -- 2. Photo de profil (+10%)
    IF p_profile_picture_url IS NOT NULL AND p_profile_picture_url != '' THEN
        score := score + 10;
    END IF;

    -- 3. Nom Commercial (+10%)
    IF p_commercial_name IS NOT NULL AND p_commercial_name != '' AND p_commercial_name != 'Non renseigné' THEN
        score := score + 10;
    END IF;

    -- 4. Expérience (+10%)
    IF p_years_of_experience IS NOT NULL AND p_years_of_experience > 0 THEN
        score := score + 10;
    END IF;

    -- 5. Téléphone (+10%)
    IF p_phone_number IS NOT NULL AND p_phone_number != '' THEN
        score := score + 10;
    END IF;

    -- 6. Bio >= 200 chars (+10%)
    IF p_bio IS NOT NULL AND length(p_bio) >= 200 THEN
        score := score + 10;
    END IF;

    -- 7. Lien social / Site (+10%)
    IF (p_main_social_link IS NOT NULL AND p_main_social_link != '') OR (p_website_link IS NOT NULL AND p_website_link != '') THEN
        score := score + 10;
    END IF;

    -- 8. Domaines d'expertises (+10%)
    SELECT EXISTS (SELECT 1 FROM public.provider_services WHERE provider_id = p_provider_id) INTO has_services;
    IF has_services THEN
        score := score + 10;
    END IF;

    -- 9. Types d'événements (+10%)
    SELECT EXISTS (SELECT 1 FROM public.provider_events WHERE provider_id = p_provider_id) INTO has_events;
    IF has_events THEN
        score := score + 10;
    END IF;

    -- 10. Localisation (Wilaya) (+10%)
    IF p_wilaya_id IS NOT NULL THEN
        score := score + 10;
    END IF;

    RETURN score;
END;
$$ LANGUAGE plpgsql;

-- Wrapper and Triggers remain the same as V1.4, they will call the updated fn_compute_score_from_data

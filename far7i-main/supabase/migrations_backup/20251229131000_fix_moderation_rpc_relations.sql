-- Update approve_service_changes to handle relations
CREATE OR REPLACE FUNCTION public.approve_service_changes(target_service_id UUID)
RETURNS VOID AS $$
DECLARE
    pending_data JSONB;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    SELECT pending_changes INTO pending_data 
    FROM public.services 
    WHERE id = target_service_id;

    IF pending_data IS NULL THEN
        RAISE EXCEPTION 'No pending changes found';
    END IF;

    -- 1. Apply Main Columns
    UPDATE public.services
    SET
        title = COALESCE((pending_data->>'title'), title),
        description = COALESCE((pending_data->>'description'), description),
        base_price = COALESCE((pending_data->>'base_price')::DECIMAL, base_price),
        price_unit = COALESCE((pending_data->>'price_unit')::public.service_price_unit, price_unit),
        short_pitch = COALESCE((pending_data->>'short_pitch'), short_pitch),
        is_active = COALESCE((pending_data->>'is_active')::BOOLEAN, is_active),
        service_category_id = COALESCE((pending_data->>'service_category_id')::UUID, service_category_id),
        
        moderation_status = 'approved',
        pending_changes = NULL,
        updated_at = NOW()
    WHERE id = target_service_id;

    -- 2. Sync Media if present in JSON
    IF pending_data ? 'media' THEN
        DELETE FROM public.service_media WHERE service_id = target_service_id;
        INSERT INTO public.service_media (service_id, file_url, sort_order)
        SELECT 
            target_service_id, 
            elem.value#>>'{}' as file_url, -- Extract value from array of strings
            (elem.ordinality - 1) as sort_order
        FROM jsonb_array_elements(pending_data->'media') WITH ORDINALITY AS elem;
    END IF;

    -- 3. Sync Inclusions
    IF pending_data ? 'inclusions' THEN
        DELETE FROM public.service_inclusions WHERE service_id = target_service_id;
        INSERT INTO public.service_inclusions (service_id, item_text, inclusion_type)
        SELECT 
            target_service_id, 
            elem->>'item_text', 
            COALESCE((elem->>'inclusion_type')::inclusion_type, 'included'::inclusion_type)
        FROM jsonb_array_elements(pending_data->'inclusions') AS elem;
    END IF;

    -- 4. Sync Options
    IF pending_data ? 'options' THEN
        DELETE FROM public.service_options WHERE service_id = target_service_id;
        INSERT INTO public.service_options (service_id, title, description, price)
        SELECT 
            target_service_id, 
            elem->>'title', 
            elem->>'description',
            (elem->>'price')::DECIMAL
        FROM jsonb_array_elements(pending_data->'options') AS elem;
    END IF;

    -- 5. Sync FAQs
    IF pending_data ? 'faqs' THEN
        DELETE FROM public.service_faqs WHERE service_id = target_service_id;
        INSERT INTO public.service_faqs (service_id, question, answer, sort_order)
        SELECT 
            target_service_id, 
            elem->>'question', 
            elem->>'answer',
            (elem.ordinality - 1) as sort_order
        FROM jsonb_array_elements(pending_data->'faqs') WITH ORDINALITY AS elem;
    END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Update approve_provider_changes to handle portfolio_images
CREATE OR REPLACE FUNCTION public.approve_provider_changes(target_provider_id UUID)
RETURNS VOID AS $$
DECLARE
    pending_data JSONB;
BEGIN
    -- Check Admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Get pending changes
    SELECT pending_changes INTO pending_data 
    FROM public.providers 
    WHERE id = target_provider_id;

    IF pending_data IS NULL THEN
        RAISE EXCEPTION 'No pending changes found';
    END IF;

    -- Apply changes
    UPDATE public.providers
    SET
        commercial_name = COALESCE((pending_data->>'commercial_name'), commercial_name),
        bio = COALESCE((pending_data->>'bio'), bio),
        profile_picture_url = COALESCE((pending_data->>'profile_picture_url'), profile_picture_url),
        phone_number = COALESCE((pending_data->>'phone_number'), phone_number),
        wilaya_id = COALESCE((pending_data->>'wilaya_id')::UUID, wilaya_id),
        commune_id = COALESCE((pending_data->>'commune_id')::UUID, commune_id),
        main_social_link = COALESCE((pending_data->>'main_social_link'), main_social_link),
        website_link = COALESCE((pending_data->>'website_link'), website_link),
        willingness_to_travel = COALESCE((pending_data->>'willingness_to_travel')::BOOLEAN, willingness_to_travel),
        is_whatsapp_active = COALESCE((pending_data->>'is_whatsapp_active')::BOOLEAN, is_whatsapp_active),
        
        -- Add portfolio_images sync
        portfolio_images = CASE 
            WHEN pending_data ? 'portfolio_images' THEN 
                ARRAY(SELECT jsonb_array_elements_text(pending_data->'portfolio_images'))
            ELSE portfolio_images 
        END,
        
        -- Reset moderation state
        moderation_status = 'approved',
        pending_changes = NULL,
        updated_at = NOW()
    WHERE id = target_provider_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

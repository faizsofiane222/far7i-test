-- Refix approve_service_changes with correct aliases
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

    -- 2. Sync Media
    IF pending_data ? 'media' THEN
        DELETE FROM public.service_media WHERE service_id = target_service_id;
        INSERT INTO public.service_media (service_id, file_url, sort_order)
        SELECT 
            target_service_id, 
            t.val#>>'{}', 
            (t.ord - 1)
        FROM jsonb_array_elements(pending_data->'media') WITH ORDINALITY AS t(val, ord);
    END IF;

    -- 3. Sync Inclusions
    IF pending_data ? 'inclusions' THEN
        DELETE FROM public.service_inclusions WHERE service_id = target_service_id;
        INSERT INTO public.service_inclusions (service_id, item_text, inclusion_type)
        SELECT 
            target_service_id, 
            t.val->>'item_text', 
            COALESCE((t.val->>'inclusion_type')::public.inclusion_type, 'included'::public.inclusion_type)
        FROM jsonb_array_elements(pending_data->'inclusions') AS t(val);
    END IF;

    -- 4. Sync Options
    IF pending_data ? 'options' THEN
        DELETE FROM public.service_options WHERE service_id = target_service_id;
        INSERT INTO public.service_options (service_id, title, description, price)
        SELECT 
            target_service_id, 
            t.val->>'title', 
            t.val->>'description',
            (t.val->>'price')::DECIMAL
        FROM jsonb_array_elements(pending_data->'options') AS t(val);
    END IF;

    -- 5. Sync FAQs
    IF pending_data ? 'faqs' THEN
        DELETE FROM public.service_faqs WHERE service_id = target_service_id;
        INSERT INTO public.service_faqs (service_id, question, answer, sort_order)
        SELECT 
            target_service_id, 
            t.val->>'question', 
            t.val->>'answer',
            (t.ord - 1)
        FROM jsonb_array_elements(pending_data->'faqs') WITH ORDINALITY AS t(val, ord);
    END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

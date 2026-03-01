-- Migration to add moderation capabilities
-- Adds pending_changes JSONB and moderation statuses

-- 1. ADD COLUMNS
-- ==========================================

-- Providers
ALTER TABLE public.providers 
ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'approved', -- 'pending', 'approved', 'rejected'
ADD COLUMN IF NOT EXISTS pending_changes JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Services
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'approved',
ADD COLUMN IF NOT EXISTS pending_changes JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;


-- 2. RPC: APPROVE PROVIDER CHANGES
-- ==========================================
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
    -- We use COALESCE to keep existing values if keys are missing in JSON (though usually it's a full object)
    -- JSONB_POPULATE_RECORD is cleaner but risky if schema mismatches.
    -- Manual update is safer for specific allowed fields.
    
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
        
        -- Reset moderation state
        moderation_status = 'approved',
        pending_changes = NULL,
        updated_at = NOW()
    WHERE id = target_provider_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. RPC: REJECT PROVIDER CHANGES
-- ==========================================
CREATE OR REPLACE FUNCTION public.reject_provider_changes(target_provider_id UUID, reason TEXT)
RETURNS VOID AS $$
BEGIN
    -- Check Admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    UPDATE public.providers
    SET
        moderation_status = 'rejected',
        admin_notes = reason,
        -- We KEEP pending_changes so the user can see what they submitted/edit it again?
        -- Or we clear it? Standard flow: Keep it or let user re-submit.
        -- Let's keep it but mark rejected so UI shows "Changes Rejected: [Reason]"
        updated_at = NOW()
    WHERE id = target_provider_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. RPC: APPROVE SERVICE CHANGES
-- ==========================================
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

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

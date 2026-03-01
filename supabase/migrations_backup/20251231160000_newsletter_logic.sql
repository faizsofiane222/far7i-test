-- Migration: Update Newsletter RPC for ID-based filtering
-- Description: Updates the process_newsletter_campaign function to use UUIDs for category and wilaya.

CREATE OR REPLACE FUNCTION process_newsletter_campaign(campaign_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_campaign RECORD;
    v_inserted_count INT := 0;
    v_filters JSONB;
BEGIN
    -- 1. Fetch Campaign
    SELECT * INTO v_campaign FROM public.newsletter_campaigns WHERE id = campaign_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Campaign not found');
    END IF;

    -- Mark as sending if not already
    UPDATE public.newsletter_campaigns 
    SET status = 'sending' 
    WHERE id = campaign_id AND status = 'draft';

    v_filters := v_campaign.target_filters;

    -- 2. Determine Audience & Insert Recipients
    IF v_campaign.target_type = 'providers' THEN
        -- Insert Providers matching filters (using IDs)
        INSERT INTO public.newsletter_recipients (campaign_id, email, status)
        SELECT 
            campaign_id, 
            u.email, 
            'pending'
        FROM public.providers p
        JOIN auth.users u ON p.user_id = u.id
        WHERE 
            p.user_id IS NOT NULL
            AND (v_filters->>'category' = 'all' OR p.id IN (
                SELECT provider_id FROM provider_services ps 
                WHERE ps.category_id::text = v_filters->>'category' -- Cast to text for JSON comparison
            ))
            AND (v_filters->>'wilaya' = 'all' OR p.wilaya_id::text = v_filters->>'wilaya');
            
        GET DIAGNOSTICS v_inserted_count = ROW_COUNT;

    ELSIF v_campaign.target_type = 'clients' THEN
        -- Insert Clients
        INSERT INTO public.newsletter_recipients (campaign_id, email, status)
        SELECT 
            campaign_id, 
            email, 
            'pending'
        FROM auth.users
        WHERE 
            (raw_user_meta_data->>'role' = 'client' OR raw_user_meta_data->>'role' IS NULL);
            
        GET DIAGNOSTICS v_inserted_count = ROW_COUNT;

    ELSIF v_campaign.target_type = 'all' THEN
        INSERT INTO public.newsletter_recipients (campaign_id, email, status)
        SELECT 
            campaign_id, 
            email, 
            'pending'
        FROM auth.users;
        
        GET DIAGNOSTICS v_inserted_count = ROW_COUNT;
    END IF;

    -- 3. Update Status
    UPDATE public.newsletter_campaigns 
    SET 
        status = 'completed',
        sent_at = NOW()
    WHERE id = campaign_id;

    RETURN jsonb_build_object(
        'success', true, 
        'campaign_id', campaign_id, 
        'recipients_count', v_inserted_count
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

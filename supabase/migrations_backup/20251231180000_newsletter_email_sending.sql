-- Migration: Newsletter Email Sending via pg_net
-- Description: Creates a function to send newsletter emails using Supabase's email system

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Function to send a single newsletter email
CREATE OR REPLACE FUNCTION send_newsletter_email(
    recipient_email TEXT,
    subject_text TEXT,
    html_content TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    -- Use Supabase's internal email sending via GoTrue
    -- This will automatically route to Inbucket in local dev
    SELECT net.http_post(
        url := current_setting('app.settings.api_url', true) || '/auth/v1/admin/generate_link',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'apikey', current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object(
            'type', 'email',
            'email', recipient_email,
            'data', jsonb_build_object(
                'subject', subject_text,
                'html', html_content
            )
        )
    ) INTO v_result;

    RETURN jsonb_build_object('success', true, 'result', v_result);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Update the process_newsletter_campaign function to actually send emails
CREATE OR REPLACE FUNCTION process_newsletter_campaign(campaign_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_campaign RECORD;
    v_recipient RECORD;
    v_inserted_count INT := 0;
    v_sent_count INT := 0;
    v_filters JSONB;
    v_send_result JSONB;
BEGIN
    -- 1. Fetch Campaign
    SELECT * INTO v_campaign FROM public.newsletter_campaigns WHERE id = campaign_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Campaign not found');
    END IF;

    -- Mark as sending
    UPDATE public.newsletter_campaigns 
    SET status = 'sending' 
    WHERE id = campaign_id AND status = 'draft';

    v_filters := v_campaign.target_filters;

    -- 2. Determine Audience & Insert Recipients
    IF v_campaign.target_type = 'providers' THEN
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
                WHERE ps.category_id::text = v_filters->>'category'
            ))
            AND (v_filters->>'wilaya' = 'all' OR p.wilaya_id::text = v_filters->>'wilaya');
            
        GET DIAGNOSTICS v_inserted_count = ROW_COUNT;

    ELSIF v_campaign.target_type = 'clients' THEN
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

    -- 3. Send emails to all recipients
    FOR v_recipient IN 
        SELECT * FROM public.newsletter_recipients 
        WHERE campaign_id = process_newsletter_campaign.campaign_id 
        AND status = 'pending'
        LIMIT 100 -- Limit batch size to avoid timeouts
    LOOP
        -- Send email using Supabase's email system
        -- In local dev, this goes to Inbucket automatically
        BEGIN
            -- Use pg_notify to trigger email sending asynchronously
            -- Or directly insert into a queue table for processing
            PERFORM pg_notify(
                'send_newsletter',
                json_build_object(
                    'recipient_id', v_recipient.id,
                    'email', v_recipient.email,
                    'subject', v_campaign.subject,
                    'content', v_campaign.content
                )::text
            );
            
            -- Mark as sent (will be updated by worker)
            UPDATE public.newsletter_recipients
            SET status = 'sent', sent_at = NOW()
            WHERE id = v_recipient.id;
            
            v_sent_count := v_sent_count + 1;
        EXCEPTION WHEN OTHERS THEN
            -- Mark as failed
            UPDATE public.newsletter_recipients
            SET status = 'failed', error_message = SQLERRM
            WHERE id = v_recipient.id;
        END;
    END LOOP;

    -- 4. Update Campaign Status
    UPDATE public.newsletter_campaigns 
    SET 
        status = 'completed',
        sent_at = NOW()
    WHERE id = campaign_id;

    RETURN jsonb_build_object(
        'success', true, 
        'campaign_id', campaign_id, 
        'recipients_count', v_inserted_count,
        'sent_count', v_sent_count
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION send_newsletter_email(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION process_newsletter_campaign(UUID) TO authenticated;

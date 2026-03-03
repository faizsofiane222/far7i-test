-- Migration: Support Messages RPC Functions
-- Functions for sending and managing support messages

-- 1. SEND SUPPORT MESSAGE
-- ==========================================
CREATE OR REPLACE FUNCTION public.send_support_message(
    subject_text VARCHAR,
    message_text TEXT,
    priority_level VARCHAR DEFAULT 'normal',
    category_val VARCHAR DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    message_id UUID;
BEGIN
    -- Validate inputs
    IF subject_text IS NULL OR TRIM(subject_text) = '' THEN
        RAISE EXCEPTION 'Subject is required';
    END IF;
    
    IF message_text IS NULL OR TRIM(message_text) = '' THEN
        RAISE EXCEPTION 'Message is required';
    END IF;
    
    -- Insert message
    INSERT INTO public.support_messages (user_id, subject, message, priority, category)
    VALUES (auth.uid(), subject_text, message_text, priority_level, category_val)
    RETURNING id INTO message_id;
    
    -- Notify all admins
    INSERT INTO public.notifications (user_id, type, title, message, link)
    SELECT 
        ur.user_id,
        'new_support_message',
        '📧 Nouveau message support',
        'Sujet: ' || subject_text,
        '/admin/support'
    FROM public.user_roles ur
    WHERE ur.role = 'admin';
    
    RETURN json_build_object(
        'success', true,
        'message_id', message_id,
        'message', 'Message envoyé avec succès'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. ADMIN REPLY TO SUPPORT MESSAGE
-- ==========================================
CREATE OR REPLACE FUNCTION public.admin_reply_support_message(
    message_id UUID,
    reply_text TEXT
)
RETURNS JSON AS $$
DECLARE
    message_user_id UUID;
    message_subject VARCHAR;
BEGIN
    -- Check admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    -- Validate reply
    IF reply_text IS NULL OR TRIM(reply_text) = '' THEN
        RAISE EXCEPTION 'Reply text is required';
    END IF;
    
    -- Get message info
    SELECT user_id, subject INTO message_user_id, message_subject
    FROM public.support_messages
    WHERE id = message_id;
    
    IF message_user_id IS NULL THEN
        RAISE EXCEPTION 'Message not found';
    END IF;
    
    -- Update message
    UPDATE public.support_messages
    SET 
        admin_reply = reply_text,
        replied_by = auth.uid(),
        replied_at = NOW(),
        status = 'resolved',
        updated_at = NOW()
    WHERE id = message_id;
    
    -- Notify user
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
        message_user_id,
        'support_reply',
        '💬 Réponse à votre message',
        'Vous avez reçu une réponse concernant: ' || message_subject,
        '/support/messages'
    );
    
    RETURN json_build_object('success', true, 'message', 'Réponse envoyée');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. UPDATE SUPPORT MESSAGE STATUS
-- ==========================================
CREATE OR REPLACE FUNCTION public.update_support_message_status(
    message_id UUID,
    new_status VARCHAR
)
RETURNS JSON AS $$
BEGIN
    -- Check admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    -- Validate status
    IF new_status NOT IN ('open', 'in_progress', 'resolved', 'closed') THEN
        RAISE EXCEPTION 'Invalid status';
    END IF;
    
    -- Update status
    UPDATE public.support_messages
    SET status = new_status, updated_at = NOW()
    WHERE id = message_id;
    
    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

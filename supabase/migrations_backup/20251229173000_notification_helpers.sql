-- Migration: Notification & Messaging Helper RPCs
-- Adds functions to support real-time sidebar badges

-- 1. GET UNREAD MESSAGES COUNT
-- Returns the count of conversations containing messages newer than the last_read_at for the current user
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_unread_messages_count()
RETURNS INTEGER AS $$
DECLARE
    unread_count INTEGER;
BEGIN
    SELECT COUNT(DISTINCT cp.conversation_id) INTO unread_count
    FROM public.conversation_participants cp
    JOIN public.messages m ON m.conversation_id = cp.conversation_id
    WHERE cp.user_id = auth.uid()
    AND m.created_at > cp.last_read_at
    AND m.sender_id != auth.uid(); -- Don't count own messages
    
    RETURN unread_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. GET PENDING MODERATION COUNT
-- Returns the count of providers or other items awaiting validation (Admin only)
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_pending_moderation_count()
RETURNS INTEGER AS $$
DECLARE
    pending_count INTEGER;
BEGIN
    -- Check admin
    IF NOT public.is_admin() THEN
        RETURN 0;
    END IF;

    SELECT COUNT(*) INTO pending_count
    FROM public.providers
    WHERE moderation_status = 'pending'
    OR pending_changes IS NOT NULL;
    
    -- Add service pending changes too
    SELECT pending_count + COUNT(*) INTO pending_count
    FROM public.services
    WHERE moderation_status = 'pending'
    OR pending_changes IS NOT NULL;
    
    RETURN pending_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. MARK CONVERSATION AS READ
-- Updates the last_read_at timestamp for a participant in a conversation
-- ==========================================
CREATE OR REPLACE FUNCTION public.mark_conversation_read(conv_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.conversation_participants
    SET last_read_at = NOW()
    WHERE conversation_id = conv_id
    AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. GET UNREAD NOTIFICATIONS COUNT BY TYPE (Optional helper)
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_unread_notifications_by_type(notif_type VARCHAR)
RETURNS INTEGER AS $$
DECLARE
    count_val INTEGER;
BEGIN
    SELECT COUNT(*) INTO count_val
    FROM public.notifications
    WHERE user_id = auth.uid() 
    AND type = notif_type
    AND read = FALSE;
    
    RETURN count_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

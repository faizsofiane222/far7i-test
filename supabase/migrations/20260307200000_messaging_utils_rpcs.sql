-- Migration to add essential messaging and notification utility RPCs
-- These are called by useNotifications hook and other UI components

-- DROP EXISTING TO AVOID RETURN TYPE CONFLICTS
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.get_unread_messages_count();
DROP FUNCTION IF EXISTS public.get_unread_notifications_count();
DROP FUNCTION IF EXISTS public.get_pending_moderation_count();
DROP FUNCTION IF EXISTS public.mark_notification_read(UUID);
DROP FUNCTION IF EXISTS public.mark_all_notifications_read();
DROP FUNCTION IF EXISTS public.mark_conversation_read(UUID);

-- 1. Check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
    RETURN (auth.jwt() ->> 'role' = 'admin') 
    OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Unread messages count for current user
CREATE OR REPLACE FUNCTION public.get_unread_messages_count()
RETURNS bigint AS $$
BEGIN
    RETURN (
        SELECT count(*)
        FROM public.messages m
        JOIN public.conversation_participants cp ON m.conversation_id = cp.conversation_id
        WHERE cp.user_id = auth.uid()
        AND m.sender_id != auth.uid()
        AND (m.read_at IS NULL OR m.read_at < cp.last_read_at)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Unread notifications count
CREATE OR REPLACE FUNCTION public.get_unread_notifications_count()
RETURNS bigint AS $$
BEGIN
    -- Check if notifications table exists first to avoid error if missing
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
        RETURN (
            SELECT count(*)
            FROM public.notifications
            WHERE user_id = auth.uid()
            AND read_at IS NULL
        );
    ELSE
        RETURN 0;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Pending moderation count (Admin only)
CREATE OR REPLACE FUNCTION public.get_pending_moderation_count()
RETURNS bigint AS $$
DECLARE
    v_count bigint := 0;
    v_providers bigint := 0;
    v_reviews bigint := 0;
BEGIN
    IF NOT public.is_admin() THEN
        RETURN 0;
    END IF;

    -- Count pending providers
    SELECT count(*) INTO v_providers FROM public.providers WHERE moderation_status = 'pending';
    
    -- Count pending reviews if table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reviews') THEN
        SELECT count(*) INTO v_reviews FROM public.reviews WHERE moderation_status = 'pending';
    END IF;

    RETURN v_providers + v_reviews;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Mark individual notification read
CREATE OR REPLACE FUNCTION public.mark_notification_read(notification_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.notifications
    SET read_at = now()
    WHERE id = notification_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Mark all notifications as read
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS void AS $$
BEGIN
    UPDATE public.notifications
    SET read_at = now()
    WHERE user_id = auth.uid() AND read_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Mark conversation as read
CREATE OR REPLACE FUNCTION public.mark_conversation_read(conv_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.conversation_participants
    SET last_read_at = now()
    WHERE conversation_id = conv_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unread_messages_count() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unread_notifications_count() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_moderation_count() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_notification_read(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_conversation_read(UUID) TO authenticated;

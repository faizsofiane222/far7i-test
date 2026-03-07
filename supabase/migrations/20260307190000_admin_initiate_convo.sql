-- Migration to allow admins to start conversations with providers
-- This RPC handles conversation creation, participant setup, and initial message insertion.

CREATE OR REPLACE FUNCTION public.start_admin_conversation(
    p_target_user_id UUID,
    p_initial_message TEXT
)
RETURNS UUID AS $$
DECLARE
    v_conv_id UUID;
    v_admin_id UUID := auth.uid();
BEGIN
    -- 1. Security Check: Only admins can call this (or let RLS handle it, but safer here)
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only administrators can initiate these conversations.';
    END IF;

    -- 2. Create the conversation
    INSERT INTO public.conversations (type, status)
    VALUES ('support', 'open')
    RETURNING id INTO v_conv_id;

    -- 3. Add Participants
    -- Add the Admin
    INSERT INTO public.conversation_participants (conversation_id, user_id)
    VALUES (v_conv_id, v_admin_id);

    -- Add the Target Provider
    INSERT INTO public.conversation_participants (conversation_id, user_id)
    VALUES (v_conv_id, p_target_user_id);

    -- 4. Insert Initial Message
    INSERT INTO public.messages (conversation_id, sender_id, content)
    VALUES (v_conv_id, v_admin_id, p_initial_message);

    RETURN v_conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure is_admin function exists and is robust
-- Note: This assumes public.is_admin() is already defined as per messaging_system.sql
-- If it's not defined, it usually checks the user_roles table or JWT.

GRANT EXECUTE ON FUNCTION public.start_admin_conversation(UUID, TEXT) TO authenticated;

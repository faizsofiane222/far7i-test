-- 1. Reset Messaging Data (As requested for fresh start)
TRUNCATE TABLE public.messages, public.conversation_participants, public.conversations RESTART IDENTITY CASCADE;

-- 2. Create RPC for Deleting Conversations
CREATE OR REPLACE FUNCTION public.delete_conversation(target_conversation_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Authorization Check: Only allow if the user is a participant OR an admin
    IF NOT EXISTS (
        SELECT 1 FROM public.conversation_participants
        WHERE conversation_id = target_conversation_id AND user_id = auth.uid()
    ) AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Not authorized to delete this conversation';
    END IF;

    -- Delete the conversation (Cascade will handle messages and participants)
    DELETE FROM public.conversations WHERE id = target_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

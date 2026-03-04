-- Redefine delete_conversation to be a "Leave Conversation" action
-- This preserves history for the other party (Support) until no one is left.

CREATE OR REPLACE FUNCTION public.delete_conversation(target_conversation_id UUID)
RETURNS VOID AS $$
BEGIN
    -- 1. Remove ONLY the requesting user from participants
    DELETE FROM public.conversation_participants 
    WHERE conversation_id = target_conversation_id 
    AND user_id = auth.uid();

    -- 2. Optional: If Admin, they might want to force delete?
    -- For now, let's keep it simple. If admin calls this, they just leave the chat too.
    -- If we really wanted a "Hard Delete", we'd need a separate Admin RPC.

    -- 3. Cleanup: If NO participants remain, delete the empty conversation row + messages
    -- (This prevents ghost data accumulation)
    IF NOT EXISTS (
        SELECT 1 FROM public.conversation_participants 
        WHERE conversation_id = target_conversation_id
    ) THEN
        DELETE FROM public.conversations WHERE id = target_conversation_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

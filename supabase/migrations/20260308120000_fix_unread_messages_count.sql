-- Correction du compteur de messages non lus
-- Le but est de compter les messages créés APRES la dernière fois que l'utilisateur a lu la conversation

CREATE OR REPLACE FUNCTION public.get_unread_messages_count()
RETURNS integer AS $$
DECLARE
    v_count integer;
BEGIN
    SELECT count(*)::integer INTO v_count
    FROM public.messages m
    JOIN public.conversation_participants cp ON m.conversation_id = cp.conversation_id
    WHERE cp.user_id = auth.uid()
    AND m.sender_id != auth.uid()
    -- Un message est non lu s'il a été créé après la dernière lecture de l'utilisateur
    AND m.created_at > cp.last_read_at;
    
    RETURN coalesce(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_unread_messages_count() TO authenticated;

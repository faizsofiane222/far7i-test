-- Update the start_support_conversation function to prevent duplicates
CREATE OR REPLACE FUNCTION public.start_support_conversation(subject text default null)
RETURNS UUID AS $$
DECLARE
    existing_conv_id UUID;
    new_conv_id UUID;
BEGIN
    -- 1. Check if an OPEN support conversation already exists for the current user
    SELECT c.id INTO existing_conv_id
    FROM public.conversations c
    JOIN public.conversation_participants cp ON cp.conversation_id = c.id
    WHERE cp.user_id = auth.uid()
    AND c.type = 'support'
    AND c.status = 'open'
    LIMIT 1;

    -- 2. If found, return it immediately
    IF existing_conv_id IS NOT NULL THEN
        RETURN existing_conv_id;
    END IF;

    -- 3. If not found, create a new one
    INSERT INTO public.conversations (type, status)
    VALUES ('support', 'open')
    RETURNING id INTO new_conv_id;

    -- Add current user as participant
    INSERT INTO public.conversation_participants (conversation_id, user_id)
    VALUES (new_conv_id, auth.uid());

    RETURN new_conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

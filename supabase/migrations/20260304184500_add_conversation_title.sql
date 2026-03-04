-- Add title column to conversations if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'title') THEN
        ALTER TABLE public.conversations ADD COLUMN title TEXT;
    END IF;
END $$;

-- Update start_support_conversation to accept title and initial message
CREATE OR REPLACE FUNCTION public.start_support_conversation(p_title text, p_message text)
RETURNS UUID AS $$
DECLARE
    new_conv_id UUID;
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 1. Create the conversation with the specified title
    INSERT INTO public.conversations (type, status, title)
    VALUES ('support', 'open', p_title)
    RETURNING id INTO new_conv_id;

    -- 2. Add current user as participant
    INSERT INTO public.conversation_participants (conversation_id, user_id)
    VALUES (new_conv_id, v_user_id);

    -- 3. Insert the first message
    INSERT INTO public.messages (conversation_id, sender_id, content)
    VALUES (new_conv_id, v_user_id, p_message);

    RETURN new_conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

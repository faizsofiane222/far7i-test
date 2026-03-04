-- Create types
CREATE TYPE public.conversation_type AS ENUM ('support', 'client', 'system');
CREATE TYPE public.conversation_status AS ENUM ('open', 'closed', 'resolved');

-- Create conversations table
CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type public.conversation_type NOT NULL DEFAULT 'client',
    status public.conversation_status NOT NULL DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Participants table (Many-to-Many)
CREATE TABLE public.conversation_participants (
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    last_read_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (conversation_id, user_id)
);

-- Messages table
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    read_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies for Conversations

-- 1. Participants can view their conversations
CREATE POLICY "Users can view their conversations" ON public.conversations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversation_participants cp
            WHERE cp.conversation_id = id
            AND cp.user_id = auth.uid()
        )
    );

-- 2. Admins can view ALL 'support' conversations
CREATE POLICY "Admins can view all support conversations" ON public.conversations
    FOR ALL USING (
        type = 'support' AND public.is_admin()
    );

-- 3. Users can create conversations (e.g., starting a support chat)
-- We might need a stricter policy or an RPC to start chats to ensure participants are correct, 
-- but for now, allow insert if authenticated. We'll handle participant insertion logic in app or RPC.
CREATE POLICY "Users can create conversations" ON public.conversations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policies for Participants

-- 1. Users can view participants of conversations they belong to
CREATE POLICY "Users can view participants" ON public.conversation_participants
    FOR SELECT USING (
        conversation_id IN (
            SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid()
        )
    );

-- 2. Admins can view participants of support conversations
CREATE POLICY "Admins can view support participants" ON public.conversation_participants
    FOR SELECT USING (
        EXISTS (
             SELECT 1 FROM public.conversations c 
             WHERE c.id = conversation_id AND c.type = 'support'
        )
        AND public.is_admin()
    );

-- 3. Users can add themselves (or via RPC)
CREATE POLICY "Users can insert participants" ON public.conversation_participants
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');


-- Policies for Messages

-- 1. Users can view messages in their conversations
CREATE POLICY "Users can view messages" ON public.messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid()
        )
    );

-- 2. Admins can view messages in support conversations
CREATE POLICY "Admins can view support messages" ON public.messages
    FOR SELECT USING (
         EXISTS (
             SELECT 1 FROM public.conversations c 
             WHERE c.id = conversation_id AND c.type = 'support'
        )
        AND public.is_admin()
    );

-- 3. Users can send messages to their conversations
CREATE POLICY "Users can insert messages" ON public.messages
    FOR INSERT WITH CHECK (
        conversation_id IN (
            SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid()
        )
        OR
        (
             -- Allow admins to reply in support threads even if not strictly a 'participant' yet? 
             -- Better to add admin as participant.
             -- But for now, if admin, let them write to support convs.
             public.is_admin() AND EXISTS (
                 SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.type = 'support'
             )
        )
    );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations
    SET updated_at = now()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conv_timestamp_trigger
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_conversation_timestamp();

-- Helper RPC to start a support conversation
CREATE OR REPLACE FUNCTION public.start_support_conversation(subject text default null)
RETURNS UUID AS $$
DECLARE
    new_conv_id UUID;
BEGIN
    -- Create conversation
    INSERT INTO public.conversations (type, status)
    VALUES ('support', 'open')
    RETURNING id INTO new_conv_id;

    -- Add current user as participant (The Provider)
    INSERT INTO public.conversation_participants (conversation_id, user_id)
    VALUES (new_conv_id, auth.uid());

    -- Create initial system message or user message if needed?
    -- For now just return the ID.

    RETURN new_conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

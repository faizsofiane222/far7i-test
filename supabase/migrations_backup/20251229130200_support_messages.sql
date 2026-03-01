-- Migration: Support Messages System
-- Creates table for user support/contact messages

-- 1. CREATE SUPPORT MESSAGES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    category VARCHAR(50), -- 'technical', 'billing', 'general', etc.
    admin_reply TEXT,
    replied_by UUID REFERENCES auth.users(id),
    replied_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CREATE INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_support_messages_user ON public.support_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_status ON public.support_messages(status);
CREATE INDEX IF NOT EXISTS idx_support_messages_priority ON public.support_messages(priority);
CREATE INDEX IF NOT EXISTS idx_support_messages_created ON public.support_messages(created_at DESC);

-- 3. RLS POLICIES
-- ==========================================
-- Enable RLS
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Users can view their own messages
CREATE POLICY "Users can view own support messages"
    ON public.support_messages FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Users can create their own messages
CREATE POLICY "Users can create support messages"
    ON public.support_messages FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Admins can view all messages
CREATE POLICY "Admins can view all support messages"
    ON public.support_messages FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can update all messages (for replies)
CREATE POLICY "Admins can update support messages"
    ON public.support_messages FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 4. UPDATE TRIGGER
-- ==========================================
CREATE OR REPLACE FUNCTION update_support_message_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_support_message_timestamp_trigger
    BEFORE UPDATE ON public.support_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_support_message_timestamp();

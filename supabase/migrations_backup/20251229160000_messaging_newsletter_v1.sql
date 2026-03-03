-- Migration: Messaging & Newsletter V1
-- Description: Adds guest support to conversations and creates newsletter campaign tables

-- 1. ENHANCE CONVERSATIONS FOR GUESTS
-- ==========================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversations' AND column_name='guest_email') THEN
        ALTER TABLE public.conversations ADD COLUMN guest_email VARCHAR(255);
        ALTER TABLE public.conversations ADD COLUMN guest_name VARCHAR(255);
    END IF;
END $$;

-- 2. CREATE NEWSLETTER CAMPAIGNS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.newsletter_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    target_type VARCHAR(50) NOT NULL, -- 'providers', 'clients', 'all'
    target_filters JSONB DEFAULT '{}', -- { category: 'dj', wilaya: 'Alger' }
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'sending', 'sent', 'failed'
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 3. CREATE NEWSLETTER RECIPIENTS (LOG)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.newsletter_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES public.newsletter_campaigns(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ENABLE RLS
-- ==========================================
ALTER TABLE public.newsletter_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_recipients ENABLE ROW LEVEL SECURITY;

-- Admins can manage all campaigns
CREATE POLICY "Admins can manage all newsletter campaigns"
    ON public.newsletter_campaigns FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Admins can view all recipients
CREATE POLICY "Admins can view all newsletter recipients"
    ON public.newsletter_recipients FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- 5. UPDATE TRIGGER
-- ==========================================
CREATE OR REPLACE FUNCTION update_newsletter_campaign_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_newsletter_campaign_timestamp_trigger ON public.newsletter_campaigns;
CREATE TRIGGER update_newsletter_campaign_timestamp_trigger
    BEFORE UPDATE ON public.newsletter_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_newsletter_campaign_timestamp();

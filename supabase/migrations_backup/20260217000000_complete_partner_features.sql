-- Migration: Complete Partner Features and Moderation Setup
-- Date: 2026-02-17
-- Description: Consolidated migration that adds all necessary columns and fixes in correct order
-- This replaces multiple problematic migrations that had circular dependencies

-- ============================================================================
-- PART 1: Add Moderation Columns (needed by many other migrations)
-- ============================================================================

-- Add moderation_status to providers
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name='providers' AND column_name='moderation_status'
    ) THEN
        ALTER TABLE public.providers ADD COLUMN moderation_status VARCHAR(20) DEFAULT 'incomplete';
    END IF;
END $$;

-- Add pending_changes to providers
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name='providers' AND column_name='pending_changes'
    ) THEN
        ALTER TABLE public.providers ADD COLUMN pending_changes JSONB DEFAULT NULL;
    END IF;
END $$;

-- Add admin_notes to providers
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name='providers' AND column_name='admin_notes'
    ) THEN
        ALTER TABLE public.providers ADD COLUMN admin_notes TEXT;
    END IF;
END $$;

-- Add moderation_status to services
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name='services' AND column_name='moderation_status'
    ) THEN
        ALTER TABLE public.services ADD COLUMN moderation_status VARCHAR(20) DEFAULT 'pending';
    END IF;
END $$;

-- Add pending_changes to services
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name='services' AND column_name='pending_changes'
    ) THEN
        ALTER TABLE public.services ADD COLUMN pending_changes JSONB DEFAULT NULL;
    END IF;
END $$;

-- Add rejection_reason to services
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name='services' AND column_name='rejection_reason'
    ) THEN
        ALTER TABLE public.services ADD COLUMN rejection_reason TEXT;
    END IF;
END $$;

-- Add modification_submitted to providers
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name='providers' AND column_name='modification_submitted'
    ) THEN
        ALTER TABLE public.providers ADD COLUMN modification_submitted BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add modification_submitted to services
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name='services' AND column_name='modification_submitted'
    ) THEN
        ALTER TABLE public.services ADD COLUMN modification_submitted BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- ============================================================================
-- PART 2: Add Partner-Specific Columns
-- ============================================================================

-- Add bio column for partner biography
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name='providers' AND column_name='bio'
    ) THEN
        ALTER TABLE public.providers ADD COLUMN bio TEXT;
    END IF;
END $$;

-- Add latitude for map location
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name='providers' AND column_name='latitude'
    ) THEN
        ALTER TABLE public.providers ADD COLUMN latitude DECIMAL(10,8);
    END IF;
END $$;

-- Add longitude for map location
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name='providers' AND column_name='longitude'
    ) THEN
        ALTER TABLE public.providers ADD COLUMN longitude DECIMAL(11,8);
    END IF;
END $$;

-- Add is_viber_active toggle
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name='providers' AND column_name='is_viber_active'
    ) THEN
        ALTER TABLE public.providers ADD COLUMN is_viber_active BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add partner_type (individual vs agency)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name='providers' AND column_name='partner_type'
    ) THEN
        ALTER TABLE public.providers ADD COLUMN partner_type VARCHAR(50);
    END IF;
END $$;

-- Add check constraint for partner_type if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.constraint_column_usage 
        WHERE table_name = 'providers' AND constraint_name = 'providers_partner_type_check'
    ) THEN
        ALTER TABLE public.providers 
        ADD CONSTRAINT providers_partner_type_check 
        CHECK (partner_type IN ('individual', 'agency') OR partner_type IS NULL);
    END IF;
END $$;

-- ============================================================================
-- PART 3: Fix User Registration Trigger
-- ============================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the handle_new_user function with proper provider support
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    default_display_name TEXT;
    user_role TEXT;
BEGIN
    -- Extract display name from metadata
    default_display_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name', 
        NEW.raw_user_meta_data->>'name', 
        NEW.raw_user_meta_data->>'display_name', 
        NEW.raw_user_meta_data->>'businessName',
        NEW.raw_user_meta_data->>'business_name',
        SPLIT_PART(NEW.email, '@', 1)
    );

    -- Extract Role (default to client)
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'client');

    -- 1. Insert into public.users
    INSERT INTO public.users (id, email, display_name, email_verified, role)
    VALUES (
        NEW.id, 
        NEW.email, 
        default_display_name,
        NEW.email_confirmed_at IS NOT NULL,
        user_role
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        display_name = COALESCE(public.users.display_name, EXCLUDED.display_name),
        email_verified = EXCLUDED.email_verified,
        role = EXCLUDED.role;
    
    -- 2. Insert into public.user_roles
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, user_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    -- 3. If Provider, create Provider Record with Registration Metadata
    IF user_role = 'provider' THEN
        INSERT INTO public.providers (
            user_id, 
            commercial_name, 
            phone_number, 
            provider_type, 
            main_social_link,
            email,
            moderation_status
        )
        VALUES (
            NEW.id,
            COALESCE(
                NEW.raw_user_meta_data->>'business_name', 
                NEW.raw_user_meta_data->>'businessName', 
                default_display_name
            ),
            NEW.raw_user_meta_data->>'phone',
            NEW.raw_user_meta_data->>'partner_type',
            NEW.raw_user_meta_data->>'social_link',
            NEW.email,
            'incomplete'
        )
        ON CONFLICT (user_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- PART 4: Add Comments for Documentation
-- ============================================================================

COMMENT ON COLUMN public.providers.bio IS 'Partner biography/description (distinct from service descriptions)';
COMMENT ON COLUMN public.providers.latitude IS 'Geographic latitude for map location';
COMMENT ON COLUMN public.providers.longitude IS 'Geographic longitude for map location';
COMMENT ON COLUMN public.providers.is_viber_active IS 'Whether the phone number is active on Viber';
COMMENT ON COLUMN public.providers.partner_type IS 'Type of partner: individual or agency';
COMMENT ON COLUMN public.providers.moderation_status IS 'Status: incomplete, pending, approved, rejected';
COMMENT ON COLUMN public.providers.pending_changes IS 'JSONB of changes awaiting admin approval';

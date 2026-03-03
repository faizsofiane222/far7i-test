-- Service Lifecycle Migration
-- Adds status tracking and proposal system for services

-- Add lifecycle columns to services
ALTER TABLE services ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS is_paused BOOLEAN;
ALTER TABLE services ADD COLUMN IF NOT EXISTS is_archived BOOLEAN;

-- Set defaults for new columns
UPDATE services SET status = 'draft' WHERE status IS NULL;
UPDATE services SET is_paused = false WHERE is_paused IS NULL;
UPDATE services SET is_archived = false WHERE is_archived IS NULL;

-- Set column defaults for future inserts
ALTER TABLE services ALTER COLUMN status SET DEFAULT 'draft';
ALTER TABLE services ALTER COLUMN is_paused SET DEFAULT false;
ALTER TABLE services ALTER COLUMN is_archived SET DEFAULT false;

-- Create service_proposals table
CREATE TABLE IF NOT EXISTS service_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL,
    provider_id UUID NOT NULL,
    proposed_title TEXT,
    proposed_description TEXT,
    proposed_price DECIMAL(10,2),
    proposed_photos TEXT[],
    status TEXT DEFAULT 'pending',
    rejection_reason TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);
CREATE INDEX IF NOT EXISTS idx_proposals_service ON service_proposals(service_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON service_proposals(status);

-- Enable RLS
ALTER TABLE service_proposals ENABLE ROW LEVEL SECURITY;

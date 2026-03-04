-- RPC Functions for Service Lifecycle Management
-- Description: Functions for pause, archive, update, and moderation

-- ============================================
-- FUNCTION 1: Toggle Service Pause
-- ============================================

CREATE OR REPLACE FUNCTION toggle_service_pause(service_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_paused BOOLEAN;
    provider_id_var UUID;
BEGIN
    -- Get current pause status and verify ownership
    SELECT is_paused, provider_id INTO current_paused, provider_id_var
    FROM services
    WHERE id = service_id_param
    AND provider_id IN (
        SELECT id FROM providers WHERE user_id = auth.uid()
    );
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Service not found or unauthorized';
    END IF;
    
    -- Toggle pause status
    UPDATE services
    SET is_paused = NOT current_paused,
        updated_at = NOW()
    WHERE id = service_id_param;
    
    RETURN NOT current_paused;
END;
$$;

COMMENT ON FUNCTION toggle_service_pause IS 'Toggle pause status of a service (provider only)';

-- ============================================
-- FUNCTION 2: Archive Service (Soft Delete)
-- ============================================

CREATE OR REPLACE FUNCTION archive_service(service_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Archive service (soft delete)
    UPDATE services
    SET is_archived = true,
        updated_at = NOW()
    WHERE id = service_id_param
    AND provider_id IN (
        SELECT id FROM providers WHERE user_id = auth.uid()
    );
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Service not found or unauthorized';
    END IF;
    
    RETURN true;
END;
$$;

COMMENT ON FUNCTION archive_service IS 'Archive a service (soft delete, provider only)';

-- ============================================
-- FUNCTION 3: Submit Service Update
-- ============================================

CREATE OR REPLACE FUNCTION submit_service_update(
    service_id_param UUID,
    new_title TEXT,
    new_description TEXT,
    new_price DECIMAL,
    new_photos TEXT[] DEFAULT NULL,
    new_category_id UUID DEFAULT NULL,
    new_event_type_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    provider_id_var UUID;
    current_status TEXT;
    proposal_id UUID;
    result JSON;
BEGIN
    -- Get provider and current status
    SELECT provider_id, status INTO provider_id_var, current_status
    FROM services
    WHERE id = service_id_param
    AND provider_id IN (
        SELECT id FROM providers WHERE user_id = auth.uid()
    );
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Service not found or unauthorized';
    END IF;
    
    -- If service is published, create proposal instead of direct update
    IF current_status = 'published' THEN
        -- Create proposal
        INSERT INTO service_proposals (
            service_id,
            provider_id,
            proposed_title,
            proposed_description,
            proposed_price,
            proposed_photos,
            proposed_category_id,
            proposed_event_type_id
        ) VALUES (
            service_id_param,
            provider_id_var,
            new_title,
            new_description,
            new_price,
            new_photos,
            new_category_id,
            new_event_type_id
        )
        RETURNING id INTO proposal_id;
        
        -- Update service status to pending validation
        UPDATE services
        SET status = 'pending_validation',
            updated_at = NOW()
        WHERE id = service_id_param;
        
        result := json_build_object(
            'type', 'proposal_created',
            'proposal_id', proposal_id,
            'message', 'Modifications envoyées pour validation'
        );
    ELSE
        -- Direct update for draft/rejected services
        UPDATE services
        SET title = new_title,
            description = new_description,
            price = new_price,
            photos = COALESCE(new_photos, photos),
            category_id = COALESCE(new_category_id, category_id),
            event_type_id = COALESCE(new_event_type_id, event_type_id),
            status = 'pending_validation',
            updated_at = NOW()
        WHERE id = service_id_param;
        
        result := json_build_object(
            'type', 'direct_update',
            'service_id', service_id_param,
            'message', 'Service mis à jour et envoyé pour validation'
        );
    END IF;
    
    RETURN result;
END;
$$;

COMMENT ON FUNCTION submit_service_update IS 'Submit service update (creates proposal if published, direct update otherwise)';

-- ============================================
-- FUNCTION 4: Moderate Service Proposal
-- ============================================

CREATE OR REPLACE FUNCTION moderate_service_proposal(
    proposal_id_param UUID,
    action TEXT, -- 'approve' or 'reject'
    reason TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    proposal_record RECORD;
    result JSON;
BEGIN
    -- Check admin permission
    IF NOT EXISTS (
        SELECT 1 FROM providers 
        WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Admin access required';
    END IF;
    
    -- Get proposal
    SELECT * INTO proposal_record
    FROM service_proposals
    WHERE id = proposal_id_param
    AND status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Proposal not found or already processed';
    END IF;
    
    IF action = 'approve' THEN
        -- Apply changes to service
        UPDATE services
        SET title = COALESCE(proposal_record.proposed_title, title),
            description = COALESCE(proposal_record.proposed_description, description),
            price = COALESCE(proposal_record.proposed_price, price),
            photos = COALESCE(proposal_record.proposed_photos, photos),
            category_id = COALESCE(proposal_record.proposed_category_id, category_id),
            event_type_id = COALESCE(proposal_record.proposed_event_type_id, event_type_id),
            status = 'published',
            moderated_at = NOW(),
            moderated_by = auth.uid(),
            updated_at = NOW()
        WHERE id = proposal_record.service_id;
        
        -- Mark proposal as approved
        UPDATE service_proposals
        SET status = 'approved',
            reviewed_at = NOW(),
            reviewed_by = auth.uid(),
            updated_at = NOW()
        WHERE id = proposal_id_param;
        
        result := json_build_object(
            'success', true,
            'action', 'approved',
            'service_id', proposal_record.service_id,
            'message', 'Modifications approuvées et publiées'
        );
        
    ELSIF action = 'reject' THEN
        -- Reject proposal
        UPDATE service_proposals
        SET status = 'rejected',
            rejection_reason = reason,
            reviewed_at = NOW(),
            reviewed_by = auth.uid(),
            updated_at = NOW()
        WHERE id = proposal_id_param;
        
        -- Revert service status to published
        UPDATE services
        SET status = 'published',
            rejection_reason = reason,
            updated_at = NOW()
        WHERE id = proposal_record.service_id;
        
        result := json_build_object(
            'success', true,
            'action', 'rejected',
            'service_id', proposal_record.service_id,
            'message', 'Modifications rejetées'
        );
    ELSE
        RAISE EXCEPTION 'Invalid action: must be "approve" or "reject"';
    END IF;
    
    RETURN result;
END;
$$;

COMMENT ON FUNCTION moderate_service_proposal IS 'Approve or reject a service proposal (admin only)';

-- ============================================
-- FUNCTION 5: Get Services for Provider
-- ============================================

CREATE OR REPLACE FUNCTION get_provider_services(include_archived BOOLEAN DEFAULT false)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    price DECIMAL,
    status TEXT,
    is_paused BOOLEAN,
    is_archived BOOLEAN,
    has_pending_proposal BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.title,
        s.description,
        s.price,
        s.status,
        s.is_paused,
        s.is_archived,
        EXISTS(
            SELECT 1 FROM service_proposals sp 
            WHERE sp.service_id = s.id AND sp.status = 'pending'
        ) as has_pending_proposal,
        s.created_at,
        s.updated_at
    FROM services s
    WHERE s.provider_id IN (
        SELECT id FROM providers WHERE user_id = auth.uid()
    )
    AND (include_archived OR NOT s.is_archived)
    ORDER BY s.created_at DESC;
END;
$$;

COMMENT ON FUNCTION get_provider_services IS 'Get all services for the authenticated provider';

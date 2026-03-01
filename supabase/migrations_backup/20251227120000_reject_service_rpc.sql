-- RPC for rejecting service changes
CREATE OR REPLACE FUNCTION public.reject_service_changes(target_service_id UUID, reason TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the service status to rejected and record the reason
  -- We do NOT clear pending_changes so the provider can see what was rejected and edit it.
  UPDATE public.services
  SET 
    moderation_status = 'rejected',
    rejection_reason = reason,
    updated_at = NOW()
  WHERE id = target_service_id;
END;
$$;

-- Grant execute permission to authenticated users (admins will use this)
GRANT EXECUTE ON FUNCTION public.reject_service_changes(UUID, TEXT) TO authenticated;

-- Migration: Add secure user account deletion RPC
-- This allows a user to delete their own account from auth.users securely.

CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only allow the authenticated user to delete their own record
    -- auth.uid() returns the UUID of the user making the request
    DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

-- Revoke all permissions and then grant only to authenticated users
REVOKE ALL ON FUNCTION public.delete_user_account() FROM public;
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;

COMMENT ON FUNCTION public.delete_user_account() IS 'Deletes the currently authenticated user from auth.users. trigger cascades to public tables.';

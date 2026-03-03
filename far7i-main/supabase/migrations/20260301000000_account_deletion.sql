-- Migration: Add account deletion requests table and RPCs
-- This allows for a two-step deletion process with email confirmation.

CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token UUID DEFAULT gen_random_uuid() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (timezone('utc'::text, now()) + interval '24 hours') NOT NULL,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(token)
);

-- Enable RLS
ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can request deletion for themselves
CREATE POLICY "Users can insert own deletion requests" ON public.account_deletion_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Only authenticated users can see their own requests
CREATE POLICY "Users can see own deletion requests" ON public.account_deletion_requests
    FOR SELECT USING (auth.uid() = user_id);

-- RPC to request deletion (returns token)
CREATE OR REPLACE FUNCTION public.request_account_deletion()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_token UUID;
BEGIN
    INSERT INTO public.account_deletion_requests (user_id)
    VALUES (auth.uid())
    RETURNING token INTO new_token;
    
    RETURN new_token;
END;
$$;

-- RPC to confirm and execute deletion
CREATE OR REPLACE FUNCTION public.confirm_account_deletion(token_val UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Find and verify the token
    SELECT user_id INTO target_user_id
    FROM public.account_deletion_requests
    WHERE token = token_val
      AND confirmed_at IS NULL
      AND expires_at > now();

    IF target_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Mark as confirmed (optional since we're deleting the user anyway)
    UPDATE public.account_deletion_requests
    SET confirmed_at = now()
    WHERE token = token_val;

    -- Delete the user from auth.users (cascades to public tables)
    DELETE FROM auth.users WHERE id = target_user_id;

    RETURN TRUE;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.request_account_deletion() TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_account_deletion(UUID) TO public; -- Token verification is public

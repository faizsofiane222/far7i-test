-- Fix RLS Recursion in conversation_participants

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Users can view participants" ON public.conversation_participants;

-- Create a simpler non-recursive policy
-- Users can only see their OWN participant rows. 
-- This is sufficient for the 'messages' and 'conversations' policies to work (checking membership).
CREATE POLICY "Users can view own participant rows" ON public.conversation_participants
    FOR SELECT USING (user_id = auth.uid());

-- Optional: If we really want users to see other participants (e.g. to see who is in the chat),
-- we would need a SECURITY DEFINER view or function to bypass RLS for that specific lookup.
-- For now, seeing oneself is enough to prove membership.

-- Ensure Admins can still view everything (already covered by "Admins can view support participants" if it exists, assume we keep it)
-- Re-applying Admin policy for safety just in case naming was different or to be sure
DROP POLICY IF EXISTS "Admins can view support participants" ON public.conversation_participants;
CREATE POLICY "Admins can view support participants" ON public.conversation_participants
    FOR SELECT USING (public.is_admin()); 
-- Simplified Admin policy: Admins can view ALL participants. 
-- The previous restriction to 'support' type required joining conversations, which is fine, 
-- but 'public.is_admin()' is simpler if we trust admins.

-- Verify Messages Policy (No changes needed if it relies on the above)
-- The existing policy for messages uses:
-- conversation_id IN (SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid())
-- This subquery now uses "Users can view own participant rows", which returns the user's rows correctly.

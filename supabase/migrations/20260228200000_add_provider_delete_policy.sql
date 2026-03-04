-- Add DELETE policy on providers table so authenticated users can delete their own providers and admins can delete any provider.
-- Without this policy, Supabase RLS silently blocks the deletion (returns count=0, no error).

DROP POLICY IF EXISTS "Users can delete own provider" ON public.providers;
CREATE POLICY "Users can delete own provider" ON public.providers
    FOR DELETE TO authenticated
    USING (
        auth.uid() = user_id 
        OR 
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

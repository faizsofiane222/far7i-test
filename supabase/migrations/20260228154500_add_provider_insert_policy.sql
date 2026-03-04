-- Migration to allow authenticated users to insert their own provider profiles
-- This is necessary for the multi-provider feature where users can create additional service profiles from the frontend.

CREATE POLICY "Users can insert own provider profile" ON public.providers
    FOR INSERT TO authenticated 
    WITH CHECK (auth.uid() = user_id);

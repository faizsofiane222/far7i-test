-- CrÃ©ation du bucket 'provider-profiles' pour les avatars des prestataires
INSERT INTO storage.buckets (id, name, public) 
VALUES ('provider-profiles', 'provider-profiles', true)
ON CONFLICT (id) DO NOTHING;

-- Politiques de sÃ©curitÃ© (RLS) pour le bucket 'provider-profiles'
-- 1. Tout le monde peut voir les images de profil
CREATE POLICY "Public Access provider-profiles" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'provider-profiles');

-- 2. Les utilisateurs connectÃ©s peuvent uploader leur avatar
CREATE POLICY "Auth Insert provider-profiles" 
    ON storage.objects FOR INSERT 
    TO authenticated 
    WITH CHECK (bucket_id = 'provider-profiles');

-- 3. Les utilisateurs connectÃ©s peuvent supprimer leur propre avatar
CREATE POLICY "Auth Delete provider-profiles" 
    ON storage.objects FOR DELETE 
    TO authenticated 
    USING (bucket_id = 'provider-profiles');

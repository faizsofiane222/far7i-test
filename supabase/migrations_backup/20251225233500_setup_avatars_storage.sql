-- ============================================
-- SETUP AVATARS STORAGE BUCKET
-- ============================================

-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS Policies for Storage

-- Policy: Anyone can view avatars
CREATE POLICY "Public Avatar Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

-- Policy: Authenticated users can upload to their own folder
CREATE POLICY "User Avatar Upload" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'avatars' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Authenticated users can update their own folder
CREATE POLICY "User Avatar Update" 
ON storage.objects FOR UPDATE 
USING (
    bucket_id = 'avatars' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Authenticated users can delete their own folder
CREATE POLICY "User Avatar Delete" 
ON storage.objects FOR DELETE 
USING (
    bucket_id = 'avatars' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

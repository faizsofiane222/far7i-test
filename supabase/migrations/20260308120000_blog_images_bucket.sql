-- ==========================================
-- CREATE BLOG IMAGES BUCKET
-- ==========================================

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for blog-images bucket

-- Allow public read access to all blog images
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'blog-images');

-- Allow authenticated users (specifically admins) to upload images
CREATE POLICY "Admin Insert Access" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'blog-images' AND 
    auth.role() = 'authenticated' AND
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Allow authenticated admins to update images
CREATE POLICY "Admin Update Access" 
ON storage.objects FOR UPDATE 
USING (
    bucket_id = 'blog-images' AND 
    auth.role() = 'authenticated' AND
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Allow authenticated admins to delete images
CREATE POLICY "Admin Delete Access" 
ON storage.objects FOR DELETE 
USING (
    bucket_id = 'blog-images' AND 
    auth.role() = 'authenticated' AND
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- ============================================
-- SETUP BLOG IMAGES STORAGE BUCKET
-- ============================================

-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS Policies for Storage

-- Policy: Anyone can view blog images
CREATE POLICY "Public Blog Image Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'blog-images');

-- Policy: Admin users can upload blog images
CREATE POLICY "Admin Blog Image Upload" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'blog-images' AND 
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Policy: Admin users can update blog images
CREATE POLICY "Admin Blog Image Update" 
ON storage.objects FOR UPDATE 
USING (
    bucket_id = 'blog-images' AND 
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- Policy: Admin users can delete blog images
CREATE POLICY "Admin Blog Image Delete" 
ON storage.objects FOR DELETE 
USING (
    bucket_id = 'blog-images' AND 
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

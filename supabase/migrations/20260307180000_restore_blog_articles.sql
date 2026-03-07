-- Migration to restore blog_articles table
-- This table was missing in the current schema cache but used in the code.

CREATE TABLE IF NOT EXISTS public.blog_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    category TEXT DEFAULT 'tendances',
    read_time TEXT DEFAULT '5 min',
    image_url TEXT,
    excerpt TEXT,
    content TEXT,
    author_name TEXT DEFAULT 'Far7i Team',
    author_avatar TEXT,
    author_bio TEXT,
    tags TEXT[] DEFAULT '{}',
    featured BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.blog_articles ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_blog_articles_status ON public.blog_articles(status);
CREATE INDEX IF NOT EXISTS idx_blog_articles_slug ON public.blog_articles(slug);
CREATE INDEX IF NOT EXISTS idx_blog_articles_published_at ON public.blog_articles(published_at);
CREATE INDEX IF NOT EXISTS idx_blog_articles_category ON public.blog_articles(category);

-- RLS Policies
-- 1. Public can read published articles
CREATE POLICY "Public can read published articles"
ON public.blog_articles
FOR SELECT
TO anon, authenticated
USING (status = 'published');

-- 2. Authenticated users (Admin/Team) can read all articles
CREATE POLICY "Authenticated can read all articles"
ON public.blog_articles
FOR SELECT
TO authenticated
USING (true);

-- 3. Only admins can manage articles
-- Checking for admin role in user_roles table or JWT
CREATE POLICY "Admin can manage articles"
ON public.blog_articles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Grant access
GRANT ALL ON TABLE public.blog_articles TO postgres;
GRANT ALL ON TABLE public.blog_articles TO service_role;
GRANT SELECT ON TABLE public.blog_articles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.blog_articles TO authenticated;

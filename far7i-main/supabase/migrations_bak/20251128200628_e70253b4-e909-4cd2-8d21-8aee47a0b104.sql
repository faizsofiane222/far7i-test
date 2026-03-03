-- Add featured field to blog_articles if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'blog_articles' 
    AND column_name = 'featured'
  ) THEN
    ALTER TABLE public.blog_articles 
    ADD COLUMN featured boolean DEFAULT false;
  END IF;
END $$;

-- Create function to enforce max 3 featured articles
CREATE OR REPLACE FUNCTION public.check_max_featured_articles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  featured_count integer;
BEGIN
  -- Only check if trying to set featured to true
  IF NEW.featured = true THEN
    -- Count current featured articles (excluding the current one if update)
    SELECT COUNT(*) INTO featured_count
    FROM blog_articles
    WHERE featured = true AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
    
    -- If already 3 featured articles, prevent this operation
    IF featured_count >= 3 THEN
      RAISE EXCEPTION 'Maximum 3 articles can be featured at once. Please unfeature another article first.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for featured articles constraint
DROP TRIGGER IF EXISTS enforce_max_featured ON public.blog_articles;
CREATE TRIGGER enforce_max_featured
  BEFORE INSERT OR UPDATE ON public.blog_articles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_max_featured_articles();
-- Ensure public.users exists and has correct columns
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'guest'
);

-- Ensure providers references public.users for the join
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'providers_user_id_fkey_public'
  ) THEN
    ALTER TABLE public.providers 
    ADD CONSTRAINT providers_user_id_fkey_public 
    FOREIGN KEY (user_id) 
    REFERENCES public.users(id)
    ON DELETE SET NULL;
  END IF;
END
$$;

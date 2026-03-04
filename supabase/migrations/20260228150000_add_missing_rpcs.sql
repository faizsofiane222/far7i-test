-- get_unread_notifications_count
CREATE OR REPLACE FUNCTION public.get_unread_notifications_count()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  count integer;
BEGIN
  -- We assume there's a notifications table with user_id and read columns
  SELECT count(*)
  INTO count
  FROM public.notifications
  WHERE user_id = auth.uid() AND read = false;
  
  RETURN coalesce(count, 0);
EXCEPTION
  WHEN undefined_table THEN
    RETURN 0;
END;
$$;

-- get_unread_messages_count
CREATE OR REPLACE FUNCTION public.get_unread_messages_count()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  count integer;
  prov_id uuid;
BEGIN
  -- Get provider id if exists
  SELECT id INTO prov_id FROM public.providers WHERE user_id = auth.uid() LIMIT 1;

  -- We assume there's a messages table with receiver_id and read columns
  SELECT count(*)
  INTO count
  FROM public.messages
  WHERE (receiver_id = auth.uid() OR (prov_id IS NOT NULL AND receiver_id = prov_id))
  AND read = false;
  
  RETURN coalesce(count, 0);
EXCEPTION
  WHEN undefined_table THEN
    RETURN 0;
END;
$$;

-- is_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_admin_var boolean;
BEGIN
  SELECT is_admin 
  INTO is_admin_var 
  FROM public.users 
  WHERE id = auth.uid();
  
  RETURN coalesce(is_admin_var, false);
EXCEPTION
  WHEN undefined_table THEN
    -- Fallback strategy if users table or is_admin column is different
    -- Might be in profiles table
    BEGIN
      SELECT is_admin 
      INTO is_admin_var 
      FROM public.profiles 
      WHERE id = auth.uid();
      RETURN coalesce(is_admin_var, false);
    EXCEPTION
      WHEN others THEN
        RETURN false;
    END;
END;
$$;

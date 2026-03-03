-- Function to allow admins (or service role) to create users directly
-- This is necessary because Client SDK cannot create users without signing them in (logging out admin)

create or replace function create_partner_user(
  email text,
  password text,
  full_name text
) returns uuid
language plpgsql
security definer -- function runs with privileges of creator (postgres)
as $$
declare
  new_user_id uuid;
begin
  -- Validate
  if email is null or password is null then
    raise exception 'Email and Password are required';
  end if;

  -- Check if user exists
  select id into new_user_id from auth.users where auth.users.email = create_partner_user.email;
  if new_user_id is not null then
    raise exception 'User with this email already exists';
  end if;

  -- Generate ID
  new_user_id := gen_random_uuid();

  -- Insert into auth.users
  -- Minimal required fields for a working user
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    is_sso_user
  ) values (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    email,
    crypt(password, gen_salt('bf')),
    now(), -- Auto-confirm since Admin created it
    '{"provider": "email", "providers": ["email"]}',
    jsonb_build_object('full_name', full_name, 'display_name', full_name),
    now(),
    now(),
    false
  );

  -- Insert into public.users (profile) if triggers don't catch it immediately
  -- Usually handle_new_user trigger does this, but for safety/speed return:
  return new_user_id;
end;
$$;

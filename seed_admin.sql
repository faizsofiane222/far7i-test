-- Create an admin user if not exists (Auth)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role)
VALUES 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin@far7i.com', crypt('admin123', gen_salt('bf')), now(), 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- Create the user profile
INSERT INTO public.users (id, email, full_name, role)
VALUES 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin@far7i.com', 'Super Admin', 'admin')
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- Insert a Shadow Profile (Guest)
INSERT INTO public.providers (
  commercial_name, 
  user_id, 
  validation_status, 
  provider_type, 
  category, 
  wilaya, 
  contact_phone
)
VALUES 
  ('Prestataire Invité Test', NULL, 'approved', 'individual', 'Photographie', 'Alger', '0550123456');

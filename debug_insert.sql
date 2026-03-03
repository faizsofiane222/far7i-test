INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'debug_test@farhi.dz',
    'randompass',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"provider","businessName":"Dev Test","partner_type":"agency","phone":"0555555555","social_link":"https://farhi.dz","wilaya":"22019a89-2224-43cb-b003-87f5d475ce3b"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
);

-- Local development only (loaded by `supabase db reset` against the Dockerized
-- local stack). Never runs against production - db push does not apply seed.sql.
--
-- Creates a ready-to-use test account so contributors don't need Google OAuth
-- credentials or access to the production database to log in and try the app.
--
--   email:    test@abhyas.dev
--   password: TestPassword123!

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values (
  '00000000-0000-0000-0000-000000000000',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'authenticated',
  'authenticated',
  'test@abhyas.dev',
  crypt('TestPassword123!', gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Test User"}',
  false, '', '', '', ''
)
on conflict (id) do nothing;

insert into auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
) values (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  '{"sub":"a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11","email":"test@abhyas.dev"}',
  'email',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  now(), now(), now()
)
on conflict (provider, provider_id) do nothing;

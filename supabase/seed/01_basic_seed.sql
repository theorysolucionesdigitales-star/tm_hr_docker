-- =============================================
-- SEEDER BASICO: Informacion del sistema + Admin
-- =============================================
-- Crea un usuario administrador inicial.
--
-- Para ejecutar:
--   psql -h <SUPABASE_DB_HOST> -U postgres -d postgres -f supabase/seed/01_basic_seed.sql
-- =============================================

-- 1. Crear usuario administrador en auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'admin@tailormade.cl',
  crypt('Admin2026!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"display_name":"Administrador TM"}',
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- 2. Crear identidad (requerido por Supabase Auth para login)
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  '{"sub":"a0000000-0000-0000-0000-000000000001","email":"admin@tailormade.cl"}',
  'email',
  'a0000000-0000-0000-0000-000000000001',
  now(),
  now(),
  now()
) ON CONFLICT (provider_id, provider) DO NOTHING;

-- 3. Perfil y rol admin
INSERT INTO public.profiles (user_id, display_name)
VALUES ('a0000000-0000-0000-0000-000000000001', 'Administrador TM')
ON CONFLICT (user_id) DO NOTHING;

-- Borrar cualquier rol que el trigger handle_new_user le haya asignado por defecto
DELETE FROM public.user_roles WHERE user_id = 'a0000000-0000-0000-0000-000000000001';

INSERT INTO public.user_roles (user_id, role)
VALUES ('a0000000-0000-0000-0000-000000000001', 'admin');

-- =============================================
-- FIN DEL SEEDER BASICO
-- =============================================
-- Credenciales del admin:
--   Email:    admin@tailormade.cl
--   Password: Admin2026!
-- =============================================

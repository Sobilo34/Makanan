-- Fix Admin Credentials Migration
-- Ensures the admin user exists with correct password hash and role metadata

DO $$
DECLARE
  admin_id UUID;
BEGIN
  -- Check if admin user already exists
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@makanan.app' LIMIT 1;

  IF admin_id IS NOT NULL THEN
    -- Update existing admin user: reset password hash and ensure role metadata is correct
    UPDATE auth.users
    SET
      encrypted_password = crypt('admin1234', gen_salt('bf', 10)),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      updated_at = now(),
      raw_user_meta_data = jsonb_build_object('full_name', 'Makanan Admin', 'role', 'admin'),
      raw_app_meta_data = jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[], 'role', 'admin')
    WHERE id = admin_id;

    RAISE NOTICE 'Admin user updated successfully with id: %', admin_id;
  ELSE
    -- Create admin user from scratch
    admin_id := gen_random_uuid();

    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
      is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
      recovery_token, recovery_sent_at, email_change_token_new, email_change,
      email_change_sent_at, email_change_token_current, email_change_confirm_status,
      reauthentication_token, reauthentication_sent_at, phone, phone_change,
      phone_change_token, phone_change_sent_at
    ) VALUES (
      admin_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'admin@makanan.app',
      crypt('admin1234', gen_salt('bf', 10)),
      now(), now(), now(),
      jsonb_build_object('full_name', 'Makanan Admin', 'role', 'admin'),
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[], 'role', 'admin'),
      false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
    );

    RAISE NOTICE 'Admin user created successfully with id: %', admin_id;
  END IF;

  -- Ensure user_profile exists for admin
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (admin_id, 'admin@makanan.app', 'Makanan Admin', 'admin')
  ON CONFLICT (id) DO UPDATE
    SET role = 'admin',
        full_name = 'Makanan Admin';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Admin credentials fix failed: %', SQLERRM;
END $$;

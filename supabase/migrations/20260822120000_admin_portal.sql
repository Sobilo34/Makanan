-- Admin Portal Migration
-- Adds admin role support and RLS policies for admin access to all tables

-- 1. Add status/rating columns to partners if not exist
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS meals_available INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS meals_redeemed INTEGER DEFAULT 0;

-- 2. Helper function: check if current user is admin (uses auth metadata to avoid recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND (
      raw_user_meta_data->>'role' = 'admin'
      OR raw_app_meta_data->>'role' = 'admin'
    )
  )
$$;

-- 3. RLS: Admin full access to user_profiles
DROP POLICY IF EXISTS "admin_full_access_user_profiles" ON public.user_profiles;
CREATE POLICY "admin_full_access_user_profiles"
ON public.user_profiles
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 4. RLS: Admin full access to meal_plans
DROP POLICY IF EXISTS "admin_full_access_meal_plans" ON public.meal_plans;
CREATE POLICY "admin_full_access_meal_plans"
ON public.meal_plans
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 5. RLS: Admin full access to partners
DROP POLICY IF EXISTS "admin_full_access_partners" ON public.partners;
CREATE POLICY "admin_full_access_partners"
ON public.partners
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 6. RLS: Admin full access to subscriptions
DROP POLICY IF EXISTS "admin_full_access_subscriptions" ON public.subscriptions;
CREATE POLICY "admin_full_access_subscriptions"
ON public.subscriptions
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 7. RLS: Admin full access to redemptions
DROP POLICY IF EXISTS "admin_full_access_redemptions" ON public.redemptions;
CREATE POLICY "admin_full_access_redemptions"
ON public.redemptions
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 8. RLS: Admin full access to partner_applications
DROP POLICY IF EXISTS "admin_full_access_partner_applications" ON public.partner_applications;
CREATE POLICY "admin_full_access_partner_applications"
ON public.partner_applications
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 9. Seed admin user
DO $$
DECLARE
  admin_uuid UUID := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
    is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
    recovery_token, recovery_sent_at, email_change_token_new, email_change,
    email_change_sent_at, email_change_token_current, email_change_confirm_status,
    reauthentication_token, reauthentication_sent_at, phone, phone_change,
    phone_change_token, phone_change_sent_at
  ) VALUES (
    admin_uuid,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@makanan.app',
    crypt('admin1234', gen_salt('bf', 10)),
    now(), now(), now(),
    jsonb_build_object('full_name', 'Makanan Admin', 'role', 'admin'),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[], 'role', 'admin'),
    false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
  )
  ON CONFLICT (email) DO UPDATE
    SET raw_user_meta_data = jsonb_build_object('full_name', 'Makanan Admin', 'role', 'admin'),
        raw_app_meta_data = jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[], 'role', 'admin');

  -- Insert user_profile for admin if not exists
  INSERT INTO public.user_profiles (id, email, full_name, role)
  SELECT admin_uuid, 'admin@makanan.app', 'Makanan Admin', 'admin'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_profiles WHERE email = 'admin@makanan.app'
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Admin seed failed: %', SQLERRM;
END $$;

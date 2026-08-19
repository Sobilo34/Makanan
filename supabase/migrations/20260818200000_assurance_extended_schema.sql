-- ============================================================
-- Assurance Extended Schema — Feedback, Support, Admin, Partner
-- ============================================================

-- 1. Add role column to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';

-- 2. TYPES
DROP TYPE IF EXISTS public.feedback_rating CASCADE;
CREATE TYPE public.feedback_rating AS ENUM ('1','2','3','4','5');

DROP TYPE IF EXISTS public.ticket_status CASCADE;
CREATE TYPE public.ticket_status AS ENUM ('open','in_progress','resolved','closed');

DROP TYPE IF EXISTS public.ticket_category CASCADE;
CREATE TYPE public.ticket_category AS ENUM ('wrong_charge','meal_quality','missing_credit','partner_issue','other');

-- 3. NEW TABLES

-- Feedback
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  redemption_id UUID REFERENCES public.redemptions(id) ON DELETE SET NULL,
  meal_id UUID REFERENCES public.meals(id) ON DELETE SET NULL,
  partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
  rating public.feedback_rating NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Support tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  redemption_id UUID REFERENCES public.redemptions(id) ON DELETE SET NULL,
  category public.ticket_category NOT NULL DEFAULT 'other',
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status public.ticket_status DEFAULT 'open',
  admin_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Settlement records (admin-managed)
CREATE TABLE IF NOT EXISTS public.settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  total_redemptions INTEGER DEFAULT 0,
  total_amount_myr NUMERIC(10,2) DEFAULT 0,
  settlement_rate_myr NUMERIC(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. INDEXES
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_meal_id ON public.feedback(meal_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_settlements_partner_id ON public.settlements(partner_id);

-- 5. FUNCTIONS

-- Check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
  SELECT 1 FROM public.user_profiles
  WHERE id = auth.uid() AND role = 'admin'
)
$$;

-- Check if user is partner staff
CREATE OR REPLACE FUNCTION public.is_partner_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
SELECT EXISTS (
  SELECT 1 FROM public.user_profiles
  WHERE id = auth.uid() AND role IN ('partner', 'admin')
)
$$;

-- 6. ENABLE RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;

-- 7. RLS POLICIES

-- feedback: students manage own, admins see all
DROP POLICY IF EXISTS "users_manage_own_feedback" ON public.feedback;
CREATE POLICY "users_manage_own_feedback"
ON public.feedback FOR ALL TO authenticated
USING (user_id = auth.uid() OR public.is_admin())
WITH CHECK (user_id = auth.uid());

-- support_tickets: students manage own, admins see all
DROP POLICY IF EXISTS "users_manage_own_support_tickets" ON public.support_tickets;
CREATE POLICY "users_manage_own_support_tickets"
ON public.support_tickets FOR ALL TO authenticated
USING (user_id = auth.uid() OR public.is_admin())
WITH CHECK (user_id = auth.uid());

-- settlements: admin only
DROP POLICY IF EXISTS "admin_manage_settlements" ON public.settlements;
CREATE POLICY "admin_manage_settlements"
ON public.settlements FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Admin can read all user_profiles
DROP POLICY IF EXISTS "admin_read_all_user_profiles" ON public.user_profiles;
CREATE POLICY "admin_read_all_user_profiles"
ON public.user_profiles FOR SELECT TO authenticated
USING (id = auth.uid() OR public.is_admin());

-- Admin can read all subscriptions
DROP POLICY IF EXISTS "admin_read_all_subscriptions" ON public.subscriptions;
CREATE POLICY "admin_read_all_subscriptions"
ON public.subscriptions FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

-- Admin can update subscriptions (refunds/adjustments)
DROP POLICY IF EXISTS "admin_update_subscriptions" ON public.subscriptions;
CREATE POLICY "admin_update_subscriptions"
ON public.subscriptions FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR public.is_admin())
WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- Admin can read all redemptions; partner staff can read redemptions for their partner
DROP POLICY IF EXISTS "admin_partner_read_redemptions" ON public.redemptions;
CREATE POLICY "admin_partner_read_redemptions"
ON public.redemptions FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_admin() OR public.is_partner_staff());

-- Admin can update redemptions (refunds)
DROP POLICY IF EXISTS "admin_update_redemptions" ON public.redemptions;
CREATE POLICY "admin_update_redemptions"
ON public.redemptions FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR public.is_admin())
WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- Admin can insert wallet transactions (adjustments)
DROP POLICY IF EXISTS "admin_insert_wallet" ON public.wallet_transactions;
CREATE POLICY "admin_insert_wallet"
ON public.wallet_transactions FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- Admin can read all wallet transactions
DROP POLICY IF EXISTS "admin_read_all_wallet" ON public.wallet_transactions;
CREATE POLICY "admin_read_all_wallet"
ON public.wallet_transactions FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

-- Admin can manage meal_plans, partners, meals
DROP POLICY IF EXISTS "admin_manage_meal_plans" ON public.meal_plans;
CREATE POLICY "admin_manage_meal_plans"
ON public.meal_plans FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_manage_partners" ON public.partners;
CREATE POLICY "admin_manage_partners"
ON public.partners FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_manage_meals" ON public.meals;
CREATE POLICY "admin_manage_meals"
ON public.meals FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 8. SEED ADMIN USER
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
    admin_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'admin@assurance.app', crypt('admin1234', gen_salt('bf', 10)), now(), now(), now(),
    jsonb_build_object('full_name', 'Assurance Admin', 'role', 'admin'),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
    false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
  ) ON CONFLICT (id) DO NOTHING;

  -- Set role to admin in user_profiles (trigger creates the row, then we update)
  UPDATE public.user_profiles SET role = 'admin' WHERE email = 'admin@assurance.app';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Admin seed failed: %', SQLERRM;
END $$;

-- ============================================================
-- MAKANAN: End-to-End Real-Time Migration
-- Adds payments table, helper RPCs, fixes RLS, enables realtime
-- ============================================================

-- 1. PAYMENTS TABLE (tracks subscription purchase transactions)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  meal_plan_id UUID REFERENCES public.meal_plans(id) ON DELETE SET NULL,
  amount_myr NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'online_banking',
  status TEXT NOT NULL DEFAULT 'completed',
  reference_code TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON public.payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_manage_own_payments" ON public.payments;
CREATE POLICY "users_manage_own_payments"
ON public.payments FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "admin_full_access_payments" ON public.payments;
CREATE POLICY "admin_full_access_payments"
ON public.payments FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
    AND (au.raw_user_meta_data->>'role' = 'admin' OR au.raw_app_meta_data->>'role' = 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
    AND (au.raw_user_meta_data->>'role' = 'admin' OR au.raw_app_meta_data->>'role' = 'admin')
  )
);

-- 2. FIX RLS ON REDEMPTIONS: Partners need to read/update redemptions for their partner_id
-- Students need to insert redemptions and read their own
-- Admin needs full access

DROP POLICY IF EXISTS "users_manage_own_redemptions" ON public.redemptions;
DROP POLICY IF EXISTS "partners_read_own_redemptions" ON public.redemptions;
DROP POLICY IF EXISTS "partners_update_own_redemptions" ON public.redemptions;
DROP POLICY IF EXISTS "admin_full_access_redemptions" ON public.redemptions;
DROP POLICY IF EXISTS "students_insert_redemptions" ON public.redemptions;
DROP POLICY IF EXISTS "students_read_own_redemptions" ON public.redemptions;

-- Students: insert their own redemptions
CREATE POLICY "students_insert_redemptions"
ON public.redemptions FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Students: read their own redemptions
CREATE POLICY "students_read_own_redemptions"
ON public.redemptions FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Partners: read redemptions for their partner
CREATE POLICY "partners_read_own_redemptions"
ON public.redemptions FOR SELECT TO authenticated
USING (
  partner_id IN (
    SELECT id FROM public.partners WHERE user_id = auth.uid()
  )
  OR user_id = auth.uid()
);

-- Partners: update redemptions (confirm/reject) for their partner
CREATE POLICY "partners_update_own_redemptions"
ON public.redemptions FOR UPDATE TO authenticated
USING (
  partner_id IN (
    SELECT id FROM public.partners WHERE user_id = auth.uid()
  )
  OR user_id = auth.uid()
)
WITH CHECK (
  partner_id IN (
    SELECT id FROM public.partners WHERE user_id = auth.uid()
  )
  OR user_id = auth.uid()
);

-- Admin: full access
CREATE POLICY "admin_full_access_redemptions"
ON public.redemptions FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
    AND (au.raw_user_meta_data->>'role' = 'admin' OR au.raw_app_meta_data->>'role' = 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
    AND (au.raw_user_meta_data->>'role' = 'admin' OR au.raw_app_meta_data->>'role' = 'admin')
  )
);

-- 3. FIX RLS ON SUBSCRIPTIONS: Admin needs full access
DROP POLICY IF EXISTS "admin_full_access_subscriptions" ON public.subscriptions;
CREATE POLICY "admin_full_access_subscriptions"
ON public.subscriptions FOR ALL TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
    AND (au.raw_user_meta_data->>'role' = 'admin' OR au.raw_app_meta_data->>'role' = 'admin')
  )
)
WITH CHECK (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
    AND (au.raw_user_meta_data->>'role' = 'admin' OR au.raw_app_meta_data->>'role' = 'admin')
  )
);

-- 4. FIX RLS ON WALLET_TRANSACTIONS: Admin needs read access
DROP POLICY IF EXISTS "users_manage_own_wallet_transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "admin_read_wallet_transactions" ON public.wallet_transactions;

CREATE POLICY "users_manage_own_wallet_transactions"
ON public.wallet_transactions FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "admin_read_wallet_transactions"
ON public.wallet_transactions FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
    AND (au.raw_user_meta_data->>'role' = 'admin' OR au.raw_app_meta_data->>'role' = 'admin')
  )
);

-- 5. FIX RLS ON PARTNERS: Partners can update their own record
DROP POLICY IF EXISTS "partners_read_all" ON public.partners;
DROP POLICY IF EXISTS "partners_update_own" ON public.partners;
DROP POLICY IF EXISTS "admin_full_access_partners" ON public.partners;

CREATE POLICY "partners_read_all"
ON public.partners FOR SELECT TO authenticated
USING (true);

CREATE POLICY "partners_update_own"
ON public.partners FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "admin_full_access_partners"
ON public.partners FOR ALL TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
    AND (au.raw_user_meta_data->>'role' = 'admin' OR au.raw_app_meta_data->>'role' = 'admin')
  )
)
WITH CHECK (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
    AND (au.raw_user_meta_data->>'role' = 'admin' OR au.raw_app_meta_data->>'role' = 'admin')
  )
);

-- 6. FIX RLS ON USER_PROFILES: Admin needs read access to all
DROP POLICY IF EXISTS "users_manage_own_user_profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "admin_read_all_user_profiles" ON public.user_profiles;

CREATE POLICY "users_manage_own_user_profiles"
ON public.user_profiles FOR ALL TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "admin_read_all_user_profiles"
ON public.user_profiles FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
    AND (au.raw_user_meta_data->>'role' = 'admin' OR au.raw_app_meta_data->>'role' = 'admin')
  )
);

-- 7. FIX RLS ON MEALS: Public read, partner/admin write
DROP POLICY IF EXISTS "meals_public_read" ON public.meals;
DROP POLICY IF EXISTS "partners_manage_own_meals" ON public.meals;
DROP POLICY IF EXISTS "admin_full_access_meals" ON public.meals;

CREATE POLICY "meals_public_read"
ON public.meals FOR SELECT TO authenticated
USING (true);

CREATE POLICY "partners_manage_own_meals"
ON public.meals FOR ALL TO authenticated
USING (
  partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid())
)
WITH CHECK (
  partner_id IN (SELECT id FROM public.partners WHERE user_id = auth.uid())
);

CREATE POLICY "admin_full_access_meals"
ON public.meals FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
    AND (au.raw_user_meta_data->>'role' = 'admin' OR au.raw_app_meta_data->>'role' = 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
    AND (au.raw_user_meta_data->>'role' = 'admin' OR au.raw_app_meta_data->>'role' = 'admin')
  )
);

-- 8. FIX RLS ON MEAL_PLANS: Public read
DROP POLICY IF EXISTS "meal_plans_public_read" ON public.meal_plans;
DROP POLICY IF EXISTS "admin_full_access_meal_plans" ON public.meal_plans;

CREATE POLICY "meal_plans_public_read"
ON public.meal_plans FOR SELECT TO authenticated
USING (true);

CREATE POLICY "admin_full_access_meal_plans"
ON public.meal_plans FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
    AND (au.raw_user_meta_data->>'role' = 'admin' OR au.raw_app_meta_data->>'role' = 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users au
    WHERE au.id = auth.uid()
    AND (au.raw_user_meta_data->>'role' = 'admin' OR au.raw_app_meta_data->>'role' = 'admin')
  )
);

-- 9. HELPER FUNCTION: Increment redemption count on meal
CREATE OR REPLACE FUNCTION public.increment_redemption_count(meal_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.meals
  SET redemption_count = COALESCE(redemption_count, 0) + 1
  WHERE id = meal_id_param;
END;
$$;

-- 10. HELPER FUNCTION: Confirm redemption atomically (partner confirms)
CREATE OR REPLACE FUNCTION public.confirm_redemption(
  redemption_id_param UUID,
  partner_id_param UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_redemption RECORD;
  v_result JSONB;
BEGIN
  -- Get redemption
  SELECT * INTO v_redemption
  FROM public.redemptions
  WHERE id = redemption_id_param
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Redemption not found');
  END IF;

  IF v_redemption.status = 'confirmed' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already confirmed');
  END IF;

  -- Update redemption status and set partner
  UPDATE public.redemptions
  SET status = 'confirmed',
      partner_id = partner_id_param,
      redeemed_at = CURRENT_TIMESTAMP
  WHERE id = redemption_id_param;

  -- Increment meal redemption count
  UPDATE public.meals
  SET redemption_count = COALESCE(redemption_count, 0) + 1
  WHERE id = v_redemption.meal_id;

  -- Update partner meals_redeemed counter
  UPDATE public.partners
  SET meals_redeemed = COALESCE(meals_redeemed, 0) + 1
  WHERE id = partner_id_param;

  RETURN jsonb_build_object('success', true, 'redemption_id', redemption_id_param);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 11. HELPER FUNCTION: Process subscription payment atomically
CREATE OR REPLACE FUNCTION public.process_subscription_payment(
  p_user_id UUID,
  p_meal_plan_id UUID,
  p_credits INTEGER,
  p_amount_myr NUMERIC,
  p_payment_method TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sub_id UUID;
  v_payment_id UUID;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Cancel existing active subscriptions
  UPDATE public.subscriptions
  SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
  WHERE user_id = p_user_id AND status = 'active';

  -- Set expiry 30 days from now
  v_expires_at := CURRENT_TIMESTAMP + INTERVAL '30 days';

  -- Create new subscription
  INSERT INTO public.subscriptions (
    user_id, meal_plan_id, status, credits_total, credits_used,
    starts_at, expires_at, created_at, updated_at
  ) VALUES (
    p_user_id, p_meal_plan_id, 'active', p_credits, 0,
    CURRENT_TIMESTAMP, v_expires_at, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  )
  RETURNING id INTO v_sub_id;

  -- Record wallet transaction (credit top-up)
  INSERT INTO public.wallet_transactions (
    user_id, subscription_id, description, credits_delta, balance_after, created_at
  ) VALUES (
    p_user_id, v_sub_id,
    'Meal plan purchased — ' || p_credits || ' credits issued',
    p_credits, p_credits, CURRENT_TIMESTAMP
  );

  -- Record payment
  INSERT INTO public.payments (
    user_id, subscription_id, meal_plan_id, amount_myr,
    payment_method, status, reference_code, created_at, updated_at
  ) VALUES (
    p_user_id, v_sub_id, p_meal_plan_id, p_amount_myr,
    p_payment_method, 'completed',
    'MKN-PAY-' || UPPER(SUBSTRING(v_sub_id::TEXT, 1, 8)),
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  )
  RETURNING id INTO v_payment_id;

  RETURN jsonb_build_object(
    'success', true,
    'subscription_id', v_sub_id,
    'payment_id', v_payment_id
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 12. HELPER FUNCTION: Redeem meal atomically (student redeems)
CREATE OR REPLACE FUNCTION public.redeem_meal(
  p_user_id UUID,
  p_subscription_id UUID,
  p_meal_id UUID,
  p_partner_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sub RECORD;
  v_redemption_id UUID;
  v_qr_code TEXT;
  v_credits_remaining INTEGER;
BEGIN
  -- Get and lock subscription
  SELECT * INTO v_sub
  FROM public.subscriptions
  WHERE id = p_subscription_id AND user_id = p_user_id AND status = 'active'
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'No active subscription found');
  END IF;

  v_credits_remaining := v_sub.credits_total - v_sub.credits_used;

  IF v_credits_remaining <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'No credits remaining');
  END IF;

  -- Generate QR code
  v_qr_code := 'MKN-' || UPPER(SUBSTRING(p_meal_id::TEXT, 1, 6)) || '-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 8));

  -- Insert redemption with pending status (partner confirms later)
  INSERT INTO public.redemptions (
    user_id, subscription_id, meal_id, partner_id, status, qr_code,
    redeemed_at, created_at
  ) VALUES (
    p_user_id, p_subscription_id, p_meal_id, p_partner_id, 'pending', v_qr_code,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  )
  RETURNING id INTO v_redemption_id;

  -- Deduct credit from subscription
  UPDATE public.subscriptions
  SET credits_used = credits_used + 1, updated_at = CURRENT_TIMESTAMP
  WHERE id = p_subscription_id;

  -- Record wallet transaction (debit)
  INSERT INTO public.wallet_transactions (
    user_id, subscription_id, redemption_id, description, credits_delta, balance_after, created_at
  ) VALUES (
    p_user_id, p_subscription_id, v_redemption_id,
    'Meal redeemed',
    -1,
    v_credits_remaining - 1,
    CURRENT_TIMESTAMP
  );

  RETURN jsonb_build_object(
    'success', true,
    'redemption_id', v_redemption_id,
    'qr_code', v_qr_code,
    'credits_remaining', v_credits_remaining - 1
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 13. ENABLE REALTIME on key tables (via publication)
DO $$
BEGIN
  -- Add tables to supabase_realtime publication if not already there
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.redemptions;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_transactions;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.partners;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.meals;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

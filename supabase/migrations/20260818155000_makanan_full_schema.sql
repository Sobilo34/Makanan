-- ============================================================
-- Makanan / Assurance Student Meal Network — Full Schema
-- ============================================================

-- 1. TYPES
DROP TYPE IF EXISTS public.meal_tier CASCADE;
CREATE TYPE public.meal_tier AS ENUM ('value', 'standard', 'premium');

DROP TYPE IF EXISTS public.meal_category CASCADE;
CREATE TYPE public.meal_category AS ENUM ('breakfast', 'lunch', 'dinner');

DROP TYPE IF EXISTS public.meal_availability CASCADE;
CREATE TYPE public.meal_availability AS ENUM ('available', 'low_stock', 'unavailable');

DROP TYPE IF EXISTS public.redemption_status CASCADE;
CREATE TYPE public.redemption_status AS ENUM ('pending', 'confirmed', 'cancelled', 'refunded');

DROP TYPE IF EXISTS public.subscription_status CASCADE;
CREATE TYPE public.subscription_status AS ENUM ('active', 'expired', 'cancelled', 'pending');

-- 2. CORE TABLES

-- User profiles (auto-created by trigger)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  student_id TEXT,
  avatar_url TEXT,
  phone TEXT,
  university TEXT DEFAULT 'Albukhary International University',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Meal plan packages catalog
CREATE TABLE IF NOT EXISTS public.meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tier public.meal_tier NOT NULL,
  price_myr NUMERIC(10,2) NOT NULL,
  credits INTEGER NOT NULL,
  effective_rate NUMERIC(10,2) GENERATED ALWAYS AS (price_myr / credits) STORED,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Partners (cafeterias)
CREATE TABLE IF NOT EXISTS public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Meals catalog
CREATE TABLE IF NOT EXISTS public.meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  category public.meal_category NOT NULL,
  tier public.meal_tier NOT NULL,
  calories INTEGER,
  prep_time_minutes INTEGER,
  rating NUMERIC(3,1) DEFAULT 4.5,
  image_url TEXT,
  availability public.meal_availability DEFAULT 'available',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Student subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  meal_plan_id UUID NOT NULL REFERENCES public.meal_plans(id),
  status public.subscription_status DEFAULT 'active',
  credits_total INTEGER NOT NULL,
  credits_used INTEGER DEFAULT 0,
  starts_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Redemptions
CREATE TABLE IF NOT EXISTS public.redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id),
  meal_id UUID NOT NULL REFERENCES public.meals(id),
  partner_id UUID REFERENCES public.partners(id),
  status public.redemption_status DEFAULT 'confirmed',
  qr_code TEXT,
  redeemed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Wallet transactions
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id),
  redemption_id UUID REFERENCES public.redemptions(id),
  description TEXT NOT NULL,
  credits_delta INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_redemptions_user_id ON public.redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_redeemed_at ON public.redemptions(redeemed_at);
CREATE INDEX IF NOT EXISTS idx_meals_category ON public.meals(category);
CREATE INDEX IF NOT EXISTS idx_meals_tier ON public.meals(tier);
CREATE INDEX IF NOT EXISTS idx_wallet_user_id ON public.wallet_transactions(user_id);

-- 4. FUNCTIONS

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- Get active subscription for user
CREATE OR REPLACE FUNCTION public.get_active_subscription(p_user_id UUID)
RETURNS TABLE(
  sub_id UUID,
  plan_name TEXT,
  tier TEXT,
  credits_total INTEGER,
  credits_used INTEGER,
  credits_remaining INTEGER,
  expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    mp.name,
    mp.tier::TEXT,
    s.credits_total,
    s.credits_used,
    (s.credits_total - s.credits_used),
    s.expires_at
  FROM public.subscriptions s
  JOIN public.meal_plans mp ON s.meal_plan_id = mp.id
  WHERE s.user_id = p_user_id
    AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$;

-- 5. ENABLE RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- 6. RLS POLICIES

-- user_profiles
DROP POLICY IF EXISTS "users_manage_own_user_profiles" ON public.user_profiles;
CREATE POLICY "users_manage_own_user_profiles"
ON public.user_profiles FOR ALL TO authenticated
USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- meal_plans (public read)
DROP POLICY IF EXISTS "public_read_meal_plans" ON public.meal_plans;
CREATE POLICY "public_read_meal_plans"
ON public.meal_plans FOR SELECT TO public USING (true);

-- partners (public read)
DROP POLICY IF EXISTS "public_read_partners" ON public.partners;
CREATE POLICY "public_read_partners"
ON public.partners FOR SELECT TO public USING (true);

-- meals (public read)
DROP POLICY IF EXISTS "public_read_meals" ON public.meals;
CREATE POLICY "public_read_meals"
ON public.meals FOR SELECT TO public USING (true);

-- subscriptions
DROP POLICY IF EXISTS "users_manage_own_subscriptions" ON public.subscriptions;
CREATE POLICY "users_manage_own_subscriptions"
ON public.subscriptions FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- redemptions
DROP POLICY IF EXISTS "users_manage_own_redemptions" ON public.redemptions;
CREATE POLICY "users_manage_own_redemptions"
ON public.redemptions FOR ALL TO authenticated
USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- wallet_transactions
DROP POLICY IF EXISTS "users_view_own_wallet" ON public.wallet_transactions;
CREATE POLICY "users_view_own_wallet"
ON public.wallet_transactions FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "users_insert_own_wallet" ON public.wallet_transactions;
CREATE POLICY "users_insert_own_wallet"
ON public.wallet_transactions FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- 7. TRIGGERS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 8. SEED DATA

-- Meal plans
INSERT INTO public.meal_plans (id, name, tier, price_myr, credits, description) VALUES
  (gen_random_uuid(), 'Value Regular', 'value', 250.00, 60, 'Affordable daily meals — 60 credits per month at RM4.17 per meal'),
  (gen_random_uuid(), 'Value Flex', 'value', 250.00, 40, 'Affordable meals with flexibility — 40 credits per month at RM6.25 per meal'),
  (gen_random_uuid(), 'Standard Regular', 'standard', 300.00, 60, 'Balanced quality and frequency — 60 credits per month at RM5.00 per meal'),
  (gen_random_uuid(), 'Standard Flex', 'standard', 300.00, 40, 'Better meals with flexibility — 40 credits per month at RM7.50 per meal'),
  (gen_random_uuid(), 'Premium Regular', 'premium', 400.00, 60, 'Premium meals every day — 60 credits per month at RM6.67 per meal'),
  (gen_random_uuid(), 'Premium Flex', 'premium', 400.00, 40, 'Top quality, fewer meals — 40 credits per month at RM10.00 per meal')
ON CONFLICT (id) DO NOTHING;

-- Partners
INSERT INTO public.partners (id, name, location, image_url) VALUES
  (gen_random_uuid(), 'School Cafeteria', 'AIU Main Building, Ground Floor', 'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=400'),
  (gen_random_uuid(), 'Mamak Stall', 'AIU Student Hub', 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400')
ON CONFLICT (id) DO NOTHING;

-- Meals
DO $$
DECLARE
  cafeteria_id UUID;
  mamak_id UUID;
BEGIN
  SELECT id INTO cafeteria_id FROM public.partners WHERE name = 'School Cafeteria' LIMIT 1;
  SELECT id INTO mamak_id FROM public.partners WHERE name = 'Mamak Stall' LIMIT 1;

  IF cafeteria_id IS NOT NULL THEN
    INSERT INTO public.meals (id, partner_id, name, description, category, tier, calories, prep_time_minutes, rating, image_url, availability) VALUES
      (gen_random_uuid(), cafeteria_id, 'Nasi Lemak', 'Fragrant coconut rice with sambal, anchovies, peanuts and boiled egg', 'breakfast', 'value', 520, 10, 4.7, 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600', 'available'),
      (gen_random_uuid(), cafeteria_id, 'Chicken Rice', 'Steamed chicken with fragrant rice and ginger sauce', 'lunch', 'standard', 480, 15, 4.6, 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600', 'available'),
      (gen_random_uuid(), cafeteria_id, 'Grilled Chicken Salad', 'Fresh greens with grilled chicken, egg and cherry tomatoes', 'lunch', 'premium', 420, 15, 4.7, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600', 'available'),
      (gen_random_uuid(), cafeteria_id, 'Mixed Curry Rice', 'Steamed rice with mixed vegetable curry and chicken', 'lunch', 'standard', 550, 10, 4.5, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600', 'low_stock'),
      (gen_random_uuid(), cafeteria_id, 'Fried Rice', 'Wok-fried rice with egg, vegetables and soy sauce', 'dinner', 'value', 460, 12, 4.4, 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600', 'available'),
      (gen_random_uuid(), cafeteria_id, 'Beef Rendang', 'Slow-cooked beef in rich coconut and spice gravy', 'dinner', 'premium', 620, 20, 4.8, 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=600', 'available')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  IF mamak_id IS NOT NULL THEN
    INSERT INTO public.meals (id, partner_id, name, description, category, tier, calories, prep_time_minutes, rating, image_url, availability) VALUES
      (gen_random_uuid(), mamak_id, 'Roti Canai', 'Flaky flatbread served with dhal and curry sauce', 'breakfast', 'value', 380, 8, 4.6, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600', 'available'),
      (gen_random_uuid(), mamak_id, 'Mee Goreng', 'Spicy stir-fried yellow noodles with egg and vegetables', 'lunch', 'value', 490, 12, 4.5, 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600', 'available'),
      (gen_random_uuid(), mamak_id, 'Spicy Noodles', 'Wok-fried noodles with egg, chilli and bean sprouts', 'dinner', 'standard', 510, 10, 4.8, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600', 'available')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Demo users
DO $$
DECLARE
  demo_uuid UUID := gen_random_uuid();
  std_plan_id UUID;
BEGIN
  -- Create demo auth user
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
    is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
    recovery_token, recovery_sent_at, email_change_token_new, email_change,
    email_change_sent_at, email_change_token_current, email_change_confirm_status,
    reauthentication_token, reauthentication_sent_at, phone, phone_change,
    phone_change_token, phone_change_sent_at
  ) VALUES (
    demo_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'demo@makanan.app', crypt('demo1234', gen_salt('bf', 10)), now(), now(), now(),
    jsonb_build_object('full_name', 'Ahmad Faiz', 'student_id', 'AIU2024001'),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
    false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null
  ) ON CONFLICT (id) DO NOTHING;

  -- Get standard plan
  SELECT id INTO std_plan_id FROM public.meal_plans WHERE name = 'Standard Regular' LIMIT 1;

  -- Create subscription for demo user (trigger creates user_profiles)
  IF std_plan_id IS NOT NULL THEN
    INSERT INTO public.subscriptions (id, user_id, meal_plan_id, status, credits_total, credits_used, starts_at, expires_at)
    VALUES (
      gen_random_uuid(), demo_uuid, std_plan_id, 'active', 60, 28,
      CURRENT_TIMESTAMP - INTERVAL '15 days',
      CURRENT_TIMESTAMP + INTERVAL '15 days'
    ) ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

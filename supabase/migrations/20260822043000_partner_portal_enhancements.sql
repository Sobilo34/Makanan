-- ============================================================
-- Partner Portal Enhancements Migration
-- ============================================================

-- 1. Add partner_user_id to partners table (link auth user to partner)
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS price_per_meal NUMERIC(10,2) DEFAULT 0;

-- 2. Add schedule_days and serving_quantity to meals table
ALTER TABLE public.meals
  ADD COLUMN IF NOT EXISTS schedule_days TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS serving_quantity INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS price_myr NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS redemption_count INTEGER DEFAULT 0;

-- 3. Add rejected status to redemption_status enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'rejected'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'redemption_status')
  ) THEN
    ALTER TYPE public.redemption_status ADD VALUE 'rejected';
  END IF;
END $$;

-- 4. Add coming_soon to meal_availability enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'coming_soon'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'meal_availability')
  ) THEN
    ALTER TYPE public.meal_availability ADD VALUE 'coming_soon';
  END IF;
END $$;

-- 5. RLS: Partners can read/update their own partner record
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'partners' AND policyname = 'Partners can view own record'
  ) THEN
    CREATE POLICY "Partners can view own record"
      ON public.partners FOR SELECT
      USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'partners' AND policyname = 'Partners can update own record'
  ) THEN
    CREATE POLICY "Partners can update own record"
      ON public.partners FOR UPDATE
      USING (user_id = auth.uid());
  END IF;
END $$;

-- 6. RLS: Partners can manage their own meals
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'meals' AND policyname = 'Partners can manage own meals'
  ) THEN
    CREATE POLICY "Partners can manage own meals"
      ON public.meals FOR ALL
      USING (
        partner_id IN (
          SELECT id FROM public.partners WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- 7. RLS: Partners can view redemptions for their meals
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'redemptions' AND policyname = 'Partners can view own redemptions'
  ) THEN
    CREATE POLICY "Partners can view own redemptions"
      ON public.redemptions FOR SELECT
      USING (
        partner_id IN (
          SELECT id FROM public.partners WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'redemptions' AND policyname = 'Partners can update own redemptions'
  ) THEN
    CREATE POLICY "Partners can update own redemptions"
      ON public.redemptions FOR UPDATE
      USING (
        partner_id IN (
          SELECT id FROM public.partners WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- 8. Allow partners to insert redemptions (for confirming)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'redemptions' AND policyname = 'Partners can insert redemptions'
  ) THEN
    CREATE POLICY "Partners can insert redemptions"
      ON public.redemptions FOR INSERT
      WITH CHECK (
        partner_id IN (
          SELECT id FROM public.partners WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

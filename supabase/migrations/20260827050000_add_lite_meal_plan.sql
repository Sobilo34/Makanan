-- Add Lite Plan: RM150 for 30 meals
-- This is a new entry-level plan, half of the Basic plan

DO $$
BEGIN
  -- Insert Lite Plan only if it does not already exist
  IF NOT EXISTS (
    SELECT 1 FROM public.meal_plans WHERE name = 'Lite Plan'
  ) THEN
    INSERT INTO public.meal_plans (id, name, tier, price_myr, credits, description, is_active)
    VALUES (
      gen_random_uuid(),
      'Lite Plan',
      'value',
      150.00,
      30,
      'Entry-level plan for occasional eaters — 30 credits per month at RM5.00 per meal',
      true
    );
    RAISE NOTICE 'Lite Plan inserted successfully.';
  ELSE
    RAISE NOTICE 'Lite Plan already exists, skipping.';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Failed to insert Lite Plan: %', SQLERRM;
END $$;

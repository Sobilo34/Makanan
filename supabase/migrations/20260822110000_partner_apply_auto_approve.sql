-- ============================================================
-- Partner Apply Auto-Approve: Allow new auth users to insert their own partner record
-- ============================================================

-- Allow authenticated users to insert a partners row where user_id = their own auth.uid()
DROP POLICY IF EXISTS "Partners can insert own record" ON public.partners;
CREATE POLICY "Partners can insert own record"
  ON public.partners FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

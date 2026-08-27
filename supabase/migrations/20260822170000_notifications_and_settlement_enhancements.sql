-- Notifications table for all three portals
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE,
  recipient_type TEXT NOT NULL DEFAULT 'student', -- 'student', 'partner', 'admin'
  type TEXT NOT NULL, -- 'subscription_confirmed', 'redemption_confirmed', 'settlement_paid', 'new_redemption', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_partner_id ON public.notifications(partner_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_type ON public.notifications(recipient_type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Add payout_requested_at to settlements if not exists
ALTER TABLE public.settlements
  ADD COLUMN IF NOT EXISTS payout_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_reference TEXT;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Students can read their own notifications
DROP POLICY IF EXISTS "students_read_own_notifications" ON public.notifications;
CREATE POLICY "students_read_own_notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Students can update (mark read) their own notifications
DROP POLICY IF EXISTS "students_update_own_notifications" ON public.notifications;
CREATE POLICY "students_update_own_notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Partners can read their own notifications
DROP POLICY IF EXISTS "partners_read_own_notifications" ON public.notifications;
CREATE POLICY "partners_read_own_notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (
  partner_id IN (
    SELECT id FROM public.partners WHERE user_id = auth.uid()
  )
);

-- Partners can update (mark read) their own notifications
DROP POLICY IF EXISTS "partners_update_own_notifications" ON public.notifications;
CREATE POLICY "partners_update_own_notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (
  partner_id IN (
    SELECT id FROM public.partners WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  partner_id IN (
    SELECT id FROM public.partners WHERE user_id = auth.uid()
  )
);

-- Admin can read all notifications
DROP POLICY IF EXISTS "admin_read_all_notifications" ON public.notifications;
CREATE POLICY "admin_read_all_notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (
  (auth.jwt() ->> 'role' = 'admin') OR
  (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR
  (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
);

-- Admin can insert notifications (for system-generated ones)
DROP POLICY IF EXISTS "admin_insert_notifications" ON public.notifications;
CREATE POLICY "admin_insert_notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- Admin can update all notifications
DROP POLICY IF EXISTS "admin_update_notifications" ON public.notifications;
CREATE POLICY "admin_update_notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Settlements: partners can read their own
DROP POLICY IF EXISTS "partners_read_own_settlements" ON public.settlements;
CREATE POLICY "partners_read_own_settlements"
ON public.settlements FOR SELECT
TO authenticated
USING (
  partner_id IN (
    SELECT id FROM public.partners WHERE user_id = auth.uid()
  )
);

-- Partners can update their own settlements (request payout)
DROP POLICY IF EXISTS "partners_update_own_settlements" ON public.settlements;
CREATE POLICY "partners_update_own_settlements"
ON public.settlements FOR UPDATE
TO authenticated
USING (
  partner_id IN (
    SELECT id FROM public.partners WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  partner_id IN (
    SELECT id FROM public.partners WHERE user_id = auth.uid()
  )
);

-- Admin can manage all settlements
DROP POLICY IF EXISTS "admin_manage_settlements" ON public.settlements;
CREATE POLICY "admin_manage_settlements"
ON public.settlements FOR ALL
TO authenticated
USING (
  (auth.jwt() ->> 'role' = 'admin') OR
  (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR
  (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
)
WITH CHECK (
  (auth.jwt() ->> 'role' = 'admin') OR
  (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') OR
  (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
);

-- Partners can insert settlements (request new settlement)
DROP POLICY IF EXISTS "partners_insert_settlements" ON public.settlements;
CREATE POLICY "partners_insert_settlements"
ON public.settlements FOR INSERT
TO authenticated
WITH CHECK (
  partner_id IN (
    SELECT id FROM public.partners WHERE user_id = auth.uid()
  )
);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

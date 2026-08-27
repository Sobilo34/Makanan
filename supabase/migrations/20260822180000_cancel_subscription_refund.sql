-- Migration: cancel_subscription_with_refund
-- Adds an atomic DB function to cancel an active subscription and credit remaining meals back to wallet_transactions.
-- Also adds RLS policies so students can update their own subscriptions (for cancellation).

-- 1. Create the atomic cancel + refund function
CREATE OR REPLACE FUNCTION public.cancel_subscription_with_refund(
  p_subscription_id UUID,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sub RECORD;
  v_credits_remaining INTEGER;
  v_balance_after INTEGER;
  v_last_balance INTEGER;
BEGIN
  -- Lock and fetch the subscription
  SELECT id, user_id, status, credits_total, credits_used
  INTO v_sub
  FROM public.subscriptions
  WHERE id = p_subscription_id
    AND user_id = p_user_id
    AND status = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'No active subscription found');
  END IF;

  v_credits_remaining := v_sub.credits_total - v_sub.credits_used;

  -- Get current wallet balance (sum of all credits_delta for this user)
  SELECT COALESCE(SUM(credits_delta), 0)
  INTO v_last_balance
  FROM public.wallet_transactions
  WHERE user_id = p_user_id;

  v_balance_after := v_last_balance + v_credits_remaining;

  -- Mark subscription as cancelled
  UPDATE public.subscriptions
  SET status = 'cancelled',
      updated_at = NOW()
  WHERE id = p_subscription_id;

  -- Insert wallet credit refund transaction (only if there are credits to refund)
  IF v_credits_remaining > 0 THEN
    INSERT INTO public.wallet_transactions (
      id,
      user_id,
      subscription_id,
      description,
      credits_delta,
      balance_after,
      created_at
    ) VALUES (
      gen_random_uuid(),
      p_user_id,
      p_subscription_id,
      'Subscription cancelled — ' || v_credits_remaining || ' meal credit(s) refunded',
      v_credits_remaining,
      v_balance_after,
      NOW()
    );
  END IF;

  -- Insert cancellation notification for the student
  INSERT INTO public.notifications (
    id,
    user_id,
    recipient_type,
    type,
    title,
    message,
    is_read,
    metadata,
    created_at
  ) VALUES (
    gen_random_uuid(),
    p_user_id,
    'student',
    'subscription_cancelled',
    'Subscription Cancelled',
    'Your subscription has been cancelled. ' ||
      CASE WHEN v_credits_remaining > 0
        THEN v_credits_remaining || ' unused meal credit(s) have been refunded to your wallet.'
        ELSE 'No unused credits to refund.'
      END,
    false,
    jsonb_build_object(
      'subscription_id', p_subscription_id,
      'credits_refunded', v_credits_remaining
    ),
    NOW()
  );

  -- Insert admin notification
  INSERT INTO public.notifications (
    id,
    user_id,
    recipient_type,
    type,
    title,
    message,
    is_read,
    metadata,
    created_at
  ) VALUES (
    gen_random_uuid(),
    NULL,
    'admin',
    'subscription_cancelled',
    'Student Subscription Cancelled',
    'A student has cancelled their active subscription. ' || v_credits_remaining || ' credit(s) were refunded.',
    false,
    jsonb_build_object(
      'subscription_id', p_subscription_id,
      'user_id', p_user_id,
      'credits_refunded', v_credits_remaining
    ),
    NOW()
  );

  RETURN jsonb_build_object(
    'success', true,
    'credits_refunded', v_credits_remaining,
    'balance_after', v_balance_after
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 2. Allow authenticated users to update their own subscriptions (needed for RLS on UPDATE)
DROP POLICY IF EXISTS "students_can_cancel_own_subscriptions" ON public.subscriptions;
CREATE POLICY "students_can_cancel_own_subscriptions"
ON public.subscriptions
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 3. Allow students to insert wallet_transactions for refunds (function is SECURITY DEFINER so this is belt-and-suspenders)
-- wallet_transactions already has RLS; the SECURITY DEFINER function bypasses it, so no extra policy needed.

-- 4. Ensure realtime is enabled on subscriptions and wallet_transactions (idempotent)
ALTER TABLE public.subscriptions REPLICA IDENTITY FULL;
ALTER TABLE public.wallet_transactions REPLICA IDENTITY FULL;

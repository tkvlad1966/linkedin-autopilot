-- ============================================================
-- 007_rpc_functions.sql
-- RPC helper functions called by the Chrome Extension
-- ============================================================

-- increment_daily_stat
-- Atomically increments a single counter column in daily_stats.
-- Creates the row for today if it doesn't exist yet.
--
-- Called by: extension/src/background/queue-processor.ts
-- Params:
--   p_user_id  — authenticated user's UUID (must match auth.uid())
--   p_date     — YYYY-MM-DD string
--   p_field    — column name to increment (connections_sent | messages_sent | etc.)

CREATE OR REPLACE FUNCTION public.increment_daily_stat(
  p_user_id uuid,
  p_date    date,
  p_field   text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Guard: only allowed column names (prevents SQL injection via p_field)
  IF p_field NOT IN (
    'connections_sent',
    'connections_accepted',
    'messages_sent',
    'replies_received',
    'posts_published',
    'profile_views'
  ) THEN
    RAISE EXCEPTION 'Invalid stat field: %', p_field;
  END IF;

  -- Guard: caller can only update their own stats
  IF p_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  INSERT INTO public.daily_stats (user_id, date)
  VALUES (p_user_id, p_date)
  ON CONFLICT (user_id, date) DO NOTHING;

  EXECUTE format(
    'UPDATE public.daily_stats SET %I = %I + 1 WHERE user_id = $1 AND date = $2',
    p_field, p_field
  ) USING p_user_id, p_date;
END;
$$;

-- Grant execute to authenticated users only
REVOKE ALL ON FUNCTION public.increment_daily_stat(uuid, date, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.increment_daily_stat(uuid, date, text) TO authenticated;

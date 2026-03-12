-- ============================================================
-- 006_analytics.sql
-- Daily aggregated stats per user
-- ============================================================

CREATE TABLE daily_stats (
  id                    uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid    NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date                  date    NOT NULL DEFAULT CURRENT_DATE,
  connections_sent      integer DEFAULT 0,
  connections_accepted  integer DEFAULT 0,
  messages_sent         integer DEFAULT 0,
  replies_received      integer DEFAULT 0,
  posts_published       integer DEFAULT 0,
  profile_views         integer DEFAULT 0,
  UNIQUE(user_id, date)
);

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own stats"
  ON daily_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users upsert own stats"
  ON daily_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own stats"
  ON daily_stats FOR UPDATE
  USING (auth.uid() = user_id);

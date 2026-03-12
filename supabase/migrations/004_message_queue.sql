-- ============================================================
-- 004_message_queue.sql
-- Queue of actions to be executed by the Chrome Extension
-- ============================================================

CREATE TABLE message_queue (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lead_id       uuid        REFERENCES leads(id) ON DELETE CASCADE,
  campaign_id   uuid        REFERENCES campaigns(id) ON DELETE SET NULL,
  step_id       uuid        REFERENCES sequence_steps(id) ON DELETE SET NULL,
  action        text        NOT NULL
                            CHECK (action IN (
                              'send_connection','send_message',
                              'send_followup','like_post','view_profile'
                            )),
  payload       jsonb       DEFAULT '{}',
  status        text        DEFAULT 'pending'
                            CHECK (status IN (
                              'pending','in_progress','done','failed','skipped'
                            )),
  scheduled_at  timestamptz DEFAULT now(),
  executed_at   timestamptz,
  error_message text,
  retry_count   integer     DEFAULT 0,
  created_at    timestamptz DEFAULT now()
);

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX message_queue_user_status_scheduled
  ON message_queue(user_id, status, scheduled_at);

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE message_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own queue"
  ON message_queue FOR ALL
  USING (auth.uid() = user_id);

-- ── Realtime ─────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE message_queue;

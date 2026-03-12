-- ============================================================
-- 002_campaigns.sql
-- Campaigns and sequence steps
-- ============================================================

CREATE TABLE campaigns (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name                 text        NOT NULL,
  status               text        DEFAULT 'draft'
                                   CHECK (status IN ('draft','active','paused','completed')),
  daily_limit          integer     DEFAULT 20,
  working_hours_start  time        DEFAULT '09:00',
  working_hours_end    time        DEFAULT '18:00',
  timezone             text        DEFAULT 'Europe/Lisbon',
  total_leads          integer     DEFAULT 0,
  leads_messaged       integer     DEFAULT 0,
  leads_replied        integer     DEFAULT 0,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

CREATE TABLE sequence_steps (
  id               uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id      uuid    NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  step_order       integer NOT NULL,
  type             text    NOT NULL
                           CHECK (type IN ('connect','message','followup','like','view_profile')),
  delay_days       integer DEFAULT 0,
  message_template text,
  created_at       timestamptz DEFAULT now()
);

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX campaigns_user_id_idx         ON campaigns(user_id);
CREATE INDEX sequence_steps_campaign_order ON sequence_steps(campaign_id, step_order);

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE campaigns      ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own campaigns"
  ON campaigns FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users manage own sequence steps"
  ON sequence_steps FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = sequence_steps.campaign_id
        AND campaigns.user_id = auth.uid()
    )
  );

-- ── updated_at triggers ──────────────────────────────────────
CREATE TRIGGER campaigns_set_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

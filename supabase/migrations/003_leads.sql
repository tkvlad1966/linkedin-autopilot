-- ============================================================
-- 003_leads.sql
-- Leads / prospects per campaign
-- ============================================================

CREATE TABLE leads (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id   uuid        REFERENCES campaigns(id) ON DELETE SET NULL,
  user_id       uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  linkedin_url  text        NOT NULL,
  linkedin_id   text,
  first_name    text,
  last_name     text,
  title         text,
  company       text,
  location      text,
  avatar_url    text,
  status        text        DEFAULT 'pending'
                            CHECK (status IN (
                              'pending','visiting','connected','messaged',
                              'replied','not_interested','done'
                            )),
  current_step  integer     DEFAULT 0,
  connected_at  timestamptz,
  messaged_at   timestamptz,
  replied_at    timestamptz,
  notes         text,
  tags          text[]      DEFAULT '{}',
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX leads_user_id_idx     ON leads(user_id);
CREATE INDEX leads_campaign_id_idx ON leads(campaign_id);
CREATE INDEX leads_status_idx      ON leads(status);

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own leads"
  ON leads FOR ALL
  USING (auth.uid() = user_id);

-- ── updated_at trigger ───────────────────────────────────────
CREATE TRIGGER leads_set_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

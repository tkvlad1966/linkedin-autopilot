-- ============================================================
-- 005_posts.sql
-- LinkedIn post scheduler
-- ============================================================

CREATE TABLE posts (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content          text        NOT NULL,
  media_urls       text[]      DEFAULT '{}',
  status           text        DEFAULT 'draft'
                               CHECK (status IN ('draft','scheduled','published','failed')),
  scheduled_at     timestamptz,
  published_at     timestamptz,
  linkedin_post_id text,
  likes_count      integer     DEFAULT 0,
  comments_count   integer     DEFAULT 0,
  reposts_count    integer     DEFAULT 0,
  impressions_count integer    DEFAULT 0,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own posts"
  ON posts FOR ALL
  USING (auth.uid() = user_id);

-- ── updated_at trigger ───────────────────────────────────────
CREATE TRIGGER posts_set_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

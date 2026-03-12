-- ============================================================
-- 001_profiles.sql
-- User profiles, linked to auth.users
-- ============================================================

CREATE TABLE profiles (
  id                   uuid        PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email                text        NOT NULL,
  full_name            text,
  avatar_url           text,
  linkedin_connected   boolean     DEFAULT false,
  extension_token      uuid        DEFAULT gen_random_uuid() UNIQUE,
  plan                 text        DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'agency')),
  daily_limit          integer     DEFAULT 20,
  working_hours_start  time        DEFAULT '09:00',
  working_hours_end    time        DEFAULT '18:00',
  timezone             text        DEFAULT 'Europe/Lisbon',
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ── Auto-create profile on sign-up ──────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Auto-update updated_at ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

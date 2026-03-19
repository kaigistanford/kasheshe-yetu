-- ============================================================
-- KASHESHE YETU – Full Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── PROFILES ────────────────────────────────────────────────
-- Extends Supabase auth.users with app-specific data
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL DEFAULT '',
  phone         TEXT,
  email         TEXT,
  role          TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin','secretary','treasurer','member')),
  address       TEXT,
  notes         TEXT,
  language_preference TEXT DEFAULT 'sw' CHECK (language_preference IN ('sw','en')),
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── MEMBERS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.members (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id                  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  member_number               TEXT UNIQUE NOT NULL,          -- KY-001, KY-002...
  full_name                   TEXT NOT NULL,
  phone                       TEXT,
  email                       TEXT,
  date_joined                 DATE NOT NULL DEFAULT CURRENT_DATE,
  member_type                 TEXT DEFAULT 'regular' CHECK (member_type IN ('founding','regular','honorary')),
  role                        TEXT DEFAULT 'member' CHECK (role IN ('admin','secretary','treasurer','member')),
  entry_fee_required          BOOLEAN DEFAULT FALSE,
  entry_fee_paid              BOOLEAN DEFAULT FALSE,
  total_contribution          NUMERIC(12,2) DEFAULT 0,
  months_paid                 INTEGER DEFAULT 0,
  outstanding_balance         NUMERIC(12,2) DEFAULT 0,
  annual_expected_contribution NUMERIC(12,2) DEFAULT 120000,
  last_paid_month             TEXT,                          -- YYYY-MM
  status                      TEXT DEFAULT 'active' CHECK (status IN ('active','inactive','suspended')),
  address                     TEXT,
  notes                       TEXT,
  created_by                  UUID REFERENCES public.profiles(id),
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_members_member_number  ON public.members(member_number);
CREATE INDEX IF NOT EXISTS idx_members_status         ON public.members(status);
CREATE INDEX IF NOT EXISTS idx_members_role           ON public.members(role);
CREATE INDEX IF NOT EXISTS idx_members_profile_id     ON public.members(profile_id);
CREATE INDEX IF NOT EXISTS idx_members_full_name      ON public.members USING gin (to_tsvector('simple', full_name));

-- ─── CONTRIBUTIONS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contributions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id        UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  member_name      TEXT NOT NULL,
  amount           NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  payment_type     TEXT NOT NULL DEFAULT 'monthly' CHECK (payment_type IN ('monthly','joining_fee','other')),
  months_covered   INTEGER DEFAULT 0,
  covered_months   JSONB DEFAULT '[]'::jsonb,               -- ["2024-01","2024-02",...]
  payment_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method   TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash','mobile_money','bank','other')),
  reference_number TEXT,
  received_by      TEXT,
  notes            TEXT,
  needs_review     BOOLEAN DEFAULT FALSE,                   -- irregular amounts
  created_by       UUID REFERENCES public.profiles(id),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contributions_member_id    ON public.contributions(member_id);
CREATE INDEX IF NOT EXISTS idx_contributions_payment_date ON public.contributions(payment_date);
CREATE INDEX IF NOT EXISTS idx_contributions_payment_type ON public.contributions(payment_type);
CREATE INDEX IF NOT EXISTS idx_contributions_needs_review ON public.contributions(needs_review) WHERE needs_review = TRUE;

-- ─── ANNOUNCEMENTS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.announcements (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        TEXT NOT NULL,
  message      TEXT NOT NULL,
  priority     TEXT DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  target_role  TEXT DEFAULT 'all' CHECK (target_role IN ('all','admin','secretary','treasurer','member')),
  is_published BOOLEAN DEFAULT TRUE,
  created_by   UUID REFERENCES public.profiles(id),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_target_role  ON public.announcements(target_role);
CREATE INDEX IF NOT EXISTS idx_announcements_is_published ON public.announcements(is_published);

-- ─── EVENTS / SUPPORT ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.events (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_date            DATE NOT NULL,
  event_name            TEXT NOT NULL,
  location              TEXT,
  beneficiary_member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  beneficiary_name      TEXT,
  beneficiary_type      TEXT DEFAULT 'member' CHECK (beneficiary_type IN ('member','family','external','group')),
  amount_given          NUMERIC(12,2) DEFAULT 0,
  description           TEXT,
  approved_by           TEXT,
  created_by            UUID REFERENCES public.profiles(id),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_event_date ON public.events(event_date);

-- ─── SETTINGS ────────────────────────────────────────────────
-- Key-value store for app configuration
CREATE TABLE IF NOT EXISTS public.settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO public.settings (key, value) VALUES
  ('monthly_rate',   '10000'),
  ('joining_fee',    '10000'),
  ('group_name',     'Kasheshe Yetu'),
  ('group_tagline',  'Haya Community Group'),
  ('constitution',   '{}')
ON CONFLICT (key) DO NOTHING;

-- ─── AUDIT LOGS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES public.profiles(id),
  action      TEXT NOT NULL,        -- INSERT, UPDATE, DELETE
  table_name  TEXT NOT NULL,
  record_id   UUID,
  old_data    JSONB,
  new_data    JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id    ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Helper function: get current user's role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─── PROFILES RLS ────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- All logged-in users can read all profiles (names visible)
CREATE POLICY "profiles_read_all" ON public.profiles
  FOR SELECT TO authenticated USING (TRUE);

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid());

-- Admin can update any profile
CREATE POLICY "profiles_admin_update" ON public.profiles
  FOR UPDATE TO authenticated USING (public.get_my_role() = 'admin');

-- ─── MEMBERS RLS ─────────────────────────────────────────────
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read member list
CREATE POLICY "members_read_all" ON public.members
  FOR SELECT TO authenticated USING (TRUE);

-- Admin and Secretary can insert members
CREATE POLICY "members_insert_admin_sec" ON public.members
  FOR INSERT TO authenticated WITH CHECK (
    public.get_my_role() IN ('admin','secretary')
  );

-- Admin and Secretary can update members
CREATE POLICY "members_update_admin_sec" ON public.members
  FOR UPDATE TO authenticated USING (
    public.get_my_role() IN ('admin','secretary')
  );

-- Only Admin can delete members
CREATE POLICY "members_delete_admin" ON public.members
  FOR DELETE TO authenticated USING (
    public.get_my_role() = 'admin'
  );

-- ─── CONTRIBUTIONS RLS ───────────────────────────────────────
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read contributions
CREATE POLICY "contributions_read_all" ON public.contributions
  FOR SELECT TO authenticated USING (TRUE);

-- Admin, Treasurer, Secretary can insert
CREATE POLICY "contributions_insert_elevated" ON public.contributions
  FOR INSERT TO authenticated WITH CHECK (
    public.get_my_role() IN ('admin','treasurer','secretary')
  );

-- Admin, Treasurer, Secretary can update
CREATE POLICY "contributions_update_elevated" ON public.contributions
  FOR UPDATE TO authenticated USING (
    public.get_my_role() IN ('admin','treasurer','secretary')
  );

-- Only Admin can delete
CREATE POLICY "contributions_delete_admin" ON public.contributions
  FOR DELETE TO authenticated USING (
    public.get_my_role() = 'admin'
  );

-- ─── ANNOUNCEMENTS RLS ───────────────────────────────────────
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Published announcements visible to their target
CREATE POLICY "announcements_read" ON public.announcements
  FOR SELECT TO authenticated USING (
    is_published = TRUE AND (
      target_role = 'all' OR
      target_role = public.get_my_role() OR
      public.get_my_role() = 'admin'
    )
  );

-- Admin and Secretary can see unpublished too
CREATE POLICY "announcements_read_admin_sec" ON public.announcements
  FOR SELECT TO authenticated USING (
    public.get_my_role() IN ('admin','secretary')
  );

-- Admin and Secretary can insert
CREATE POLICY "announcements_insert" ON public.announcements
  FOR INSERT TO authenticated WITH CHECK (
    public.get_my_role() IN ('admin','secretary')
  );

-- Admin and Secretary can update
CREATE POLICY "announcements_update" ON public.announcements
  FOR UPDATE TO authenticated USING (
    public.get_my_role() IN ('admin','secretary')
  );

-- Only Admin can delete
CREATE POLICY "announcements_delete" ON public.announcements
  FOR DELETE TO authenticated USING (
    public.get_my_role() = 'admin'
  );

-- ─── EVENTS RLS ──────────────────────────────────────────────
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- All authenticated can read events
CREATE POLICY "events_read_all" ON public.events
  FOR SELECT TO authenticated USING (TRUE);

-- Admin, Secretary, Treasurer can insert
CREATE POLICY "events_insert_elevated" ON public.events
  FOR INSERT TO authenticated WITH CHECK (
    public.get_my_role() IN ('admin','secretary','treasurer')
  );

-- Admin, Secretary, Treasurer can update
CREATE POLICY "events_update_elevated" ON public.events
  FOR UPDATE TO authenticated USING (
    public.get_my_role() IN ('admin','secretary','treasurer')
  );

-- Only Admin can delete
CREATE POLICY "events_delete_admin" ON public.events
  FOR DELETE TO authenticated USING (
    public.get_my_role() = 'admin'
  );

-- ─── SETTINGS RLS ────────────────────────────────────────────
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- All authenticated can read settings
CREATE POLICY "settings_read_all" ON public.settings
  FOR SELECT TO authenticated USING (TRUE);

-- Only Admin can modify settings
CREATE POLICY "settings_write_admin" ON public.settings
  FOR ALL TO authenticated USING (public.get_my_role() = 'admin');

-- ─── AUDIT LOGS RLS ──────────────────────────────────────────
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only Admin and Secretary can read audit logs
CREATE POLICY "audit_read_elevated" ON public.audit_logs
  FOR SELECT TO authenticated USING (
    public.get_my_role() IN ('admin','secretary')
  );

-- Service role can insert audit logs
CREATE POLICY "audit_insert_service" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (TRUE);

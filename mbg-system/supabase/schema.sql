-- ============================================================
-- MBG Management System - Supabase SQL Schema
-- Paste this entire script into Supabase SQL Editor and run it.
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. TABLE: kelas
-- ============================================================
CREATE TABLE IF NOT EXISTS public.kelas (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama_kelas  TEXT NOT NULL UNIQUE,
  total_siswa INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Seed kelas SMK (RPL, TKJ, PG)
INSERT INTO public.kelas (nama_kelas, total_siswa) VALUES
  ('RPL 1', 36),
  ('RPL 2', 36),
  ('RPL 3', 36),
  ('RPL 4', 36),
  ('RPL 5', 36),
  ('RPL 6', 36),
  ('RPL 7', 36),
  ('RPL 8', 36),
  ('TKJ 1', 36),
  ('TKJ 2', 36),
  ('TKJ 3', 36),
  ('PG 1',  36),
  ('PG 2',  36)
ON CONFLICT (nama_kelas) DO NOTHING;

-- ============================================================
-- 2. TABLE: log_makan
-- ============================================================
CREATE TYPE IF NOT EXISTS status_makan AS ENUM ('Pending', 'Proses', 'Selesai');

CREATE TABLE IF NOT EXISTS public.log_makan (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kelas_id         UUID NOT NULL REFERENCES public.kelas(id) ON DELETE CASCADE,
  tanggal          DATE NOT NULL DEFAULT CURRENT_DATE,
  porsi_dipesan    INTEGER NOT NULL DEFAULT 0,
  porsi_diterima   INTEGER,
  status           status_makan NOT NULL DEFAULT 'Pending',
  petugas_penerima TEXT,
  catatan          TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (kelas_id, tanggal)
);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.log_makan
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.kelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.log_makan ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read kelas
CREATE POLICY "Authenticated users can read kelas"
  ON public.kelas FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to read log_makan
CREATE POLICY "Authenticated users can read log_makan"
  ON public.log_makan FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert log_makan (Guru Kelas)
CREATE POLICY "Authenticated users can insert log_makan"
  ON public.log_makan FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update log_makan (Admin Dapur)
CREATE POLICY "Authenticated users can update log_makan"
  ON public.log_makan FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 4. REALTIME - Enable for log_makan table
-- ============================================================
-- Run this in Supabase Dashboard > Database > Replication
-- OR execute via SQL:
ALTER PUBLICATION supabase_realtime ADD TABLE public.log_makan;

-- ============================================================
-- 5. USER ROLES via user_metadata
-- ============================================================
-- When creating users in Supabase Auth, set user_metadata:
-- For Guru:  { "role": "guru",  "nama": "Nama Guru",  "kelas_id": "<uuid>" }
-- For Admin: { "role": "admin", "nama": "Nama Admin" }
--
-- Example via Supabase Dashboard > Authentication > Users > Create User
-- Or via SQL (replace values):
-- SELECT auth.create_user(
--   email    => 'guru1@sekolah.sch.id',
--   password => 'password123',
--   data     => '{"role":"guru","nama":"Bu Sari","kelas_id":"<kelas_uuid>"}'::jsonb
-- );

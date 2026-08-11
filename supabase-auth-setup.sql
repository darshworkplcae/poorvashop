-- ============================================================
-- POORVA SHOP — Run this in Supabase SQL Editor
-- ADD these tables to your existing database
-- ============================================================

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
  id            BIGSERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT DEFAULT 'employee',  -- 'admin' or 'employee'
  phone         TEXT,
  avatar        TEXT DEFAULT '🧑',
  join_date     DATE DEFAULT CURRENT_DATE,
  active        BOOLEAN DEFAULT TRUE,
  last_login    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Activity logs (tracks everything employees do)
CREATE TABLE IF NOT EXISTS activity_logs (
  id            BIGSERIAL PRIMARY KEY,
  employee_id   BIGINT REFERENCES employees(id) ON DELETE SET NULL,
  employee_name TEXT,
  action        TEXT NOT NULL,
  details       TEXT,
  page          TEXT,
  amount        DECIMAL(10,2),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Error logs (auto-captures app crashes)
CREATE TABLE IF NOT EXISTS error_logs (
  id            BIGSERIAL PRIMARY KEY,
  employee_id   BIGINT,
  employee_name TEXT,
  error_message TEXT,
  error_type    TEXT,
  page_url      TEXT,
  stack_trace   TEXT,
  resolved      BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS
ALTER TABLE employees     DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs    DISABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_activity_employee ON activity_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_activity_created  ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_created     ON error_logs(created_at DESC);

-- ── Seed default admin (password: Admin@123) ─────────────────────────────
-- SHA-256 hash of 'Admin@123'
INSERT INTO employees (name, username, password_hash, role, avatar) VALUES
  (
    'Admin',
    'admin',
    encode(digest('Admin@123', 'sha256'), 'hex'),
    'admin',
    '👑'
  )
ON CONFLICT (username) DO NOTHING;

-- ============================================================
-- DONE! Default login:
--   Username: admin
--   Password: Admin@123
-- Change the password from Admin panel after first login!
-- ============================================================

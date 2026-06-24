// Drizzle ORM schema — PostgreSQL + TimescaleDB
// Run: pnpm db:migrate to apply

export const schema = `
-- Enable TimescaleDB
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- ── Organisations ──────────────────────────────────────────────────────────
CREATE TABLE organisations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  plan        TEXT NOT NULL DEFAULT 'trial',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Users ──────────────────────────────────────────────────────────────────
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  clerk_user_id TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'viewer',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Connectors ─────────────────────────────────────────────────────────────
CREATE TABLE connectors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL,
  category        TEXT NOT NULL,
  auth_method     TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending',
  encrypted_creds TEXT,               -- AES-256 encrypted credentials blob
  config          JSONB DEFAULT '{}', -- non-sensitive config
  sync_frequency  TEXT NOT NULL DEFAULT 'daily',
  last_sync_at    TIMESTAMPTZ,
  next_sync_at    TIMESTAMPTZ,
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Reports ────────────────────────────────────────────────────────────────
CREATE TABLE reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  connector_id UUID NOT NULL REFERENCES connectors(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  type         TEXT NOT NULL,
  schema       JSONB NOT NULL DEFAULT '{}',
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Report snapshots (time-series) ─────────────────────────────────────────
CREATE TABLE report_snapshots (
  time         TIMESTAMPTZ NOT NULL,
  report_id    UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  org_id       UUID NOT NULL,
  data         JSONB NOT NULL,   -- normalised row data
  row_count    INTEGER,
  PRIMARY KEY (time, report_id)
);
SELECT create_hypertable('report_snapshots', 'time');

-- ── Alerts ─────────────────────────────────────────────────────────────────
CREATE TABLE alerts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  report_id        UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  severity         TEXT NOT NULL,
  title            TEXT NOT NULL,
  summary          TEXT NOT NULL,
  red_flags        JSONB NOT NULL DEFAULT '[]',
  stats            JSONB NOT NULL DEFAULT '[]',
  suggested_actions JSONB NOT NULL DEFAULT '[]',
  raw_ai_response  TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Alert deliveries ───────────────────────────────────────────────────────
CREATE TABLE alert_deliveries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id    UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel     TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending',
  delivered_at TIMESTAMPTZ,
  error       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Alert subscriptions ────────────────────────────────────────────────────
CREATE TABLE alert_subscriptions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report_id      UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  channel        TEXT NOT NULL,
  frequency      TEXT NOT NULL DEFAULT 'daily',
  schedule_time  TEXT NOT NULL DEFAULT '08:00',
  schedule_days  TEXT[] DEFAULT ARRAY['monday'],
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, report_id, channel)
);

-- ── Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX idx_connectors_org ON connectors(org_id);
CREATE INDEX idx_reports_connector ON reports(connector_id);
CREATE INDEX idx_alerts_report ON alerts(report_id, created_at DESC);
CREATE INDEX idx_deliveries_alert ON alert_deliveries(alert_id);
CREATE INDEX idx_subscriptions_user ON alert_subscriptions(user_id);
`

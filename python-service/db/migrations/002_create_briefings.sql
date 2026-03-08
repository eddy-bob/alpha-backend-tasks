CREATE TABLE IF NOT EXISTS briefings (
  id SERIAL PRIMARY KEY,
  company_name VARCHAR(200) NOT NULL,
  ticker VARCHAR(20) NOT NULL,
  sector VARCHAR(160) NOT NULL,
  analyst_name VARCHAR(160) NOT NULL,
  summary TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  report_html TEXT,
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_briefings_ticker ON briefings (ticker);

CREATE TABLE IF NOT EXISTS briefing_points (
  id SERIAL PRIMARY KEY,
  briefing_id INTEGER NOT NULL REFERENCES briefings(id) ON DELETE CASCADE,
  point_type VARCHAR(16) NOT NULL,
  content TEXT NOT NULL,
  display_order INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_briefing_points_briefing_id ON briefing_points (briefing_id);

CREATE TABLE IF NOT EXISTS briefing_metrics (
  id SERIAL PRIMARY KEY,
  briefing_id INTEGER NOT NULL REFERENCES briefings(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  value VARCHAR(120) NOT NULL,
  display_order INTEGER NOT NULL,
  CONSTRAINT uq_briefing_metric_name UNIQUE (briefing_id, name)
);

CREATE INDEX IF NOT EXISTS idx_briefing_metrics_briefing_id ON briefing_metrics (briefing_id);

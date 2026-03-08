CREATE INDEX IF NOT EXISTS idx_sample_items_created_at ON sample_items (created_at);
CREATE INDEX IF NOT EXISTS idx_sample_items_name ON sample_items (name);

CREATE INDEX IF NOT EXISTS idx_briefings_created_at ON briefings (created_at);
CREATE INDEX IF NOT EXISTS idx_briefings_ticker_created_at ON briefings (ticker, created_at);

CREATE INDEX IF NOT EXISTS idx_briefing_points_briefing_id_display_order
  ON briefing_points (briefing_id, display_order);

CREATE INDEX IF NOT EXISTS idx_briefing_metrics_briefing_id_display_order
  ON briefing_metrics (briefing_id, display_order);

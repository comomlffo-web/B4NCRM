CREATE TABLE IF NOT EXISTS behavior_events (
  event_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  anonymous_id TEXT,
  customer_id TEXT,
  salon_id TEXT,
  branch_id TEXT,
  event_name TEXT NOT NULL,
  event_category TEXT NOT NULL DEFAULT 'behavior',
  page TEXT,
  screen TEXT,
  menu_level INTEGER,
  category_id TEXT,
  service_id TEXT,
  specialist_id TEXT,
  product_id TEXT,
  previous_item TEXT,
  current_item TEXT,
  device_type TEXT,
  os TEXT,
  browser TEXT,
  occurred_at TEXT NOT NULL,
  properties_json TEXT NOT NULL DEFAULT '{}',
  received_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_behavior_events_session_time
  ON behavior_events(session_id, occurred_at);

CREATE INDEX IF NOT EXISTS idx_behavior_events_name_time
  ON behavior_events(event_name, occurred_at);

CREATE INDEX IF NOT EXISTS idx_behavior_events_service_time
  ON behavior_events(service_id, occurred_at);

CREATE INDEX IF NOT EXISTS idx_behavior_events_device_time
  ON behavior_events(device_type, occurred_at);

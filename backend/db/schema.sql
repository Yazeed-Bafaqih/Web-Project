CREATE TABLE IF NOT EXISTS roadmaps (
  id TEXT PRIMARY KEY,
  topic TEXT NOT NULL,
  level TEXT NOT NULL,
  hours_per_week INTEGER NOT NULL,
  duration_weeks INTEGER NOT NULL,
  session_id TEXT,
  user_email TEXT,
  roadmap_data TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  share_token TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_roadmaps_session ON roadmaps(session_id);
CREATE INDEX IF NOT EXISTS idx_roadmaps_email ON roadmaps(user_email);
CREATE INDEX IF NOT EXISTS idx_roadmaps_share ON roadmaps(share_token);
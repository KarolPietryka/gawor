CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  summary TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sentences (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  german TEXT NOT NULL,
  polish TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  text_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS vocabulary (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  german TEXT NOT NULL,
  polish TEXT NOT NULL DEFAULT '',
  UNIQUE(session_id, german)
);

CREATE INDEX IF NOT EXISTS sentences_session_idx ON sentences(session_id);
CREATE INDEX IF NOT EXISTS sessions_created_idx ON sessions(created_at DESC);

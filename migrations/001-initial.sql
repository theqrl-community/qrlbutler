--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS Score (
  emoji TEXT,
  userId TEXT,
  username TEXT NOT NULL,
  points INTEGER NOT NULL,
  PRIMARY KEY(emoji, userId)
);

CREATE TABLE IF NOT EXISTS Setting (
  setting TEXT PRIMARY KEY,
  value TEXT
);

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------


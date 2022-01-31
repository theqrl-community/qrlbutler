--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS score (
  emoji TEXT,
  messageid TEXT,
  r_userid TEXT,
  r_username TEXT,
  f_userid TEXT,
  reactdate INTEGER,
  PRIMARY KEY(emoji, messageid, f_userid)
);

CREATE TABLE IF NOT EXISTS setting (
  setting TEXT PRIMARY KEY,
  value TEXT
);

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------


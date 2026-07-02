CREATE TABLE IF NOT EXISTS members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kakao_id INTEGER NOT NULL UNIQUE,
  nickname TEXT,
  profile_image_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS invitations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  member_id INTEGER NOT NULL REFERENCES members(id),
  theme TEXT,
  groom_name TEXT,
  bride_name TEXT,
  wedding_date TEXT,
  content_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_invitations_member ON invitations(member_id);
CREATE INDEX IF NOT EXISTS idx_invitations_slug ON invitations(slug);

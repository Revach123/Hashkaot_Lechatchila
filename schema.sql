-- טבלת הרישום של lehathila.com (להריץ פעם אחת בקונסולה של מסד ה-D1)
CREATE TABLE IF NOT EXISTS registrations (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at       TEXT NOT NULL,
  first_name       TEXT NOT NULL,
  last_name        TEXT NOT NULL,
  id_number        TEXT NOT NULL,
  phone            TEXT NOT NULL,
  email            TEXT,
  pension          TEXT,              -- one = לאחד מבני הזוג, both = לשני בני הזוג, ריק = לא סומן
  child_count      INTEGER DEFAULT 0, -- 0 = לא סומן
  hishtalmut_count INTEGER DEFAULT 0,
  gemel_count      INTEGER DEFAULT 0,
  invest           INTEGER DEFAULT 0,
  invest_amount    INTEGER DEFAULT 0,
  mortgage         INTEGER DEFAULT 0,
  notes            TEXT,
  source           TEXT               -- web / email (בהמשך: טופס מהמייל הדינמי)
);
CREATE INDEX IF NOT EXISTS idx_registrations_id_number ON registrations(id_number);

-- יומן בקשות ההצטרפות במייל (מי ביקש, מתי, האם נשלח). משמש גם להגבלת שליחות חוזרות.
CREATE TABLE IF NOT EXISTS join_requests (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  email      TEXT NOT NULL,
  status     TEXT NOT NULL,   -- sent / test / limited / error
  detail     TEXT
);
CREATE INDEX IF NOT EXISTS idx_join_requests_email ON join_requests(email, created_at);

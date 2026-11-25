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

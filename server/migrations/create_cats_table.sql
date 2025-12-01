-- Create CATs table to store scraped CAT schedules
CREATE TABLE IF NOT EXISTS cats (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  subject_code VARCHAR(50) NOT NULL,
  subject_name VARCHAR(255) NOT NULL,
  cat_date DATE NOT NULL,
  cat_time TIME,
  venue VARCHAR(255),
  duration INTEGER, -- in minutes
  cat_number INTEGER, -- CAT 1, CAT 2, etc.
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create reminders table
CREATE TABLE IF NOT EXISTS reminders (
  id SERIAL PRIMARY KEY,
  cat_id INTEGER NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  reminder_time TIMESTAMP NOT NULL,
  sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cat_id) REFERENCES cats(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_cats_user ON cats(user_id);
CREATE INDEX IF NOT EXISTS idx_cats_date ON cats(cat_date);
CREATE INDEX IF NOT EXISTS idx_reminders_time ON reminders(reminder_time);
CREATE INDEX IF NOT EXISTS idx_reminders_sent ON reminders(sent);

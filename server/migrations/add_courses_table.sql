-- Create courses table to store enrolled courses
CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  course_id VARCHAR(50) NOT NULL,
  course_name VARCHAR(255) NOT NULL,
  course_url TEXT,
  progress INTEGER DEFAULT 0, -- Completion percentage (0-100)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, course_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_courses_user ON courses(user_id);
CREATE INDEX IF NOT EXISTS idx_courses_progress ON courses(progress);

-- Add columns to users table for stats
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_courses INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS completion_rate INTEGER DEFAULT 0;

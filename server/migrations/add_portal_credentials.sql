-- Add portal credentials columns to users table
ALTER TABLE users 
ADD COLUMN portal_username VARCHAR(255),
ADD COLUMN portal_password TEXT,
ADD COLUMN portal_connected BOOLEAN DEFAULT false,
ADD COLUMN portal_connected_at TIMESTAMP;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_portal_connected ON users(portal_connected);

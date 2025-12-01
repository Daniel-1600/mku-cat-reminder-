-- Add email verification columns to users table
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN email_verification_token VARCHAR(255);
ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMP;
ALTER TABLE users ADD COLUMN token_expires_at TIMESTAMP;

-- Add index for faster token lookups
CREATE INDEX idx_verification_token ON users(email_verification_token);
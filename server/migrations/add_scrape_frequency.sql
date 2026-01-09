-- Migration for User Scrape Frequency Preference
-- Allows users to choose how often their portal is checked for new CATs

-- Add scrape_frequency column to users table
-- Options: 'daily', 'every_2_days', 'every_3_days', 'weekly'
-- Default is 'every_2_days' (current behavior)
ALTER TABLE users ADD COLUMN IF NOT EXISTS scrape_frequency VARCHAR(20) DEFAULT 'every_2_days';

-- Add last_scraped_at to track when user was last scraped
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_scraped_at TIMESTAMP;

-- Create index for efficient querying of users due for scraping
CREATE INDEX IF NOT EXISTS idx_users_scrape_frequency ON users(scrape_frequency);
CREATE INDEX IF NOT EXISTS idx_users_last_scraped_at ON users(last_scraped_at);

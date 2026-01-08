// Run Course Mates and Messaging Migration - Fixed version
import pg from "pg";
import { config } from "dotenv";

config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "cat_reminder",
  port: process.env.DB_PORT || 5432,
});

async function runMigration() {
  try {
    console.log("Connecting to database...");

    // Run each statement separately
    const statements = [
      // Add profile fields to users
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(100)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_discoverable BOOLEAN DEFAULT true`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS show_courses BOOLEAN DEFAULT true`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,

      // Create messages table
      `CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id VARCHAR(36) NOT NULL,
        receiver_id VARCHAR(36) NOT NULL,
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
      )`,

      // Create conversations table
      `CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        user1_id VARCHAR(36) NOT NULL,
        user2_id VARCHAR(36) NOT NULL,
        last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_message_preview TEXT,
        user1_unread_count INTEGER DEFAULT 0,
        user2_unread_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user1_id, user2_id)
      )`,

      // Create study_groups table
      `CREATE TABLE IF NOT EXISTS study_groups (
        id SERIAL PRIMARY KEY,
        course_id VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_by VARCHAR(36) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      )`,

      // Create study_group_members table
      `CREATE TABLE IF NOT EXISTS study_group_members (
        id SERIAL PRIMARY KEY,
        group_id INTEGER NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES study_groups(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(group_id, user_id)
      )`,

      // Indexes
      `CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id)`,
      `CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id)`,
      `CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_conversations_users ON conversations(user1_id, user2_id)`,
      `CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_users_discoverable ON users(is_discoverable)`,
      `CREATE INDEX IF NOT EXISTS idx_courses_course_id ON courses(course_id)`,
    ];

    console.log(`Executing ${statements.length} SQL statements...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        await pool.query(statement);
        console.log(`✓ Statement ${i + 1}/${statements.length} executed`);
      } catch (err) {
        if (
          err.message.includes("already exists") ||
          err.message.includes("duplicate")
        ) {
          console.log(
            `○ Statement ${i + 1}/${statements.length} skipped (already exists)`
          );
        } else {
          console.error(
            `✗ Statement ${i + 1}/${statements.length} failed:`,
            err.message
          );
        }
      }
    }

    console.log("\n✅ Migration completed!");

    // Verify tables exist
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('messages', 'conversations', 'study_groups', 'study_group_members')
    `);

    console.log("\nCreated tables:");
    tables.rows.forEach((row) => console.log(`  - ${row.table_name}`));
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await pool.end();
  }
}

runMigration();

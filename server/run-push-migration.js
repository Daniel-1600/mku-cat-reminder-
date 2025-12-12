import pool from "./config/db.js";

async function runMigration() {
  try {
    console.log("🔄 Running push_subscriptions migration...\n");

    // Drop old table if exists (to fix the type issue)
    await pool.query(`DROP TABLE IF EXISTS push_subscriptions`);
    console.log("✅ Dropped old push_subscriptions table (if existed)");

    // Create push_subscriptions table with VARCHAR user_id to match users.id
    await pool.query(`
      CREATE TABLE push_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        endpoint TEXT NOT NULL UNIQUE,
        p256dh TEXT,
        auth TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Table push_subscriptions created with VARCHAR user_id");

    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id 
      ON push_subscriptions(user_id)
    `);
    console.log("✅ Index idx_push_subscriptions_user_id created");

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint 
      ON push_subscriptions(endpoint)
    `);
    console.log("✅ Index idx_push_subscriptions_endpoint created");

    // Verify
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'push_subscriptions'
    `);

    console.log("\n📊 push_subscriptions table structure:");
    result.rows.forEach((row) => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    console.log("\n✅ Migration completed successfully!");
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    await pool.end();
    process.exit(1);
  }
}

runMigration();

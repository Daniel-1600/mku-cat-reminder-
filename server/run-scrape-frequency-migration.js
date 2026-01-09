// Run scrape frequency migration
import pool from "./config/db.js";

async function runMigration() {
  console.log("Running scrape frequency migration...\n");

  const statements = [
    // Add scrape_frequency column
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS scrape_frequency VARCHAR(20) DEFAULT 'every_2_days'`,
    // Add last_scraped_at column
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_scraped_at TIMESTAMP`,
    // Create indexes
    `CREATE INDEX IF NOT EXISTS idx_users_scrape_frequency ON users(scrape_frequency)`,
    `CREATE INDEX IF NOT EXISTS idx_users_last_scraped_at ON users(last_scraped_at)`,
  ];

  try {
    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 60)}...`);
      await pool.query(statement);
      console.log("✅ Success\n");
    }

    console.log("========================================");
    console.log("✅ Scrape frequency migration completed!");
    console.log("========================================");

    // Verify the columns were added
    const result = await pool.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('scrape_frequency', 'last_scraped_at')
    `);

    console.log("\nNew columns added:");
    result.rows.forEach((row) => {
      console.log(
        `  - ${row.column_name}: ${row.data_type} (default: ${row.column_default})`
      );
    });
  } catch (error) {
    console.error("Migration failed:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();

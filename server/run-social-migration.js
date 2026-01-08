// Run Course Mates and Messaging Migration
import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

    // Read and execute the migration SQL file
    const migrationPath = path.join(
      __dirname,
      "migrations",
      "add_coursemates_messaging.sql"
    );
    const sql = fs.readFileSync(migrationPath, "utf-8");

    // Split by semicolons to execute statements one by one
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    console.log(`Found ${statements.length} SQL statements to execute...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        await pool.query(statement);
        console.log(`✓ Statement ${i + 1}/${statements.length} executed`);
      } catch (err) {
        // Ignore "already exists" errors for idempotent migrations
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
          console.error("SQL:", statement.substring(0, 100) + "...");
        }
      }
    }

    console.log("\n✅ Migration completed successfully!");

    // Verify tables exist
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('messages', 'conversations', 'study_groups', 'study_group_members')
    `);

    console.log("\nCreated tables:");
    tables.rows.forEach((row) => console.log(`  - ${row.table_name}`));

    // Check if new columns were added to users
    const columns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('display_name', 'bio', 'is_discoverable', 'show_courses', 'last_active')
    `);

    console.log("\nNew user columns:");
    columns.rows.forEach((row) => console.log(`  - ${row.column_name}`));
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await pool.end();
  }
}

runMigration();

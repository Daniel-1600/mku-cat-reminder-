import pool from "./config/db.js";

async function testConnection() {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("✅ Database connected successfully!");
    console.log("⏰ Server time:", result.rows[0].now);

    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log("\n📊 Tables in database:");
    tables.rows.forEach((row) => console.log("  -", row.table_name));

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Database connection failed:");
    console.error(error.message);
    process.exit(1);
  }
}

testConnection();

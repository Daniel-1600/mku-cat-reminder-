import pool from "./config/db.js";

async function check() {
  const result = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'users'
  `);
  console.log("Users table structure:");
  console.log(result.rows);

  const pushResult = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'push_subscriptions'
  `);
  console.log("\nPush subscriptions table structure:");
  console.log(pushResult.rows);

  await pool.end();
}

check();

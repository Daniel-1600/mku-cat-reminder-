import pg from "pg";
import { config } from "dotenv";

config();

const { Pool } = pg; // establish connection pool

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "cat_reminder",
  port: process.env.DB_PORT || 5432,
});

//test the db if its connected
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.log("error connecting to database", err);
  } else {
    console.log("successfully connected to database");
  }
});

export default pool;

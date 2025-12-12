import express from "express";
import cors from "cors";
import cron from "node-cron";
import { config } from "dotenv";
import authRoutes from "./routes/auth.js";
import portalRoutes from "./routes/portal.js";
import catsRoutes from "./routes/cats.js";
import dashboardRoutes from "./routes/dashboard.js";
import pushNotificationRoutes from "./routes/pushNotifications.js";
import { scrapeAllUsers } from "./services/scraper.js";
import { checkAndSendReminders } from "./services/notifications.js";

config();
const PORT = process.env.PORT || 3000;
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/portal", portalRoutes);
app.use("/api/cats", catsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/notifications", pushNotificationRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ message: "CAT Reminder API is running" });
});

// ============================================
// AUTOMATIC SCHEDULED SCRAPING
// Runs every 2 days at 6:00 AM East Africa Time
// Cron format: minute hour day-of-month month day-of-week
// "0 6 */2 * *" = At 06:00 on every 2nd day
// ============================================
cron.schedule(
  "0 6 */2 * *",
  async () => {
    console.log("\n========================================");
    console.log("🔄 SCHEDULED SCRAPE - Starting automatic portal sync");
    console.log(
      `📅 Time: ${new Date().toLocaleString("en-KE", {
        timeZone: "Africa/Nairobi",
      })}`
    );
    console.log("========================================\n");

    try {
      await scrapeAllUsers();
      console.log("\n✅ Scheduled scrape completed successfully!\n");
    } catch (error) {
      console.error("\n❌ Scheduled scrape failed:", error.message, "\n");
    }
  },
  {
    timezone: "Africa/Nairobi",
  }
);

// Also run a scrape on server startup (after 30 seconds delay to let everything initialize)
setTimeout(async () => {
  console.log("\n========================================");
  console.log("🚀 STARTUP SCRAPE - Running initial portal sync");
  console.log(
    `📅 Time: ${new Date().toLocaleString("en-KE", {
      timeZone: "Africa/Nairobi",
    })}`
  );
  console.log("========================================\n");

  try {
    await scrapeAllUsers();
    console.log("\n✅ Startup scrape completed!\n");
  } catch (error) {
    console.error("\n❌ Startup scrape failed:", error.message, "\n");
  }
}, 30000); // 30 second delay

// ============================================
// CAT REMINDER NOTIFICATIONS
// Checks every 5 minutes for CATs starting in 1 hour
// ============================================
cron.schedule(
  "*/5 * * * *",
  async () => {
    try {
      await checkAndSendReminders();
    } catch (error) {
      console.error("❌ Reminder check failed:", error.message);
    }
  },
  {
    timezone: "Africa/Nairobi",
  }
);

console.log("📅 Automatic scraping scheduled: Every 2 days at 6:00 AM (EAT)");
console.log("⏰ CAT reminders scheduled: Checking every 5 minutes");

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

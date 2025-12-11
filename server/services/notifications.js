/**
 * Notification Service
 * Handles email notifications for CAT reminders and new CAT alerts
 */

import nodemailer from "nodemailer";
import pool from "../config/db.js";
import { config } from "dotenv";

config();

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Use App Password for Gmail
  },
});

/**
 * Send email notification
 */
async function sendEmail(to, subject, html) {
  try {
    const mailOptions = {
      from: `"CATAlert 🐱" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${to}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    return false;
  }
}

/**
 * Notify user about new CATs found
 */
export async function notifyNewCATs(userId, newCats) {
  if (!newCats || newCats.length === 0) return;

  try {
    // Get user email
    const userResult = await pool.query(
      "SELECT email, full_name FROM users WHERE id = $1",
      [userId]
    );

    if (userResult.rows.length === 0) return;

    const user = userResult.rows[0];
    const userName = user.full_name?.split(" ")[0] || "Student";

    // Build email content
    const catsList = newCats
      .map(
        (cat) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">
            <strong>${cat.subject_name}</strong><br>
            <small style="color: #666;">CAT ${cat.cat_number}</small>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">
            ${new Date(cat.cat_date).toLocaleDateString("en-GB", {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
            ${cat.cat_time ? `<br><small>${cat.cat_time}</small>` : ""}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">
            ${cat.venue || "Online"}
          </td>
        </tr>
      `
      )
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .cat-count { font-size: 48px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; border-radius: 8px; overflow: hidden; }
          th { background: #667eea; color: white; padding: 12px; text-align: left; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .btn { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🐱 New CATs Alert!</h1>
            <div class="cat-count">${newCats.length}</div>
            <p>new CAT${newCats.length > 1 ? "s" : ""} found</p>
          </div>
          <div class="content">
            <p>Hi ${userName}! 👋</p>
            <p>We found <strong>${newCats.length} new CAT${
      newCats.length > 1 ? "s" : ""
    }</strong> on your MKU portal. Here's what's coming up:</p>
            
            <table>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Date</th>
                  <th>Venue</th>
                </tr>
              </thead>
              <tbody>
                ${catsList}
              </tbody>
            </table>

            <p>Make sure to prepare well! 📚</p>
            
            <center>
              <a href="${
                process.env.FRONTEND_URL || "http://localhost:5173"
              }" class="btn">View in CATAlert</a>
            </center>
          </div>
          <div class="footer">
            <p>You're receiving this because you connected your MKU portal to CATAlert.</p>
            <p>🐱 CATAlert - Never miss a CAT again!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail(
      user.email,
      `🆕 ${newCats.length} New CAT${newCats.length > 1 ? "s" : ""} Found!`,
      html
    );
  } catch (error) {
    console.error("Error sending new CATs notification:", error);
  }
}

/**
 * Send reminder for upcoming CAT (1 hour before)
 */
export async function sendCATReminder(userId, cat) {
  try {
    // Get user email
    const userResult = await pool.query(
      "SELECT email, full_name FROM users WHERE id = $1",
      [userId]
    );

    if (userResult.rows.length === 0) return;

    const user = userResult.rows[0];
    const userName = user.full_name?.split(" ")[0] || "Student";

    const catDateTime = cat.cat_time
      ? `${new Date(cat.cat_date).toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })} at ${cat.cat_time}`
      : new Date(cat.cat_date).toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
        });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .time-left { font-size: 64px; font-weight: bold; }
          .cat-details { background: white; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #f5576c; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ CAT Reminder!</h1>
            <div class="time-left">1hr</div>
            <p>until your CAT starts</p>
          </div>
          <div class="content">
            <p>Hey ${userName}! ⚡</p>
            <p>Your CAT is starting in <strong>1 hour</strong>! Time to get ready!</p>
            
            <div class="cat-details">
              <h2 style="margin-top: 0; color: #f5576c;">${
                cat.subject_name
              }</h2>
              <p><strong>📅 Date:</strong> ${catDateTime}</p>
              <p><strong>📍 Venue:</strong> ${cat.venue || "Online"}</p>
              <p><strong>⏱️ Duration:</strong> ${
                cat.duration || 120
              } minutes</p>
              <p><strong>#️⃣ CAT:</strong> ${cat.cat_number}</p>
            </div>

            <h3>Quick Checklist:</h3>
            <ul>
              <li>✅ Stable internet connection</li>
              <li>✅ Laptop/device fully charged</li>
              <li>✅ Quiet environment</li>
              <li>✅ MKU portal login ready</li>
              <li>✅ Study notes reviewed</li>
            </ul>

            <p><strong>You've got this! 💪</strong></p>
          </div>
          <div class="footer">
            <p>🐱 CATAlert - Never miss a CAT again!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail(
      user.email,
      `⏰ 1 Hour Left: ${cat.subject_name} CAT ${cat.cat_number}`,
      html
    );

    // Mark reminder as sent
    await pool.query(
      `UPDATE reminders SET sent = true, sent_at = CURRENT_TIMESTAMP 
       WHERE cat_id = $1 AND user_id = $2 AND sent = false`,
      [cat.id, userId]
    );

    console.log(`✅ Reminder sent for CAT: ${cat.subject_name}`);
  } catch (error) {
    console.error("Error sending CAT reminder:", error);
  }
}

/**
 * Check and send due reminders
 * Should be called every minute by cron
 */
export async function checkAndSendReminders() {
  try {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    // Find CATs that are 1 hour away and haven't had reminders sent
    const result = await pool.query(
      `SELECT c.*, u.email, u.full_name
       FROM cats c
       JOIN users u ON c.user_id = u.id
       LEFT JOIN reminders r ON r.cat_id = c.id AND r.sent = true
       WHERE c.cat_date = CURRENT_DATE
         AND c.cat_time IS NOT NULL
         AND r.id IS NULL
         AND c.cat_time BETWEEN $1 AND $2`,
      [
        now.toTimeString().slice(0, 8),
        oneHourFromNow.toTimeString().slice(0, 8),
      ]
    );

    console.log(`Found ${result.rows.length} CATs needing reminders`);

    for (const cat of result.rows) {
      // Create reminder record
      await pool.query(
        `INSERT INTO reminders (cat_id, user_id, reminder_time, sent) 
         VALUES ($1, $2, CURRENT_TIMESTAMP, false)
         ON CONFLICT DO NOTHING`,
        [cat.id, cat.user_id]
      );

      // Send the reminder
      await sendCATReminder(cat.user_id, cat);
    }
  } catch (error) {
    console.error("Error checking reminders:", error);
  }
}

/**
 * Create reminders for all upcoming CATs
 * Called after scraping to set up reminder schedules
 */
export async function createRemindersForCATs(userId, cats) {
  try {
    for (const cat of cats) {
      // Check if reminder already exists
      const existing = await pool.query(
        `SELECT id FROM reminders WHERE cat_id = $1 AND user_id = $2`,
        [cat.id, userId]
      );

      if (existing.rows.length === 0 && cat.cat_time) {
        // Calculate reminder time (1 hour before CAT)
        const catDateTime = new Date(`${cat.cat_date}T${cat.cat_time}`);
        const reminderTime = new Date(catDateTime.getTime() - 60 * 60 * 1000);

        // Only create reminder if it's in the future
        if (reminderTime > new Date()) {
          await pool.query(
            `INSERT INTO reminders (cat_id, user_id, reminder_time, sent) 
             VALUES ($1, $2, $3, false)`,
            [cat.id, userId, reminderTime]
          );
          console.log(
            `📅 Reminder scheduled for ${cat.subject_name} at ${reminderTime}`
          );
        }
      }
    }
  } catch (error) {
    console.error("Error creating reminders:", error);
  }
}

export default {
  notifyNewCATs,
  sendCATReminder,
  checkAndSendReminders,
  createRemindersForCATs,
};

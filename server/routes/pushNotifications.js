/**
 * Push Notification Routes
 * Handles push subscription management and sending push notifications
 */

import express from "express";
import webPush from "web-push";
import pool from "../config/db.js";
import { authenticateToken } from "../middleware/auth.js";
import { config } from "dotenv";

config();

const router = express.Router();

// Configure web-push with VAPID keys
// Generate keys with: npx web-push generate-vapid-keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";

if (vapidPublicKey && vapidPrivateKey) {
  webPush.setVapidDetails(
    "mailto:" + (process.env.EMAIL_USER || "noreply@catalert.com"),
    vapidPublicKey,
    vapidPrivateKey
  );
  console.log("✅ Web Push configured with VAPID keys");
} else {
  console.warn("⚠️ VAPID keys not configured - push notifications disabled");
}

/**
 * Subscribe to push notifications
 * POST /api/notifications/subscribe
 */
router.post("/subscribe", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { subscription } = req.body;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ message: "Invalid subscription" });
    }

    // Save subscription to database
    await pool.query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (endpoint) DO UPDATE SET
         user_id = $1,
         p256dh = $3,
         auth = $4,
         updated_at = NOW()`,
      [
        userId,
        subscription.endpoint,
        subscription.keys?.p256dh || null,
        subscription.keys?.auth || null,
      ]
    );

    console.log(`📱 Push subscription saved for user ${userId}`);
    res.json({ message: "Subscription saved successfully" });
  } catch (error) {
    console.error("Error saving subscription:", error);
    res.status(500).json({ message: "Failed to save subscription" });
  }
});

/**
 * Unsubscribe from push notifications
 * POST /api/notifications/unsubscribe
 */
router.post("/unsubscribe", authenticateToken, async (req, res) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({ message: "Endpoint required" });
    }

    await pool.query("DELETE FROM push_subscriptions WHERE endpoint = $1", [
      endpoint,
    ]);

    console.log(`📱 Push subscription removed`);
    res.json({ message: "Unsubscribed successfully" });
  } catch (error) {
    console.error("Error removing subscription:", error);
    res.status(500).json({ message: "Failed to unsubscribe" });
  }
});

/**
 * Get VAPID public key for client
 * GET /api/notifications/vapid-key
 */
router.get("/vapid-key", (req, res) => {
  res.json({ publicKey: vapidPublicKey });
});

/**
 * Test push notification
 * POST /api/notifications/test
 */
router.post("/test", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log(`📱 Test notification requested for user ${userId}`);

    // Get user's subscriptions
    const result = await pool.query(
      "SELECT * FROM push_subscriptions WHERE user_id = $1",
      [userId]
    );

    console.log(`Found ${result.rows.length} subscriptions for user ${userId}`);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message:
          "No push subscriptions found. Please enable notifications first.",
      });
    }

    const payload = JSON.stringify({
      title: "🐱 CATAlert Test",
      body: "Push notifications are working! You will receive CAT reminders here.",
      icon: "/vite.svg",
      tag: "test-notification",
      url: "/",
    });

    let successCount = 0;
    let failCount = 0;

    for (const sub of result.rows) {
      try {
        console.log(`Sending to endpoint: ${sub.endpoint.substring(0, 50)}...`);

        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        await webPush.sendNotification(pushSubscription, payload);
        successCount++;
        console.log(`✅ Push sent successfully`);
      } catch (err) {
        console.error("Failed to send test notification:", err.message);
        console.error("Full error:", err);
        failCount++;

        // Remove invalid subscriptions
        if (err.statusCode === 404 || err.statusCode === 410) {
          await pool.query(
            "DELETE FROM push_subscriptions WHERE endpoint = $1",
            [sub.endpoint]
          );
        }
      }
    }

    res.json({
      message: `Test notification sent (${successCount} success, ${failCount} failed)`,
    });
  } catch (error) {
    console.error("Error sending test notification:", error);
    console.error("Stack trace:", error.stack);
    res
      .status(500)
      .json({ message: "Failed to send test notification: " + error.message });
  }
});

/**
 * Send push notification to a specific user
 */
export async function sendPushToUser(userId, payload) {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.log("Push notifications not configured");
    return { success: 0, failed: 0 };
  }

  try {
    const result = await pool.query(
      "SELECT * FROM push_subscriptions WHERE user_id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      return { success: 0, failed: 0 };
    }

    const payloadStr = JSON.stringify(payload);
    let success = 0;
    let failed = 0;

    for (const sub of result.rows) {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        await webPush.sendNotification(pushSubscription, payloadStr);
        success++;
      } catch (err) {
        failed++;
        console.error(`Push failed: ${err.message}`);

        // Remove expired/invalid subscriptions
        if (err.statusCode === 404 || err.statusCode === 410) {
          await pool.query(
            "DELETE FROM push_subscriptions WHERE endpoint = $1",
            [sub.endpoint]
          );
        }
      }
    }

    return { success, failed };
  } catch (error) {
    console.error("Error sending push notification:", error);
    return { success: 0, failed: 0 };
  }
}

/**
 * Send CAT reminder push notification
 */
export async function sendCATReminderPush(userId, cat) {
  const date = new Date(cat.cat_date);
  const dateStr = date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  const payload = {
    title: `🚨 CAT ${cat.cat_number} in 1 Hour!`,
    body: `${cat.subject_name}\n📅 ${dateStr} ${
      cat.cat_time ? `at ${cat.cat_time}` : ""
    }`,
    icon: "/vite.svg",
    badge: "/vite.svg",
    tag: `cat-reminder-${cat.id}`,
    urgent: true,
    url: "/",
    catId: cat.id,
    type: "reminder",
    actions: [
      { action: "view", title: "View CAT" },
      { action: "dismiss", title: "Dismiss" },
    ],
  };

  return sendPushToUser(userId, payload);
}

/**
 * Send new CAT notification push
 */
export async function sendNewCATPush(userId, cats) {
  if (!cats || cats.length === 0) return;

  const count = cats.length;
  const firstCat = cats[0];

  const payload = {
    title: `📚 ${count} New CAT${count > 1 ? "s" : ""} Found!`,
    body:
      count === 1
        ? `${firstCat.subject_name} - CAT ${firstCat.cat_number}`
        : `Including ${firstCat.subject_name} and ${count - 1} more`,
    icon: "/vite.svg",
    badge: "/vite.svg",
    tag: "new-cats",
    url: "/",
    type: "new-cats",
  };

  return sendPushToUser(userId, payload);
}

export default router;

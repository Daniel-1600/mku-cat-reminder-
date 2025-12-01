// MKU Portal Scraper
// Logs into MKU portal and extracts CAT schedules

import pool from "../config/db.js";
import { decrypt } from "../utils/encryption.js";
import { chromium } from "playwright";

// Scrape CATs for a single user
export async function scrapeCATsForUser(userId) {
  let browser = null;

  try {
    console.log(`Starting CAT scrape for user: ${userId}`);

    // 1. Get user's portal credentials
    const userResult = await pool.query(
      `SELECT portal_username, portal_password, email 
       FROM users WHERE id = $1 AND portal_connected = true`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new Error("Portal not connected for this user");
    }

    const user = userResult.rows[0];
    const portalUsername = user.portal_username;
    const portalPassword = decrypt(user.portal_password);

    console.log(`Logging in as: ${portalUsername}`);

    // 2. Login to MKU VLMS portal
    const PORTAL_URL = "https://vlms.mku.ac.ke";
    const LOGIN_URL = `${PORTAL_URL}/login/index.php`;
    const DASHBOARD_URL = `${PORTAL_URL}/my/`;

    // Using Playwright for better reliability
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      viewport: { width: 1366, height: 768 },
      locale: "en-KE",
      timezoneId: "Africa/Nairobi",
    });

    // Add stealth scripts to avoid bot detection
    await context.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false });
      Object.defineProperty(navigator, "plugins", {
        get: () => [1, 2, 3, 4, 5],
      });
      Object.defineProperty(navigator, "languages", {
        get: () => ["en-US", "en"],
      });
    });

    const page = await context.newPage();

    try {
      console.log("Navigating to login page...");
      await page.goto(LOGIN_URL, { waitUntil: "networkidle", timeout: 60000 });

      // Check if redirected to Microsoft OAuth
      const currentUrl = page.url();
      console.log(`Current URL: ${currentUrl}`);

      if (
        currentUrl.includes("microsoftonline.com") ||
        currentUrl.includes("login.microsoft")
      ) {
        // ============================================
        // MICROSOFT OAUTH LOGIN FLOW (Multi-step)
        // ============================================
        console.log("Detected Microsoft OAuth login...");

        // Step 1: Enter email
        console.log("Entering email...");
        await page.waitForSelector('input[type="email"]', { timeout: 30000 });
        await page.fill('input[type="email"]', portalUsername);
        await page.click('input[type="submit"]');
        await page.waitForTimeout(3000);

        // Step 2: Enter password
        console.log("Entering password...");
        await page.waitForSelector('input[type="password"]', {
          timeout: 30000,
        });
        await page.fill('input[type="password"]', portalPassword);
        await page.click('input[type="submit"]');
        await page.waitForTimeout(5000);

        // Handle "Stay signed in?" prompt
        const staySignedIn = await page.$('input[type="submit"][value="Yes"]');
        if (staySignedIn) {
          console.log("Handling 'Stay signed in' prompt...");
          await staySignedIn.click();
          await page.waitForTimeout(3000);
        }

        // Wait for redirect back to MKU portal
        console.log("Waiting for redirect to portal...");
        await page.waitForURL(/vlms\.mku\.ac\.ke/, { timeout: 60000 });
      } else {
        // ============================================
        // STANDARD MOODLE LOGIN FLOW
        // ============================================
        console.log("Using standard Moodle login...");

        const emailSelector =
          'input[name="email"], input[type="email"], input[name="username"]';
        await page.waitForSelector(emailSelector, { timeout: 10000 });
        await page.fill(emailSelector, portalUsername);
        await page.fill('input[name="password"]', portalPassword);

        console.log("Submitting login form...");
        await Promise.all([
          page.click('button[type="submit"], input[type="submit"]'),
          page.waitForNavigation({ waitUntil: "networkidle", timeout: 30000 }),
        ]);
      }

      // Check if login was successful
      const afterLoginUrl = page.url();
      if (
        afterLoginUrl.includes("login") &&
        !afterLoginUrl.includes("vlms.mku.ac.ke/my")
      ) {
        throw new Error(
          "Login failed - invalid credentials or still on login page"
        );
      }

      console.log(`Login successful! Current URL: ${afterLoginUrl}`);

      // Navigate to dashboard
      console.log("Navigating to dashboard...");
      await page.goto(DASHBOARD_URL, {
        waitUntil: "networkidle",
        timeout: 30000,
      });

      // Wait for page to load
      await page.waitForTimeout(2000);

      // Also check calendar page for better CAT data
      console.log("Checking calendar for upcoming events...");
      await page.goto(`${PORTAL_URL}/calendar/view.php?view=upcoming`, {
        waitUntil: "networkidle",
        timeout: 30000,
      });
      await page.waitForTimeout(2000);

      // Extract CAT activities from calendar
      const cats = await page.evaluate(() => {
        const activities = [];

        // Look for ALL event/activity content on calendar
        const selectors = [
          ".event",
          ".calendar_event_course",
          "[data-event-title]",
          ".eventname",
          "[data-region='event-list-content'] a",
          ".event-name-container",
          "a[href*='mod/quiz']",
          "a[href*='mod/assign']",
          ".list-group-item",
          '[data-type="event"]',
          ".calendar-event",
          "[data-event-component]",
        ];

        selectors.forEach((selector) => {
          document.querySelectorAll(selector).forEach((el) => {
            const text = el.textContent?.trim() || "";
            const title = el.getAttribute("data-event-title") || text;

            if (title.length > 3 && title.length < 200) {
              // Get date from data attributes or text
              const dateAttr =
                el.getAttribute("data-start") ||
                el.getAttribute("data-event-start") ||
                el.querySelector("time")?.getAttribute("datetime") ||
                "";

              // Extract CAT number
              const catNumberMatch = title.match(/CAT\s*(\d+)/i);
              const catNumber = catNumberMatch
                ? parseInt(catNumberMatch[1])
                : 1;

              // Extract subject name
              const subjectMatch =
                title.match(/^(.+?)\s*-?\s*CAT/i) ||
                title.match(/CAT\s*\d*\s*-?\s*(.+?)(\s*\(|$)/i);
              const subject = subjectMatch
                ? subjectMatch[1].trim()
                : title.replace(/CAT\s*\d*/i, "").trim();

              activities.push({
                title: title,
                subject: subject || title,
                date: dateAttr,
                time: el.getAttribute("data-time") || "",
                venue: el.getAttribute("data-location") || "TBA",
                catNumber: catNumber,
                href:
                  el.getAttribute("href") || el.querySelector("a")?.href || "",
              });
            }
          });
        });

        // Get event dates from data attributes
        document.querySelectorAll("[data-event-id]").forEach((el) => {
          const title =
            el.getAttribute("data-event-title") || el.textContent?.trim();
          const timeEl = el.querySelector("time") || el.querySelector(".date");
          const dateText =
            timeEl?.getAttribute("datetime") || timeEl?.textContent || "";

          if (title && !activities.some((a) => a.title === title)) {
            const catNumberMatch = title.match(/CAT\s*(\d+)/i);
            const catNumber = catNumberMatch ? parseInt(catNumberMatch[1]) : 1;

            activities.push({
              title: title,
              subject: title.replace(/CAT\s*\d*/i, "").trim(),
              date: dateText,
              time: "",
              venue: "TBA",
              catNumber: catNumber,
              href: el.querySelector("a")?.href || "",
            });
          }
        });

        return activities;
      });

      console.log(`Found ${cats.length} activities on calendar`);

      // If no CATs on calendar, also check dashboard
      if (cats.length === 0) {
        console.log("No activities on calendar, checking dashboard...");
        await page.goto(DASHBOARD_URL, {
          waitUntil: "networkidle",
          timeout: 30000,
        });
        await page.waitForTimeout(2000);

        // Extract from dashboard timeline
        const dashboardCats = await page.evaluate(() => {
          const activities = [];

          const timelineItems = document.querySelectorAll(
            '.timeline .activity-item, .event-container, [data-region="timeline"] a, .event-name'
          );

          timelineItems.forEach((item) => {
            const text = item.textContent || "";
            const titleEl =
              item.querySelector(".activity-name, .event-name, h3, h4") || item;
            const dateEl = item.querySelector(
              ".activity-date, .event-date, time, .date"
            );

            const title = titleEl?.textContent?.trim() || "";
            const dateStr =
              dateEl?.textContent?.trim() ||
              dateEl?.getAttribute("datetime") ||
              "";

            if (title.length > 3 && title.length < 200) {
              const catNumberMatch = title.match(/CAT\s*(\d+)/i);
              const catNumber = catNumberMatch
                ? parseInt(catNumberMatch[1])
                : 1;

              activities.push({
                title,
                subject: title.replace(/CAT\s*\d*/i, "").trim(),
                date: dateStr,
                time: "",
                venue: "TBA",
                catNumber,
              });
            }
          });

          return activities;
        });

        // Use dashboard cats if found
        if (dashboardCats.length > 0) {
          cats.push(...dashboardCats);
        }
      }

      // Remove duplicates based on title
      const uniqueCats = cats.filter(
        (cat, index, self) =>
          index ===
          self.findIndex((c) => c.title === cat.title && c.date === cat.date)
      );

      console.log(`Found ${uniqueCats.length} unique activities`);

      await browser.close();
      browser = null;

      // Convert to database format
      const formattedCats = uniqueCats.map((cat) => {
        // Parse date - handle various formats
        let catDate = new Date();
        try {
          catDate = new Date(cat.date);
        } catch (e) {
          console.error("Error parsing date:", cat.date);
        }

        // Parse time if available
        let catTime = null;
        if (cat.time) {
          const timeMatch = cat.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
          if (timeMatch) {
            catTime = cat.time;
          }
        }

        return {
          subject_code: cat.subject.substring(0, 50),
          subject_name: cat.subject,
          cat_date: catDate.toISOString().split("T")[0],
          cat_time: catTime,
          venue: cat.venue || "TBA",
          cat_number: cat.catNumber,
          duration: 120, // Default 2 hours
        };
      });

      // If no CATs found, return empty array instead of mock data
      if (formattedCats.length === 0) {
        console.log("No CATs found in timeline");
        return [];
      }

      // Save CATs to database
      await saveCATsToDatabase(userId, formattedCats);

      console.log(
        `Successfully scraped ${formattedCats.length} CATs for user ${userId}`
      );
      return formattedCats;
    } catch (error) {
      if (browser) {
        await browser.close();
      }
      throw error;
    }
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    console.error(`Error scraping CATs for user ${userId}:`, error);
    throw error;
  }
}

// Save scraped CATs to database

async function saveCATsToDatabase(userId, cats) {
  try {
    // Delete old CATs for this user (to avoid duplicates)
    await pool.query("DELETE FROM cats WHERE user_id = $1", [userId]);

    // Insert new CATs
    for (const cat of cats) {
      await pool.query(
        `INSERT INTO cats (user_id, subject_code, subject_name, cat_date, cat_time, venue, cat_number, duration)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          userId,
          cat.subject_code,
          cat.subject_name,
          cat.cat_date,
          cat.cat_time,
          cat.venue,
          cat.cat_number,
          cat.duration,
        ]
      );
    }

    console.log(`Saved ${cats.length} CATs to database`);
  } catch (error) {
    console.error("Error saving CATs to database:", error);
    throw error;
  }
}

// Scrape CATs for all connected users
export async function scrapeAllUsers() {
  try {
    const result = await pool.query(
      "SELECT id FROM users WHERE portal_connected = true"
    );

    console.log(`Found ${result.rows.length} users with connected portals`);

    for (const user of result.rows) {
      try {
        await scrapeCATsForUser(user.id);
      } catch (error) {
        console.error(`Failed to scrape for user ${user.id}:`, error.message);
        // Continue with next user
      }
    }

    console.log("Finished scraping all users");
  } catch (error) {
    console.error("Error in scrapeAllUsers:", error);
    throw error;
  }
}

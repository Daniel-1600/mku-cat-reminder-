// MKU Portal Scraper
// Logs into MKU portal and extracts CAT schedules and courses

import pool from "../config/db.js";
import { decrypt } from "../utils/encryption.js";
import { chromium } from "playwright";
import { notifyNewCATs, createRemindersForCATs } from "./notifications.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Session storage directory - stores cookies/sessions per user for up to 90 days
const SESSIONS_DIR = path.join(__dirname, "..", "sessions");
const SESSION_MAX_AGE_DAYS = 90;

// Ensure sessions directory exists
if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

// Get session file path for a user
function getSessionPath(userId) {
  return path.join(SESSIONS_DIR, `session-${userId}.json`);
}

// Check if session file exists and is not expired
function isSessionValid(userId) {
  const sessionPath = getSessionPath(userId);
  if (!fs.existsSync(sessionPath)) {
    return false;
  }

  try {
    const stats = fs.statSync(sessionPath);
    const ageInDays = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24);

    // Session is valid if less than SESSION_MAX_AGE_DAYS old
    if (ageInDays < SESSION_MAX_AGE_DAYS) {
      console.log(
        `Found valid session for user ${userId} (${Math.round(
          ageInDays
        )} days old)`
      );
      return true;
    }

    console.log(
      `Session for user ${userId} expired (${Math.round(ageInDays)} days old)`
    );
    // Delete expired session
    fs.unlinkSync(sessionPath);
    return false;
  } catch (error) {
    console.log(`Error checking session for user ${userId}:`, error.message);
    return false;
  }
}

// Save session state to file
async function saveSession(context, userId) {
  try {
    const sessionPath = getSessionPath(userId);
    const storageState = await context.storageState();
    fs.writeFileSync(sessionPath, JSON.stringify(storageState, null, 2));
    console.log(`Saved session for user ${userId}`);
  } catch (error) {
    console.log(`Failed to save session for user ${userId}:`, error.message);
  }
}

// Delete session file (e.g., on login failure)
function deleteSession(userId) {
  try {
    const sessionPath = getSessionPath(userId);
    if (fs.existsSync(sessionPath)) {
      fs.unlinkSync(sessionPath);
      console.log(`Deleted session for user ${userId}`);
    }
  } catch (error) {
    console.log(`Failed to delete session for user ${userId}:`, error.message);
  }
}

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
    const COURSES_URL = `${PORTAL_URL}/my/courses.php`;
    const CALENDAR_URL = `${PORTAL_URL}/calendar/view.php?view=upcoming`;

    // Using Playwright for better reliability
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    // Check if we have a valid saved session
    const hasValidSession = isSessionValid(userId);
    const sessionPath = getSessionPath(userId);

    // Context options with session restoration if available
    const contextOptions = {
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      viewport: { width: 1366, height: 768 },
      locale: "en-KE",
      timezoneId: "Africa/Nairobi",
    };

    // Load existing session if available
    if (hasValidSession) {
      try {
        const sessionData = JSON.parse(fs.readFileSync(sessionPath, "utf-8"));
        contextOptions.storageState = sessionData;
        console.log("Loaded existing session with cookies");
      } catch (error) {
        console.log("Failed to load session, will login fresh:", error.message);
        deleteSession(userId);
      }
    }

    const context = await browser.newContext(contextOptions);

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
      // First, try to access the dashboard directly (if session is valid, we're already logged in)
      let needsLogin = true;

      if (hasValidSession) {
        console.log("Testing if saved session is still valid...");
        try {
          await page.goto(DASHBOARD_URL, {
            waitUntil: "networkidle",
            timeout: 30000,
          });
          const afterUrl = page.url();

          // Check if we're on the dashboard (not redirected to login)
          if (afterUrl.includes("/my/") && !afterUrl.includes("login")) {
            console.log("✅ Session still valid! Skipping login.");
            needsLogin = false;
          } else {
            console.log("Session expired, need to re-login");
            deleteSession(userId);
          }
        } catch (error) {
          console.log("Session check failed, will login fresh:", error.message);
          deleteSession(userId);
        }
      }

      if (needsLogin) {
        console.log("Navigating to login page...");
        await page.goto(LOGIN_URL, {
          waitUntil: "networkidle",
          timeout: 60000,
        });
      }

      // Check if redirected to Microsoft OAuth
      const currentUrl = page.url();
      console.log(`Current URL: ${currentUrl}`);

      if (
        needsLogin &&
        (currentUrl.includes("microsoftonline.com") ||
          currentUrl.includes("login.microsoft"))
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

        // Check for email/username error
        const usernameError = await page.$("#usernameError");
        if (usernameError) {
          const errorText = await usernameError.textContent();
          if (errorText && errorText.trim()) {
            await page.screenshot({ path: "./debug-username-error.png" });
            deleteSession(userId);
            throw new Error(`Microsoft login failed: ${errorText.trim()}`);
          }
        }

        // Step 2: Enter password
        console.log("Entering password...");
        await page.waitForSelector('input[type="password"]', {
          timeout: 30000,
        });
        await page.fill('input[type="password"]', portalPassword);
        await page.click('input[type="submit"]');

        // Wait for either redirect or "Stay signed in?" prompt
        console.log("Waiting for response after password...");
        await page.waitForTimeout(5000);

        // Check immediately for password error
        const passwordError = await page.$("#passwordError");
        if (passwordError) {
          const errorText = await passwordError.textContent();
          if (errorText && errorText.trim()) {
            await page.screenshot({ path: "./debug-password-error.png" });
            deleteSession(userId);
            throw new Error(
              `Microsoft login failed - wrong password: ${errorText.trim()}`
            );
          }
        }

        // Handle "Stay signed in?" prompt - try multiple selectors
        try {
          const staySignedInSelectors = [
            "#idSIButton9", // Microsoft's "Yes" button ID
            "#idBtn_Back", // Microsoft's "No" button ID
            'input[type="submit"][value="Yes"]',
            'input[type="submit"][value="No"]',
          ];

          for (const selector of staySignedInSelectors) {
            const button = await page.$(selector);
            if (button) {
              console.log(
                `Found 'Stay signed in' button with selector: ${selector}`
              );
              await button.click();
              console.log("Clicked 'Stay signed in' button");
              break;
            }
          }
        } catch (e) {
          console.log("No 'Stay signed in' prompt found, continuing...");
        }

        // Wait for redirect back to MKU portal with better error handling
        console.log("Waiting for redirect to portal...");

        // Wait up to 90 seconds for the redirect, checking every 5 seconds
        let redirected = false;
        let stuckOnLogin = false;

        for (let i = 0; i < 18; i++) {
          await page.waitForTimeout(5000);
          const currentUrl = page.url();
          console.log(`[${(i + 1) * 5}s] Current URL: ${currentUrl}`);

          if (currentUrl.includes("vlms.mku.ac.ke")) {
            console.log("Successfully redirected to MKU portal!");
            redirected = true;
            break;
          }

          // Check for login errors on Microsoft page
          if (currentUrl.includes("microsoftonline.com")) {
            // Check for various error messages on Microsoft login
            const errorInfo = await page.evaluate(() => {
              // Check multiple possible error selectors
              const errorSelectors = [
                "#usernameError",
                "#passwordError",
                ".alert-error",
                '[role="alert"]',
                "#passwordError",
                ".ext-error",
                "#error",
                ".error-text",
                "#errorText",
                "#service_exception_message",
              ];

              for (const selector of errorSelectors) {
                const el = document.querySelector(selector);
                if (el && el.textContent.trim()) {
                  return { type: "error", message: el.textContent.trim() };
                }
              }

              // Check if password field has error state
              const pwdInput = document.querySelector('input[type="password"]');
              if (
                pwdInput &&
                pwdInput.getAttribute("aria-invalid") === "true"
              ) {
                const pwdError = document.querySelector(
                  '#passwordError, [id*="password"][id*="error"]'
                );
                if (pwdError)
                  return {
                    type: "password_error",
                    message: pwdError.textContent.trim(),
                  };
              }

              // Check for "Your account or password is incorrect" message
              const bodyText = document.body.innerText;
              if (
                bodyText.includes("password is incorrect") ||
                bodyText.includes("account doesn't exist")
              ) {
                return {
                  type: "credential_error",
                  message: "Your account or password is incorrect",
                };
              }

              // Check for MFA/verification prompts
              if (
                bodyText.includes("Verify your identity") ||
                bodyText.includes("More information required")
              ) {
                return {
                  type: "mfa_required",
                  message: "Multi-factor authentication required",
                };
              }

              return null;
            });

            if (errorInfo) {
              console.log(
                `Login error detected (${errorInfo.type}): ${errorInfo.message}`
              );
              await page.screenshot({ path: "./debug-login-error.png" });
              deleteSession(userId);
              throw new Error(`Microsoft login failed: ${errorInfo.message}`);
            }

            // If we're still on the login page after 20 seconds, something is wrong
            if (i >= 4) {
              stuckOnLogin = true;
              console.log(
                "Still on login page - taking screenshot for debugging..."
              );
              await page.screenshot({ path: "./debug-login-stuck.png" });

              // Get more detailed page content for debugging
              const pageTitle = await page.title();
              const debugInfo = await page.evaluate(() => {
                // Get visible text, excluding footer/terms links
                const main = document.querySelector(
                  'main, [role="main"], .middle, #lightbox'
                );
                const mainText = main
                  ? main.innerText.substring(0, 800)
                  : document.body.innerText.substring(0, 800);

                // Check what input fields are visible
                const inputs = Array.from(
                  document.querySelectorAll('input:not([type="hidden"])')
                ).map((i) => ({
                  type: i.type,
                  name: i.name || i.id,
                  visible: i.offsetParent !== null,
                }));

                // Check for any buttons
                const buttons = Array.from(
                  document.querySelectorAll('button, input[type="submit"]')
                ).map((b) => b.innerText || b.value);

                return { mainText, inputs, buttons };
              });

              console.log(`Page title: ${pageTitle}`);
              console.log(
                `Visible inputs: ${JSON.stringify(debugInfo.inputs)}`
              );
              console.log(`Buttons: ${JSON.stringify(debugInfo.buttons)}`);
              console.log(`Page content: ${debugInfo.mainText}`);

              deleteSession(userId);
              throw new Error(
                `Login failed - stuck on Microsoft login page. Check debug-login-stuck.png`
              );
            }
          }

          // Only click "Stay signed in" buttons on the kmsi page, not on login page
          if (currentUrl.includes("kmsi")) {
            const continueBtn = await page.$("#idSIButton9, #idBtn_Back");
            if (continueBtn) {
              console.log("Found 'Stay signed in' button, clicking...");
              await continueBtn.click();
            }
          }
        }

        if (!redirected && !stuckOnLogin) {
          const finalUrl = page.url();
          console.log(`Final URL: ${finalUrl}`);
          await page.screenshot({ path: "./debug-login-stuck.png" });

          if (!finalUrl.includes("vlms.mku.ac.ke")) {
            throw new Error(
              `Login redirect failed after 90s. Stuck at: ${finalUrl}`
            );
          }
        }
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
        // Delete any existing session since login failed
        deleteSession(userId);
        throw new Error(
          "Login failed - invalid credentials or still on login page"
        );
      }

      console.log(`Login successful! Current URL: ${afterLoginUrl}`);

      // Save session after successful login (cookies will persist for up to 90 days)
      await saveSession(context, userId);

      // ============================================
      // STEP 1: SCRAPE ALL ENROLLED COURSES
      // ============================================
      console.log("\n=== SCRAPING COURSES ===");
      console.log("Navigating to courses page...");
      await page.goto(COURSES_URL, {
        waitUntil: "networkidle",
        timeout: 30000,
      });
      await page.waitForTimeout(2000);

      await page.screenshot({ path: "./debug-courses.png", fullPage: true });
      console.log("Courses screenshot saved to debug-courses.png");

      // Extract all enrolled courses
      const courses = await page.evaluate(() => {
        const courseList = [];

        // Moodle course card selectors
        const courseSelectors = [
          ".course-listitem",
          ".coursebox",
          ".card.dashboard-card",
          '[data-region="course-content"]',
          ".course-info-container",
          'a[href*="course/view.php"]',
        ];

        courseSelectors.forEach((selector) => {
          document.querySelectorAll(selector).forEach((el) => {
            // Get course link
            const linkEl =
              el.tagName === "A"
                ? el
                : el.querySelector('a[href*="course/view.php"]');
            const href = linkEl?.href || "";

            if (!href || !href.includes("course/view.php")) return;

            // Extract course ID from URL
            const courseIdMatch = href.match(/id=(\d+)/);
            const courseId = courseIdMatch ? courseIdMatch[1] : "";

            // Get course name
            const nameEl =
              el.querySelector(
                ".coursename, .course-fullname, h3, h4, .multiline"
              ) || el;
            const courseName = nameEl?.textContent?.trim() || "";

            // Get progress if available
            const progressEl = el.querySelector(
              ".progress-bar, [aria-valuenow]"
            );
            const progress =
              progressEl?.getAttribute("aria-valuenow") ||
              progressEl?.style?.width?.replace("%", "") ||
              "0";

            // Avoid duplicates
            if (
              courseName &&
              !courseList.some((c) => c.courseId === courseId)
            ) {
              courseList.push({
                courseId,
                courseName: courseName.substring(0, 200),
                courseUrl: href,
                progress: parseInt(progress) || 0,
              });
            }
          });
        });

        return courseList;
      });

      console.log(`Found ${courses.length} enrolled courses`);
      courses.forEach((c, i) =>
        console.log(`  ${i + 1}. ${c.courseName} (${c.progress}% complete)`)
      );

      // Save courses to database
      await saveCoursesToDatabase(userId, courses);

      // ============================================
      // STEP 2: SCRAPE CATS FROM EACH COURSE
      // ============================================
      console.log("\n=== SCRAPING CATS FROM COURSES ===");

      let allCats = [];

      for (const course of courses) {
        console.log(`\nChecking course: ${course.courseName}`);

        try {
          await page.goto(course.courseUrl, {
            waitUntil: "networkidle",
            timeout: 30000,
          });
          await page.waitForTimeout(1500);

          // Extract CATs/quizzes from this course
          const courseCats = await page.evaluate((courseName) => {
            const cats = [];

            // Look for quiz and assignment activities
            const activitySelectors = [
              "li.activity.quiz",
              "li.activity.assign",
              ".modtype_quiz",
              ".modtype_assign",
              'a[href*="mod/quiz/view.php"]',
              'a[href*="mod/assign/view.php"]',
            ];

            activitySelectors.forEach((selector) => {
              document.querySelectorAll(selector).forEach((el) => {
                const linkEl = el.tagName === "A" ? el : el.querySelector("a");
                const href = linkEl?.href || "";

                // Get activity name
                const nameEl =
                  el.querySelector(".instancename, .activityname, span") ||
                  linkEl;
                let activityName = nameEl?.textContent?.trim() || "";

                // Clean up name (remove accessibility text)
                activityName = activityName
                  .replace(/\s*(Quiz|Assignment)\s*$/i, "")
                  .trim();

                // Get date info if visible
                const dateEl = el.querySelector(
                  ".activity-date, .text-muted, small, time"
                );
                const dateText =
                  dateEl?.textContent?.trim() ||
                  dateEl?.getAttribute("datetime") ||
                  "";

                // Determine CAT number
                const catMatch = activityName.match(/CAT\s*(\d+)/i);
                const catNumber = catMatch ? parseInt(catMatch[1]) : 1;

                // Check if it's a CAT or quiz
                const isCAT =
                  activityName.toLowerCase().includes("cat") ||
                  activityName.toLowerCase().includes("quiz") ||
                  activityName.toLowerCase().includes("test");

                if (
                  activityName &&
                  (isCAT ||
                    href.includes("mod/quiz") ||
                    href.includes("mod/assign"))
                ) {
                  if (!cats.some((c) => c.href === href)) {
                    cats.push({
                      title: activityName,
                      subject: courseName,
                      date: dateText,
                      time: "",
                      venue: "Online",
                      catNumber,
                      href,
                      type: href.includes("quiz") ? "quiz" : "assignment",
                    });
                  }
                }
              });
            });

            return cats;
          }, course.courseName);

          console.log(
            `  Found ${courseCats.length} activities in ${course.courseName}`
          );

          // For each CAT found, ALWAYS visit the activity page to get exact date/time
          for (const cat of courseCats) {
            if (cat.href) {
              try {
                console.log(`    Visiting: ${cat.title}`);
                await page.goto(cat.href, {
                  waitUntil: "networkidle",
                  timeout: 20000,
                });
                await page.waitForTimeout(1000);

                // Extract EXACT date and time from quiz/assignment page
                const activityDetails = await page.evaluate(() => {
                  let dateInfo = "";
                  let timeInfo = "";
                  let fullDateTime = "";

                  // Method 1: Look for <time> elements with datetime attribute
                  const timeElements =
                    document.querySelectorAll("time[datetime]");
                  timeElements.forEach((el) => {
                    const dt = el.getAttribute("datetime");
                    if (dt && !fullDateTime) {
                      fullDateTime = dt;
                    }
                  });

                  // Method 2: Look for quiz timing information
                  const quizInfo = document.querySelector(
                    ".quizinfo, .quiztimer, #quiz-time-left"
                  );
                  if (quizInfo) {
                    const text = quizInfo.textContent;
                    console.log("Quiz info found:", text);
                  }

                  // Method 3: Look for "Close" or "Due" dates in Moodle format
                  const infoRows = document.querySelectorAll(
                    "tr, .info-item, .activity-instance"
                  );
                  infoRows.forEach((row) => {
                    const text = row.textContent || "";
                    // Match patterns like "Close: Tuesday, 17 December 2025, 11:59 PM"
                    // or "Due: 17 December 2025, 2:00 PM"
                    const closeMatch = text.match(
                      /(?:Close|Due|Closes|Opens?|Starts?|Deadline)[:\s]*([A-Za-z]+day,?\s*)?(\d{1,2}\s+[A-Za-z]+\s+\d{4})[,\s]+(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i
                    );
                    if (closeMatch) {
                      dateInfo = closeMatch[2];
                      timeInfo = closeMatch[3];
                    }
                  });

                  // Method 4: Search full page text for date patterns
                  if (!dateInfo) {
                    const pageText = document.body.innerText;

                    // Pattern: "17 December 2025, 11:59 PM" or "December 17, 2025 at 11:59 PM"
                    const patterns = [
                      /(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})[,\s]+(\d{1,2}:\d{2}\s*(?:AM|PM)?)/gi,
                      /(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}[,\s]+(?:at\s+)?(\d{1,2}:\d{2}\s*(?:AM|PM)?)/gi,
                      /(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/g,
                    ];

                    for (const pattern of patterns) {
                      const match = pageText.match(pattern);
                      if (match && match[0]) {
                        // Extract date and time from the match
                        const fullMatch = match[0];
                        const dateMatch = fullMatch.match(
                          /(\d{1,2}\s+[A-Za-z]+\s+\d{4}|\d{4}-\d{2}-\d{2})/
                        );
                        const timeMatch = fullMatch.match(
                          /(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i
                        );
                        if (dateMatch) dateInfo = dateMatch[1];
                        if (timeMatch) timeInfo = timeMatch[1];
                        break;
                      }
                    }
                  }

                  // Method 5: Look for data attributes
                  const activityDates = document.querySelector(
                    '[data-region="activity-dates"]'
                  );
                  if (activityDates) {
                    const timeEl = activityDates.querySelector("time");
                    if (timeEl) {
                      fullDateTime = timeEl.getAttribute("datetime") || "";
                    }
                  }

                  // Parse fullDateTime if we got it
                  if (fullDateTime && !dateInfo) {
                    // ISO format: 2025-12-17T14:00:00+03:00
                    const isoMatch = fullDateTime.match(
                      /(\d{4}-\d{2}-\d{2})T?(\d{2}:\d{2})?/
                    );
                    if (isoMatch) {
                      dateInfo = isoMatch[1];
                      if (isoMatch[2]) timeInfo = isoMatch[2];
                    }
                  }

                  return {
                    date: dateInfo,
                    time: timeInfo,
                    fullDateTime: fullDateTime,
                    pageTitle: document.title,
                  };
                });

                console.log(
                  `      Date found: ${activityDetails.date || "NONE"}, Time: ${
                    activityDetails.time || "NONE"
                  }`
                );

                if (activityDetails.date) {
                  cat.date = activityDetails.date;
                }
                if (activityDetails.time) {
                  cat.time = activityDetails.time;
                }
                if (activityDetails.fullDateTime && !cat.date) {
                  cat.date = activityDetails.fullDateTime;
                }
              } catch (e) {
                console.log(
                  `    ❌ Could not get details for: ${cat.title} - ${e.message}`
                );
              }
            }
          }

          allCats.push(...courseCats);
        } catch (e) {
          console.log(`  Error scraping course: ${e.message}`);
        }
      }

      // ============================================
      // STEP 3: CHECK CALENDAR FOR MORE EVENTS
      // ============================================
      console.log("\n=== CHECKING CALENDAR ===");
      await page.goto(CALENDAR_URL, {
        waitUntil: "networkidle",
        timeout: 30000,
      });
      await page.waitForTimeout(2000);

      await page.screenshot({ path: "./debug-calendar.png", fullPage: true });
      console.log("Calendar screenshot saved to debug-calendar.png");

      const calendarEvents = await page.evaluate(() => {
        const events = [];

        // Calendar event selectors
        document
          .querySelectorAll(
            '.event, [data-event-id], .calendar_event_course, [data-type="event"]'
          )
          .forEach((el) => {
            const title =
              el.textContent?.trim() ||
              el.getAttribute("data-event-title") ||
              "";
            const timeEl =
              el.querySelector("time") || el.querySelector(".date");
            const dateText =
              timeEl?.getAttribute("datetime") || timeEl?.textContent || "";
            const href =
              el.querySelector("a")?.href || el.getAttribute("href") || "";

            if (title && title.length > 3 && title.length < 200) {
              const catMatch = title.match(/CAT\s*(\d+)/i);
              events.push({
                title,
                subject: title.replace(/CAT\s*\d*/i, "").trim(),
                date: dateText,
                time: "",
                venue: "Online",
                catNumber: catMatch ? parseInt(catMatch[1]) : 1,
                href,
                type: "calendar",
              });
            }
          });

        return events;
      });

      console.log(`Found ${calendarEvents.length} events on calendar`);
      allCats.push(...calendarEvents);

      // ============================================
      // STEP 4: CHECK DASHBOARD UPCOMING ACTIVITIES
      // ============================================
      console.log("\n=== CHECKING DASHBOARD TIMELINE ===");
      await page.goto(DASHBOARD_URL, {
        waitUntil: "networkidle",
        timeout: 30000,
      });
      await page.waitForTimeout(2000);

      await page.screenshot({ path: "./debug-dashboard.png", fullPage: true });
      console.log("Dashboard screenshot saved to debug-dashboard.png");

      // Extract from dashboard timeline/upcoming activities
      const dashboardActivities = await page.evaluate(() => {
        const activities = [];

        // Timeline selectors
        const selectors = [
          '[data-region="timeline"] .event-list-item',
          '[data-region="timeline"] a',
          ".block_timeline .event-name",
          ".block_calendar_upcoming .event",
          ".event-name-container a",
        ];

        selectors.forEach((selector) => {
          document.querySelectorAll(selector).forEach((el) => {
            const text = el.textContent?.trim() || "";
            const href = el.getAttribute("href") || el.closest("a")?.href || "";

            if (text.length < 3 || text.length > 200) return;
            if (text.includes("Dashboard") || text.includes("Home")) return;

            const dateEl =
              el
                .closest(".event-list-item")
                ?.querySelector("time, .date, small") ||
              el.parentElement?.querySelector("time, .date, small");
            const dateText =
              dateEl?.getAttribute("datetime") ||
              dateEl?.textContent?.trim() ||
              "";

            const catMatch = text.match(/CAT\s*(\d+)/i);

            if (!activities.some((a) => a.title === text)) {
              activities.push({
                title: text,
                subject: text.replace(/CAT\s*\d*/i, "").trim(),
                date: dateText,
                time: "",
                venue: "Online",
                catNumber: catMatch ? parseInt(catMatch[1]) : 1,
                href,
                type: "timeline",
              });
            }
          });
        });

        return activities;
      });

      console.log(
        `Found ${dashboardActivities.length} activities on dashboard timeline`
      );
      allCats.push(...dashboardActivities);

      // ============================================
      // FINALIZE AND DEDUPLICATE
      // ============================================
      console.log("\n=== FINALIZING ===");

      // Remove duplicates based on title and href
      const uniqueCats = allCats.filter(
        (cat, index, self) =>
          index ===
          self.findIndex(
            (c) => c.title === cat.title || (c.href && c.href === cat.href)
          )
      );

      console.log(`Found ${uniqueCats.length} unique activities`);

      await browser.close();
      browser = null;

      // Convert to database format
      const formattedCats = uniqueCats.map((cat) => {
        // Parse date - handle various formats
        let catDate = new Date();
        let dateStr = cat.date || "";

        console.log(`Parsing date for "${cat.title}": "${dateStr}"`);

        try {
          // Handle empty or invalid date strings
          if (!dateStr || dateStr.trim() === "") {
            console.log("  Empty date, using today's date");
            catDate = new Date();
          }
          // Handle DD/MM/YYYY format
          else if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
            const [day, month, year] = dateStr.split("/");
            catDate = new Date(Date.UTC(year, month - 1, day));
            console.log(`  Parsed DD/MM/YYYY: ${catDate.toISOString()}`);
          }
          // Handle YYYY-MM-DD format
          else if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
            catDate = new Date(dateStr.split("T")[0]);
            console.log(`  Parsed ISO date: ${catDate.toISOString()}`);
          }
          // Try standard parsing
          else {
            const parsed = new Date(dateStr);
            if (!isNaN(parsed.getTime())) {
              catDate = parsed;
              console.log(`  Standard parse: ${catDate.toISOString()}`);
            } else {
              console.log(`  Failed to parse, using today's date`);
              catDate = new Date();
            }
          }
        } catch (e) {
          console.error(`  Error parsing date "${dateStr}":`, e.message);
          catDate = new Date();
        }

        // Ensure catDate is valid before calling toISOString
        if (isNaN(catDate.getTime())) {
          console.log("  Invalid date detected, using today's date");
          catDate = new Date();
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
          venue: "Online",
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

// Save scraped CATs to database and notify about new ones

async function saveCATsToDatabase(userId, cats) {
  try {
    // First, get existing CATs to compare
    const existingResult = await pool.query(
      `SELECT subject_name, cat_date, cat_number FROM cats WHERE user_id = $1`,
      [userId]
    );

    const existingCats = new Set(
      existingResult.rows.map(
        (c) => `${c.subject_name}-${c.cat_date}-${c.cat_number}`
      )
    );

    // Delete old CATs for this user (to avoid duplicates)
    await pool.query("DELETE FROM cats WHERE user_id = $1", [userId]);

    const newCats = [];
    const insertedCats = [];

    // Insert new CATs
    for (const cat of cats) {
      const result = await pool.query(
        `INSERT INTO cats (user_id, subject_code, subject_name, cat_date, cat_time, venue, cat_number, duration)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
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

      insertedCats.push(result.rows[0]);

      // Check if this is a new CAT
      const catKey = `${cat.subject_name}-${cat.cat_date}-${cat.cat_number}`;
      if (!existingCats.has(catKey)) {
        newCats.push(result.rows[0]);
      }
    }

    console.log(`Saved ${cats.length} CATs to database`);

    // Notify user about new CATs
    if (newCats.length > 0) {
      console.log(
        `📢 Found ${newCats.length} NEW CATs - sending notification...`
      );
      await notifyNewCATs(userId, newCats);
    }

    // Create reminders for all CATs
    await createRemindersForCATs(userId, insertedCats);
  } catch (error) {
    console.error("Error saving CATs to database:", error);
    throw error;
  }
}

// Save scraped courses to database
async function saveCoursesToDatabase(userId, courses) {
  try {
    // Delete old courses for this user (to avoid duplicates)
    await pool.query("DELETE FROM courses WHERE user_id = $1", [userId]);

    let totalProgress = 0;

    // Insert new courses
    for (const course of courses) {
      await pool.query(
        `INSERT INTO courses (user_id, course_id, course_name, course_url, progress)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id, course_id) DO UPDATE SET
           course_name = EXCLUDED.course_name,
           progress = EXCLUDED.progress,
           updated_at = CURRENT_TIMESTAMP`,
        [
          userId,
          course.courseId,
          course.courseName,
          course.courseUrl,
          course.progress,
        ]
      );
      totalProgress += course.progress;
    }

    // Update user's average completion rate
    const avgProgress =
      courses.length > 0 ? Math.round(totalProgress / courses.length) : 0;
    await pool.query(
      `UPDATE users SET completion_rate = $1, total_courses = $2 WHERE id = $3`,
      [avgProgress, courses.length, userId]
    );

    console.log(
      `Saved ${courses.length} courses to database (avg progress: ${avgProgress}%)`
    );
  } catch (error) {
    // Table might not exist yet, log warning but don't fail
    console.warn("Warning saving courses:", error.message);
    console.log(
      "Courses table may not exist - continuing with CAT scraping..."
    );
  }
}

// Scrape CATs for all connected users based on their frequency preferences
export async function scrapeAllUsers() {
  try {
    // Get users whose scrape is due based on their frequency preference
    const result = await pool.query(`
      SELECT id, scrape_frequency, last_scraped_at FROM users 
      WHERE portal_connected = true
      AND (
        last_scraped_at IS NULL
        OR (scrape_frequency = 'daily' AND last_scraped_at < NOW() - INTERVAL '1 day')
        OR (scrape_frequency = 'every_2_days' AND last_scraped_at < NOW() - INTERVAL '2 days')
        OR (scrape_frequency = 'every_3_days' AND last_scraped_at < NOW() - INTERVAL '3 days')
        OR (scrape_frequency = 'weekly' AND last_scraped_at < NOW() - INTERVAL '7 days')
        OR scrape_frequency IS NULL
      )
    `);

    console.log(`Found ${result.rows.length} users due for scraping`);

    for (const user of result.rows) {
      try {
        await scrapeCATsForUser(user.id);

        // Update last_scraped_at after successful scrape
        await pool.query(
          "UPDATE users SET last_scraped_at = NOW() WHERE id = $1",
          [user.id]
        );
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

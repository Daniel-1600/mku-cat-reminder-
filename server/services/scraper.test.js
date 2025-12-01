import { chromium } from "playwright";
import { mkdirSync, existsSync } from "fs";

// ============================================
// CONFIGURATION
// ============================================

// Replace with real credentials for live testing
const TEST_CONFIG = {
  email: "bit202443623@mylife.mku.ac.ke",
  password: "4148Dan!",
  portalUrl: "https://vlms.mku.ac.ke",
  loginUrl: "https://vlms.mku.ac.ke/login/index.php",
  dashboardUrl: "https://vlms.mku.ac.ke/my/",
  screenshotsDir: "./test-screenshots",
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function log(message, type = "info") {
  const icons = {
    info: "📍",
    success: "✅",
    error: "❌",
    warning: "⚠️",
    test: "🧪",
  };
  console.log(`${icons[type] || "•"} ${message}`);
}

function createScreenshotsDir() {
  if (!existsSync(TEST_CONFIG.screenshotsDir)) {
    mkdirSync(TEST_CONFIG.screenshotsDir, { recursive: true });
    log(`Created screenshots directory: ${TEST_CONFIG.screenshotsDir}`);
  }
}

// Random delay to mimic human behavior (1-3 seconds)
function humanDelay(min = 1000, max = 3000) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

// UNIT TESTS (No browser needed)

function testCATNumberExtraction() {
  log("Testing CAT number extraction...", "test");

  const testCases = [
    { input: "Mathematics CAT 1", expected: 1 },
    { input: "Physics CAT 2 - Week 5", expected: 2 },
    { input: "CAT3 Chemistry", expected: 3 },
    { input: "Introduction to Programming CAT", expected: 1 },
    { input: "Data Structures cat 4", expected: 4 },
  ];

  let passed = 0;
  let failed = 0;

  testCases.forEach(({ input, expected }) => {
    const match = input.match(/CAT\s*(\d+)/i);
    const result = match ? parseInt(match[1]) : 1;

    if (result === expected) {
      passed++;
      log(`  ✓ "${input}" → CAT ${result}`, "success");
    } else {
      failed++;
      log(`  ✗ "${input}" → Got ${result}, expected ${expected}`, "error");
    }
  });

  log(`CAT number extraction: ${passed}/${testCases.length} passed\n`);
  return failed === 0;
}

function testSubjectExtraction() {
  log("Testing subject name extraction...", "test");

  const testCases = [
    { input: "Mathematics - CAT 1", expected: "Mathematics" },
    {
      input: "Introduction to Programming CAT 2",
      expected: "Introduction to Programming",
    },
    { input: "CAT 1 - Physics", expected: "Physics" },
    {
      input: "Data Structures and Algorithms CAT",
      expected: "Data Structures and Algorithms",
    },
  ];

  let passed = 0;
  let failed = 0;

  testCases.forEach(({ input, expected }) => {
    const subjectMatch =
      input.match(/^(.+?)\s*-?\s*CAT/i) ||
      input.match(/CAT\s*\d*\s*-?\s*(.+)$/i);
    const result = subjectMatch ? subjectMatch[1].trim() : input;

    if (result === expected) {
      passed++;
      log(`  ✓ "${input}" → "${result}"`, "success");
    } else {
      failed++;
      log(`  ✗ "${input}" → Got "${result}", expected "${expected}"`, "error");
    }
  });

  log(`Subject extraction: ${passed}/${testCases.length} passed\n`);
  return failed === 0;
}

function parseDate(input) {
  // Handle DD/MM/YYYY format
  const ddmmyyyy = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    return new Date(Date.UTC(year, month - 1, day));
  }

  // Handle "Month Day, Year" format (e.g., "December 15, 2024")
  const monthDayYear = input.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (monthDayYear) {
    const [, monthName, day, year] = monthDayYear;
    const months = {
      january: 0,
      february: 1,
      march: 2,
      april: 3,
      may: 4,
      june: 5,
      july: 6,
      august: 7,
      september: 8,
      october: 9,
      november: 10,
      december: 11,
    };
    const month = months[monthName.toLowerCase()];
    if (month !== undefined) {
      return new Date(Date.UTC(year, month, day));
    }
  }

  // Handle YYYY-MM-DD format (ISO format)
  const isoFormat = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoFormat) {
    const [, year, month, day] = isoFormat;
    return new Date(Date.UTC(year, month - 1, day));
  }

  // Default parsing (may have timezone issues)
  return new Date(input);
}

function testDateParsing() {
  log("Testing date parsing...", "test");

  const testCases = [
    { input: "2024-12-15", expected: "2024-12-15" },
    { input: "December 15, 2024", expected: "2024-12-15" },
    { input: "15/12/2024", expected: "2024-12-15" },
  ];

  let passed = 0;
  let failed = 0;

  testCases.forEach(({ input, expected }) => {
    try {
      const date = parseDate(input);
      const result = date.toISOString().split("T")[0];

      if (result === expected) {
        passed++;
        log(`  ✓ "${input}" → "${result}"`, "success");
      } else {
        failed++;
        log(
          `  ✗ "${input}" → Got "${result}", expected "${expected}"`,
          "error"
        );
      }
    } catch (e) {
      failed++;
      log(`  ✗ "${input}" → Parse error: ${e.message}`, "error");
    }
  });

  log(`Date parsing: ${passed}/${testCases.length} passed\n`);
  return failed === 0;
}

// ============================================
// INTEGRATION TESTS (Browser required)
// ============================================

async function testBrowserLaunch() {
  log("Testing Playwright browser launch...", "test");

  try {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto("https://example.com");
    const title = await page.title();

    await browser.close();

    if (title) {
      log(`  Browser launched successfully, got title: "${title}"`, "success");
      return true;
    }
    return false;
  } catch (error) {
    log(`  Browser launch failed: ${error.message}`, "error");
    return false;
  }
}

async function testPortalReachability() {
  log("Testing MKU portal reachability...", "test");

  try {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    });
    const page = await context.newPage();

    const response = await page.goto(TEST_CONFIG.loginUrl, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    const status = response?.status();
    await browser.close();

    if (status === 200) {
      log(`  Portal reachable (status: ${status})`, "success");
      return true;
    } else {
      log(`  Portal returned status: ${status}`, "warning");
      return false;
    }
  } catch (error) {
    log(`  Portal unreachable: ${error.message}`, "error");
    return false;
  }
}

async function testLoginPageElements() {
  log("Testing login page elements...", "test");

  try {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(TEST_CONFIG.loginUrl, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    const currentUrl = page.url();
    log(`  Current URL: ${currentUrl}`);

    let emailField, passwordField, submitButton;

    // Check if redirected to Microsoft OAuth
    if (
      currentUrl.includes("microsoftonline.com") ||
      currentUrl.includes("login.microsoft")
    ) {
      log("  Detected Microsoft OAuth login page", "info");
      // Microsoft OAuth login elements
      emailField = await page.$('input[type="email"]');
      // Password field appears on next step, so we just check for email
      passwordField = true; // Will be shown after email is submitted
      submitButton = await page.$('input[type="submit"]');
    } else {
      // Standard Moodle login elements
      emailField =
        (await page.$('input[name="email"]')) ||
        (await page.$('input[type="email"]')) ||
        (await page.$('input[name="username"]'));
      passwordField = await page.$('input[name="password"]');
      submitButton = await page.$(
        'button[type="submit"], input[type="submit"]'
      );
    }

    await page.screenshot({
      path: `${TEST_CONFIG.screenshotsDir}/login-page-test.png`,
    });

    await browser.close();

    const results = {
      emailField: !!emailField,
      passwordField: !!passwordField,
      submitButton: !!submitButton,
    };

    log(`  Email field: ${results.emailField ? "✓" : "✗"}`);
    log(`  Password field: ${results.passwordField ? "✓ (multi-step)" : "✗"}`);
    log(`  Submit button: ${results.submitButton ? "✓" : "✗"}`);

    return results.emailField && results.passwordField && results.submitButton;
  } catch (error) {
    log(`  Login page test failed: ${error.message}`, "error");
    return false;
  }
}

// ============================================
// LIVE SCRAPING TEST (Requires real credentials)
// ============================================

async function testRealScraping() {
  log("\n🔐 Testing REAL scraping with credentials...", "test");
  log(
    "⚠️  Make sure to update TEST_CONFIG with real credentials!\n",
    "warning"
  );

  if (
    TEST_CONFIG.email === "your-portal-email" ||
    TEST_CONFIG.password === "your-portal-password"
  ) {
    log("Skipping: No real credentials provided", "warning");
    log("Edit scraper.test.js and update TEST_CONFIG to run this test\n");
    return false;
  }

  const browser = await chromium.launch({
    headless: false, // Show browser for debugging
    slowMo: 150, // Slower to mimic human speed
  });

  // Stealth settings to avoid detection
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    viewport: { width: 1366, height: 768 },
    locale: "en-KE",
    timezoneId: "Africa/Nairobi",
    // Mimic real browser permissions
    permissions: ["geolocation"],
  });

  // Add stealth scripts to avoid bot detection
  await context.addInitScript(() => {
    // Override webdriver detection
    Object.defineProperty(navigator, "webdriver", { get: () => false });
    // Add plugins (real browsers have these)
    Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3, 4, 5] });
    // Add languages
    Object.defineProperty(navigator, "languages", {
      get: () => ["en-US", "en"],
    });
  });

  const page = await context.newPage();

  try {
    // Step 1: Go to login page
    log("Step 1: Navigating to login page...");
    await page.goto(TEST_CONFIG.loginUrl, {
      waitUntil: "networkidle",
      timeout: 60000,
    });
    await page.screenshot({
      path: `${TEST_CONFIG.screenshotsDir}/01-login-page.png`,
    });

    // Check if redirected to Microsoft OAuth login
    const currentUrl = page.url();
    log(`Current URL: ${currentUrl}`);

    if (
      currentUrl.includes("microsoftonline.com") ||
      currentUrl.includes("login.microsoft")
    ) {
      // ============================================
      // MICROSOFT OAUTH LOGIN FLOW (Multi-step)
      // ============================================
      log("Detected Microsoft OAuth login...", "info");

      // Step 2a: Enter email on Microsoft login page
      log("Step 2a: Entering email on Microsoft login...");
      await page.waitForSelector('input[type="email"]', { timeout: 30000 });
      await page.fill('input[type="email"]', TEST_CONFIG.email);
      await page.screenshot({
        path: `${TEST_CONFIG.screenshotsDir}/02a-microsoft-email.png`,
      });

      // Click Next button
      log("Step 2b: Clicking Next...");
      await page.click('input[type="submit"]');
      await page.waitForTimeout(3000); // Wait for password page to load

      // Step 2c: Enter password (Microsoft shows password on separate page)
      log("Step 2c: Entering password...");
      await page.waitForSelector('input[type="password"]', { timeout: 30000 });
      await page.fill('input[type="password"]', TEST_CONFIG.password);
      await page.screenshot({
        path: `${TEST_CONFIG.screenshotsDir}/02c-microsoft-password.png`,
      });

      // Click Sign in button
      log("Step 2d: Clicking Sign in...");
      await page.click('input[type="submit"]');
      await page.waitForTimeout(5000); // Wait for redirect

      // Handle "Stay signed in?" prompt if it appears
      const staySignedIn = await page.$('input[type="submit"][value="Yes"]');
      if (staySignedIn) {
        log("Step 2e: Handling 'Stay signed in' prompt...");
        await page.screenshot({
          path: `${TEST_CONFIG.screenshotsDir}/02e-stay-signed-in.png`,
        });
        await staySignedIn.click();
        await page.waitForTimeout(3000);
      }

      // Also check for "Don't show this again" checkbox
      const dontShowAgain = await page.$("#KmsLchb");
      if (dontShowAgain) {
        await dontShowAgain.check();
      }

      // Wait for redirect back to MKU portal
      log("Step 2f: Waiting for redirect to portal...");
      await page.waitForURL(/vlms\.mku\.ac\.ke/, { timeout: 60000 });
    } else {
      // ============================================
      // STANDARD MOODLE LOGIN FLOW
      // ============================================
      log("Using standard Moodle login...", "info");

      // Step 2: Fill credentials
      log("Step 2: Filling credentials...");
      const emailField =
        (await page.$('input[name="email"]')) ||
        (await page.$('input[type="email"]')) ||
        (await page.$('input[name="username"]'));
      if (emailField) {
        await emailField.fill(TEST_CONFIG.email);
      } else {
        await page.fill('input[name="username"]', TEST_CONFIG.email);
      }
      await page.fill('input[name="password"]', TEST_CONFIG.password);
      await page.screenshot({
        path: `${TEST_CONFIG.screenshotsDir}/02-credentials-filled.png`,
      });

      // Step 3: Submit login
      log("Step 3: Submitting login...");
      await Promise.all([
        page.click('button[type="submit"], input[type="submit"]'),
        page.waitForNavigation({ waitUntil: "networkidle", timeout: 30000 }),
      ]);
    }

    const afterLoginUrl = page.url();
    await page.screenshot({
      path: `${TEST_CONFIG.screenshotsDir}/03-after-login.png`,
    });

    if (
      afterLoginUrl.includes("login") &&
      !afterLoginUrl.includes("vlms.mku.ac.ke/my")
    ) {
      log(`Login may have failed - current URL: ${afterLoginUrl}`, "warning");
    } else {
      log(`Login successful! Current URL: ${afterLoginUrl}`, "success");
    }

    // Step 4: Go to dashboard
    log("Step 4: Navigating to dashboard...");
    await page.goto(TEST_CONFIG.dashboardUrl, {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: `${TEST_CONFIG.screenshotsDir}/04-dashboard.png`,
      fullPage: true,
    });

    // Step 5: Check Calendar for upcoming events
    log("Step 5: Checking calendar for upcoming events...");
    await page.goto("https://vlms.mku.ac.ke/calendar/view.php?view=upcoming", {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: `${TEST_CONFIG.screenshotsDir}/05-calendar.png`,
      fullPage: true,
    });

    // Step 6: Extract ALL activities (CATs, Quizzes, Assignments)
    log("Step 6: Extracting all activities...");

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
      ];

      selectors.forEach((selector) => {
        document.querySelectorAll(selector).forEach((el) => {
          const text = el.textContent?.trim() || "";
          if (text.length > 3 && text.length < 200) {
            activities.push({
              text: text,
              selector: selector,
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
        const eventId = el.getAttribute("data-event-id");
        const timeEl = el.querySelector("time") || el.querySelector(".date");
        const dateText =
          timeEl?.getAttribute("datetime") || timeEl?.textContent || "";

        if (title) {
          activities.push({
            text: title,
            date: dateText,
            eventId: eventId,
            href: el.querySelector("a")?.href || "",
          });
        }
      });

      // Get all text mentioning CAT, Quiz, Assignment, Test
      const allText = document.body.innerText;
      const relevantLines = allText.split("\\n").filter((line) => {
        const lower = line.toLowerCase();
        return (
          (lower.includes("cat") ||
            lower.includes("quiz") ||
            lower.includes("assignment") ||
            lower.includes("test")) &&
          line.length > 5 &&
          line.length < 200
        );
      });

      return {
        activities,
        relevantLines: relevantLines.slice(0, 20),
        pageTitle: document.title,
        pageUrl: window.location.href,
      };
    });

    log(`\n📊 Results:`, "info");
    log(`  Page title: ${cats.pageTitle}`);
    log(`  Page URL: ${cats.pageUrl}`);
    log(`  Activities found: ${cats.activities.length}`);
    log(`  Relevant lines: ${cats.relevantLines.length}`);

    // ============================================
    // PARSE AND DISPLAY CAT DATA
    // ============================================
    const parsedCATs = [];
    const now = new Date();

    // Parse activities
    cats.activities.forEach((activity) => {
      const catData = {
        name: activity.text,
        url: activity.href || "",
        dueDate: null,
        status: "unknown",
        daysRemaining: null,
      };

      // Try to extract date from activity date field or text
      const dateStr = activity.date || activity.text;
      const dateMatch = dateStr.match(
        /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})|(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/
      );
      if (dateMatch) {
        try {
          catData.dueDate = new Date(dateMatch[0]);
          const diff = catData.dueDate - now;
          catData.daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
          catData.status = catData.daysRemaining > 0 ? "pending" : "overdue";
        } catch (e) {}
      }

      parsedCATs.push(catData);
    });

    // Also parse relevant lines for additional data
    cats.relevantLines.forEach((line) => {
      if (!parsedCATs.some((c) => c.name.includes(line.substring(0, 30)))) {
        parsedCATs.push({
          name: line,
          url: "",
          dueDate: null,
          status: "unknown",
          daysRemaining: null,
        });
      }
    });

    // Separate pending and completed CATs
    const pendingCATs = parsedCATs.filter(
      (c) => c.status === "pending" || c.status === "unknown"
    );
    const overdueCATs = parsedCATs.filter((c) => c.status === "overdue");

    // ============================================
    // CONSOLE LOG THE RESULTS
    // ============================================
    console.log("\n" + "=".repeat(60));
    console.log("📚 YOUR CAT STATUS REPORT");
    console.log("=".repeat(60));
    console.log(
      `📅 Date: ${now.toLocaleDateString("en-KE", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })}`
    );
    console.log(`🕐 Time: ${now.toLocaleTimeString("en-KE")}`);
    console.log("=".repeat(60));

    if (pendingCATs.length > 0) {
      console.log("\n🔴 PENDING CATs (" + pendingCATs.length + "):");
      console.log("-".repeat(40));
      pendingCATs.forEach((cat, i) => {
        console.log(`\n  ${i + 1}. ${cat.name}`);
        if (cat.dueDate) {
          console.log(`     📅 Due: ${cat.dueDate.toLocaleDateString()}`);
          console.log(`     ⏳ Days remaining: ${cat.daysRemaining}`);
        }
        if (cat.url) {
          console.log(`     🔗 Link: ${cat.url}`);
        }
      });
    } else {
      console.log("\n✅ ALL CATS DONE! 🎉");
      console.log("-".repeat(40));
      console.log("Great job! You have no pending CATs.");
      console.log("Enjoy your free time! 🎊");
    }

    if (overdueCATs.length > 0) {
      console.log("\n⚠️ OVERDUE CATs (" + overdueCATs.length + "):");
      console.log("-".repeat(40));
      overdueCATs.forEach((cat, i) => {
        console.log(`  ${i + 1}. ${cat.name}`);
        if (cat.dueDate) {
          console.log(`     📅 Was due: ${cat.dueDate.toLocaleDateString()}`);
          console.log(`     ❌ Days overdue: ${Math.abs(cat.daysRemaining)}`);
        }
      });
    }

    console.log("\n" + "=".repeat(60));
    console.log(`📊 Total CATs found: ${parsedCATs.length}`);
    console.log(`   ✅ Pending: ${pendingCATs.length}`);
    console.log(`   ❌ Overdue: ${overdueCATs.length}`);
    console.log("=".repeat(60) + "\n");

    // Save data to JSON file
    const outputData = {
      scrapedAt: now.toISOString(),
      email: TEST_CONFIG.email,
      summary: {
        total: parsedCATs.length,
        pending: pendingCATs.length,
        overdue: overdueCATs.length,
      },
      pendingCATs,
      overdueCATs,
      allCATs: parsedCATs,
    };

    const { writeFileSync } = await import("fs");
    writeFileSync(
      `${TEST_CONFIG.screenshotsDir}/cat-data.json`,
      JSON.stringify(outputData, null, 2)
    );
    console.log(
      `💾 Data saved to: ${TEST_CONFIG.screenshotsDir}/cat-data.json`
    );

    if (cats.activities.length > 0) {
      log("\n🎯 Raw Activities Found:");
      cats.activities.forEach((a, i) => {
        log(`  ${i + 1}. ${a.text}`);
      });
    }

    if (cats.relevantLines && cats.relevantLines.length > 0) {
      log("\n📝 Relevant Lines Found:");
      cats.relevantLines.forEach((m, i) => {
        log(`  ${i + 1}. ${m}`);
      });
    }

    await page.screenshot({
      path: `${TEST_CONFIG.screenshotsDir}/05-final.png`,
      fullPage: true,
    });

    log("\n✅ Real scraping test completed!", "success");
    await browser.close();
    return true;
  } catch (error) {
    log(`Test failed: ${error.message}`, "error");
    await page.screenshot({
      path: `${TEST_CONFIG.screenshotsDir}/error.png`,
    });
    await browser.close();
    return false;
  }
}

// ============================================
// MOCK DATA TEST
// ============================================

function testMockDataProcessing() {
  log("Testing mock data processing...", "test");

  // Simulate scraped data
  const mockScrapedData = [
    {
      title: "Introduction to Programming - CAT 1",
      subject: "Introduction to Programming",
      date: "2024-12-15",
      time: "10:00 AM",
      venue: "Room 101",
      catNumber: 1,
    },
    {
      title: "Data Structures CAT 2",
      subject: "Data Structures",
      date: "2024-12-18",
      time: "2:00 PM",
      venue: "Lab 3",
      catNumber: 2,
    },
    {
      title: "Mathematics CAT",
      subject: "Mathematics",
      date: "",
      time: "",
      venue: "",
      catNumber: 1,
    },
  ];

  // Process like the real scraper does
  const formattedCats = mockScrapedData.map((cat) => {
    let catDate = new Date();
    try {
      if (cat.date) {
        catDate = new Date(cat.date);
      }
    } catch (e) {}

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
      duration: 120,
    };
  });

  log(`  Processed ${formattedCats.length} CATs:`, "success");
  formattedCats.forEach((cat, i) => {
    log(
      `    ${i + 1}. ${cat.subject_name} - CAT ${cat.cat_number} on ${
        cat.cat_date
      }`
    );
  });

  return formattedCats.length === mockScrapedData.length;
}

// ============================================
// MAIN TEST RUNNER
// ============================================

async function runTests() {
  console.log("\n" + "=".repeat(50));
  console.log("🧪 MKU Portal Scraper - Test Suite");
  console.log("=".repeat(50) + "\n");

  createScreenshotsDir();

  const results = {
    unit: {
      catNumberExtraction: false,
      subjectExtraction: false,
      dateParsing: false,
      mockDataProcessing: false,
    },
    integration: {
      browserLaunch: false,
      portalReachability: false,
      loginPageElements: false,
    },
    live: {
      realScraping: false,
    },
  };

  // Run unit tests
  console.log("\n" + "-".repeat(40));
  console.log("📦 UNIT TESTS");
  console.log("-".repeat(40) + "\n");

  results.unit.catNumberExtraction = testCATNumberExtraction();
  results.unit.subjectExtraction = testSubjectExtraction();
  results.unit.dateParsing = testDateParsing();
  results.unit.mockDataProcessing = testMockDataProcessing();

  // Run integration tests
  console.log("\n" + "-".repeat(40));
  console.log("🔌 INTEGRATION TESTS");
  console.log("-".repeat(40) + "\n");

  results.integration.browserLaunch = await testBrowserLaunch();
  results.integration.portalReachability = await testPortalReachability();
  results.integration.loginPageElements = await testLoginPageElements();

  // Check for --real flag
  const args = process.argv.slice(2);
  if (args.includes("--real")) {
    console.log("\n" + "-".repeat(40));
    console.log("🔐 LIVE SCRAPING TEST");
    console.log("-".repeat(40) + "\n");

    results.live.realScraping = await testRealScraping();
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 TEST SUMMARY");
  console.log("=".repeat(50) + "\n");

  let totalPassed = 0;
  let totalFailed = 0;

  Object.entries(results).forEach(([category, tests]) => {
    console.log(`${category.toUpperCase()}:`);
    Object.entries(tests).forEach(([test, passed]) => {
      const icon = passed ? "✅" : "❌";
      console.log(`  ${icon} ${test}`);
      if (passed) totalPassed++;
      else totalFailed++;
    });
    console.log();
  });

  console.log("-".repeat(40));
  console.log(`Total: ${totalPassed} passed, ${totalFailed} failed`);
  console.log("-".repeat(40));

  if (!args.includes("--real")) {
    console.log(
      "\n💡 Tip: Run with --real flag to test with real credentials:"
    );
    console.log("   node services/scraper.test.js --real\n");
  }

  console.log(`📸 Screenshots saved to: ${TEST_CONFIG.screenshotsDir}/\n`);
}

// Run tests
runTests().catch(console.error);

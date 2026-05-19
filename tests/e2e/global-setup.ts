import { chromium, FullConfig } from "@playwright/test";
import path from "path";
import fs from "fs";

export default async function globalSetup(config: FullConfig) {
  const authDir = path.join(__dirname, ".auth");
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

  const base = (config.projects[0]?.use?.baseURL ?? "http://localhost:3000").replace(/\/$/, "");
  const browser = await chromium.launch();

  /**
   * Log in via the UI using locator.fill() which properly triggers React's
   * onChange (unlike keyboard.type which can race with controlled-input state).
   * storageState() then captures both cookies AND localStorage in one call.
   */
  async function saveAuth(
    loginPath: string,
    username: string,
    password: string,
    waitPattern: RegExp,
    filename: string,
  ) {
    const ctx  = await browser.newContext();
    const page = await ctx.newPage();
    try {
      await page.goto(`${base}${loginPath}`);

      // fill() properly sets React controlled-input value (fires input+change events)
      await page.locator("input:not([type='password'])").first().fill(username);
      await page.locator("input[type='password']").first().fill(password);

      // Wait until the Sign In button is enabled (React state fully updated)
      const btn = page.getByRole("button", { name: /sign in/i });
      await btn.waitFor({ state: "visible", timeout: 10_000 });
      // Wait until the Sign In button is no longer disabled (React state updated)
      await page.waitForFunction(
        () => !document.querySelector("button[disabled]"),
        { timeout: 5_000 },
      ).catch(() => {}); // fallback to force-click if button stays disabled
      await btn.click({ force: true });

      await page.waitForURL(waitPattern, { timeout: 30_000, waitUntil: "domcontentloaded" });
      await ctx.storageState({ path: path.join(authDir, filename) });
      console.log(`  ✓ saved auth: ${filename} (${username})`);
    } catch (e) {
      console.error(`  ✗ failed auth: ${filename} (${username}) —`, (e as Error).message);
    } finally {
      await ctx.close();
    }
  }

  // Negative lookahead: /admin-login must NOT match (only /admin or /owner after login)
  const adminPattern   = /\/(admin|owner)(?!-login)/;
  const teacherPattern = /\/teacher-dashboard/;

  await saveAuth("/admin-login",   "admin",         "Evergreen@2025", adminPattern,   "admin.json");
  await saveAuth("/admin-login",   "owner",         "Evergreen@2025", adminPattern,   "owner.json");
  await saveAuth("/teacher-login", "praveena",      "Teacher@123",    teacherPattern, "teacher.json");
  // bhagyalakshmi is a Coordinator — redirects to /admin after teacher login
  await saveAuth("/teacher-login", "bhagyalakshmi", "Teacher@123",    adminPattern,   "teacher2.json");

  await browser.close();
}

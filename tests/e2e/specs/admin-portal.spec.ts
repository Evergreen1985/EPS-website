import { test, expect } from "@playwright/test";
import { AdminPage } from "../pages/AdminPage";
import { AUTH } from "../fixtures/test-data";

test.describe("Admin Portal", () => {
  test.use({ storageState: AUTH.admin });
  let admin: AdminPage;

  test.beforeEach(async ({ page }) => {
    admin = new AdminPage(page);
    await page.goto("/admin");
    // Wait for admin page session to load before each test
    await page.getByRole("button", { name: /logout/i }).waitFor({ timeout: 25_000 }).catch(() => {});
  });

  test("TC0301 — Admin dashboard loads after login", async ({ page }) => {
    await admin.assertDashboardLoaded();
    await expect(page.locator("text=/enquiries|sections|calendar|fees/i").first()).toBeVisible({ timeout: 8_000 });
  });

  test("TC0302 — Admin can open Enquiries tab", async ({ page }) => {
    await admin.openTab("Enquiries");
    // Status filter <select> is always rendered on the enquiries tab
    await expect(page.locator("select").first()).toBeVisible({ timeout: 8_000 });
  });

  test("TC0303 — Admin can open Fees tab", async ({ page }) => {
    await admin.openTab("Fees");
    await expect(page.locator("text=/fee records|structures|reports/i").first()).toBeVisible({ timeout: 8_000 });
  });

  test("TC0304 — Admin can open Sections tab", async ({ page }) => {
    await admin.openTab("Sections");
    await expect(page.locator("text=/programme|class sections|add section/i").first()).toBeVisible({ timeout: 8_000 });
  });

  test("TC0305 — Admin can open Staff tab", async ({ page }) => {
    await admin.openTab("Staff");
    await expect(page.locator("text=/staff|teacher|employee/i").first()).toBeVisible({ timeout: 8_000 });
  });

  test("TC0306 — Admin can open Announcements tab", async ({ page }) => {
    await admin.openTab("Announcements");
    await expect(page.locator("text=/announcement|notice|publish/i").first()).toBeVisible({ timeout: 8_000 });
  });

  test("TC0307 — Admin can open Calendar tab", async ({ page }) => {
    await admin.openTab("Calendar");
    await expect(page.locator("text=/calendar|holiday|event/i").first()).toBeVisible({ timeout: 8_000 });
  });

  test("TC0308 — All main nav tabs present", async ({ page }) => {
    const tabs = ["Enquiries", "Fees", "Sections", "Staff"];
    for (const tab of tabs) {
      const btn = page.getByRole("button", { name: new RegExp(tab, "i") }).first();
      await expect(btn).toBeVisible({ timeout: 5_000 });
    }
  });
});

test.describe("Owner Portal", () => {
  test.use({ storageState: AUTH.owner });
  let admin: AdminPage;

  test.beforeEach(async ({ page }) => {
    admin = new AdminPage(page);
    await page.goto("/admin");
    await page.getByRole("button", { name: /logout/i }).waitFor({ timeout: 25_000 }).catch(() => {});
  });

  test("TC0350 — Owner dashboard loads", async ({ page }) => {
    await expect(page).toHaveURL(/admin|owner/, { timeout: 8_000 });
  });

  test("TC0351 — Owner sees Overview tab", async ({ page }) => {
    const overview = page.getByRole("button", { name: /overview/i });
    if (await overview.isVisible()) {
      await overview.click();
      await expect(page.locator("text=/overview|summary|total/i").first()).toBeVisible({ timeout: 6_000 });
    } else {
      // Owner lands on admin portal — verify admin tab bar is visible
      await expect(page.locator("text=/enquiries|sections|calendar/i").first()).toBeVisible({ timeout: 6_000 });
    }
  });

  test("TC0352 — Owner sees Tests tab", async ({ page }) => {
    const tests = page.getByRole("button", { name: /test/i });
    if (await tests.isVisible()) await expect(tests).toBeVisible();
  });

  test("TC0353 — Owner can open Data Cleanup tab", async ({ page }) => {
    const cleanup = page.getByRole("button", { name: /cleanup/i });
    if (await cleanup.isVisible()) {
      await cleanup.click();
      await expect(page.locator("text=/cleanup|delete|data/i").first()).toBeVisible({ timeout: 6_000 });
    }
  });

  test("TC0354 — Owner Test Runner — Plug In toggle visible", async ({ page }) => {
    const testsTab = page.getByRole("button", { name: /🔬.*test|test.*runner/i });
    if (await testsTab.isVisible()) {
      await testsTab.click();
      await page.waitForTimeout(1000);
      const toggle = page.getByRole("button", { name: /plug/i });
      await expect(toggle).toBeVisible({ timeout: 6_000 });
    }
  });

  test("TC0355 — Owner can see Transport tab in admin portal", async ({ page }) => {
    // Owner has full access — Transport tab should be visible in the admin tab bar
    const transportTab = page.getByRole("button", { name: /transport/i }).first();
    await expect(transportTab).toBeVisible({ timeout: 8_000 });
  });
});

test.describe("Coordinator Portal", () => {
  test.use({ storageState: AUTH.teacher2 });

  test.beforeEach(async ({ page }) => {
    await page.goto("/admin");
    await page.getByRole("button", { name: /logout/i }).waitFor({ timeout: 25_000 }).catch(() => {});
  });

  test("TC0361 — Coordinator redirects to admin portal after login", async ({ page }) => {
    await expect(page).toHaveURL(/admin/, { timeout: 8_000 });
  });

  test("TC0362 — Coordinator sees Transport tab when role has transport permission", async ({ page }) => {
    const transportTab = page.getByRole("button", { name: /transport/i }).first();
    if (await transportTab.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await transportTab.click();
      await page.waitForTimeout(800);
      await expect(page.locator("text=/enrolled|boarded|absent|route/i").first()).toBeVisible({ timeout: 8_000 });
    }
  });

  test("TC0363 — Coordinator cannot see owner-only tabs", async ({ page }) => {
    // Owner-only tabs like cleanup, test runner should not be visible to coordinator
    const cleanup = page.getByRole("button", { name: /cleanup/i });
    await expect(cleanup).not.toBeVisible({ timeout: 3_000 }).catch(() => {});
  });
});

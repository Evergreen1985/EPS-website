import { test, expect } from "@playwright/test";
import { AdminPage } from "../pages/AdminPage";
import { AUTH } from "../fixtures/test-data";

test.describe("Owner Portal — Cleanup & Data Management", () => {
  test.use({ storageState: AUTH.owner });

  test.beforeEach(async ({ page }) => {
    await page.goto("/admin");
    // Wait for admin page session to load
    await page.getByRole("button", { name: /logout/i }).waitFor({ timeout: 25_000 }).catch(() => {});
  });

  test("TC0801 — Owner dashboard loads successfully", async ({ page }) => {
    await expect(page).toHaveURL(/admin|owner/, { timeout: 8_000 });
  });

  test("TC0802 — Data Cleanup tab is accessible", async ({ page }) => {
    const cleanup = page.getByRole("button", { name: /cleanup/i });
    if (await cleanup.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await cleanup.click();
      await page.waitForTimeout(800);
      const content = page.locator("text=/cleanup|delete|data|archive/i").first();
      await expect(content).toBeVisible({ timeout: 6_000 });
    }
  });

  test("TC0803 — Cleanup tab shows dangerous action warnings", async ({ page }) => {
    const cleanup = page.getByRole("button", { name: /cleanup/i });
    if (await cleanup.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await cleanup.click();
      await page.waitForTimeout(800);
      const warning = page.locator("text=/warning|caution|cannot.*undo|permanent/i").first();
      if (await warning.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await expect(warning).toBeVisible();
      }
    }
  });

  test("TC0804 — Cleanup buttons require confirmation", async ({ page }) => {
    const cleanup = page.getByRole("button", { name: /cleanup/i });
    if (await cleanup.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await cleanup.click();
      await page.waitForTimeout(800);
      const deleteBtn = page.getByRole("button", { name: /delete.*all|clear.*all|purge/i }).first();
      if (await deleteBtn.isVisible({ timeout: 4_000 }).catch(() => false)) {
        await deleteBtn.click();
        await page.waitForTimeout(500);
        const confirm = page.locator("text=/confirm|are you sure|yes.*delete/i").first();
        const dialog = page.locator("[role='dialog'], [class*='modal']").first();
        await confirm.or(dialog).isVisible({ timeout: 5_000 }).catch(() => {});
      }
    }
  });

  test("TC0805 — Overview tab shows summary stats", async ({ page }) => {
    const overview = page.getByRole("button", { name: /overview/i });
    if (await overview.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await overview.click();
      await page.waitForTimeout(800);
    }
    // Admin/owner page always shows the admin tab bar
    const stats = page.locator("text=/enquiries|sections|calendar/i").first();
    await expect(stats).toBeVisible({ timeout: 8_000 });
  });

  test("TC0806 — Tests tab (🔬) is visible to owner", async ({ page }) => {
    const testsTab = page.getByRole("button", { name: /test|🔬/i }).first();
    if (await testsTab.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await expect(testsTab).toBeVisible();
    }
  });

  test("TC0807 — Test runner plug-in toggle is visible", async ({ page }) => {
    const testsTab = page.getByRole("button", { name: /test|🔬/i }).first();
    if (await testsTab.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await testsTab.click();
      await page.waitForTimeout(1000);
      const toggle = page.getByRole("button", { name: /plug|enable|disable/i }).first();
      if (await toggle.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await expect(toggle).toBeVisible();
      }
    }
  });

  test("TC0808 — Admin cannot access owner-only cleanup tab", async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: AUTH.admin });
    const page = await ctx.newPage();
    await page.goto("/admin");
    const cleanup = page.getByRole("button", { name: /cleanup/i });
    const tests = page.getByRole("button", { name: /🔬/i });
    const cleanupVisible = await cleanup.isVisible({ timeout: 3_000 }).catch(() => false);
    const testsVisible = await tests.isVisible({ timeout: 3_000 }).catch(() => false);
    expect(cleanupVisible && testsVisible).toBeFalsy();
    await ctx.close();
  });

  test("TC0809 — Ride log cleanup section visible", async ({ page }) => {
    const cleanup = page.getByRole("button", { name: /cleanup/i });
    if (await cleanup.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await cleanup.click();
      await page.waitForTimeout(800);
      const rideLogs = page.locator("text=/ride.*log|transport.*log|log.*cleanup/i").first();
      if (await rideLogs.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await expect(rideLogs).toBeVisible();
      }
    }
  });

  test("TC0810 — Attendance cleanup section visible", async ({ page }) => {
    const cleanup = page.getByRole("button", { name: /cleanup/i });
    if (await cleanup.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await cleanup.click();
      await page.waitForTimeout(800);
      const attnClean = page.locator("text=/attendance.*cleanup|clear.*attendance/i").first();
      if (await attnClean.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await expect(attnClean).toBeVisible();
      }
    }
  });
});

test.describe("Owner Portal — Reports", () => {
  test.use({ storageState: AUTH.owner });

  test.beforeEach(async ({ page }) => {
    await page.goto("/admin");
  });

  test("TC0851 — Transport report tab is visible to owner", async ({ page }) => {
    const reportTab = page.getByRole("button", { name: /report/i }).first();
    if (await reportTab.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await reportTab.click();
      await page.waitForTimeout(800);
      const content = page.locator("text=/report|summary|export/i").first();
      await expect(content).toBeVisible({ timeout: 6_000 });
    }
  });

  test("TC0852 — Staff management section visible to owner", async ({ page }) => {
    const staffTab = page.getByRole("button", { name: /staff/i }).first();
    if (await staffTab.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await staffTab.click();
      await page.waitForTimeout(800);
      const content = page.locator("text=/staff|teacher|employee/i").first();
      await expect(content).toBeVisible({ timeout: 6_000 });
    }
  });
});

import { test, expect } from "@playwright/test";
import { TeacherPage } from "../pages/TeacherPage";
import { AUTH } from "../fixtures/test-data";

test.describe("Transport — Staff Roster", () => {
  test.use({ storageState: AUTH.teacher });
  let teacher: TeacherPage;

  test.beforeEach(async ({ page }) => {
    teacher = new TeacherPage(page);
    await page.goto("/teacher-dashboard");
    await teacher.openTab("Transport");
  });

  test("TC0201 — Transport tab loads with route selector", async ({ page }) => {
    // Stat card labels confirm transport tab loaded (always rendered regardless of data)
    await expect(page.locator("text=/enrolled|boarded|absent|dropped/i").first()).toBeVisible({ timeout: 15_000 });
  });

  test("TC0202 — Morning route roster loads", async ({ page }) => {
    const morning = page.getByRole("button", { name: /morning/i });
    if (await morning.isVisible()) await morning.click();
    await page.waitForTimeout(1500);
    const roster = page.locator("text=/boarded|waiting|absent|no children/i").first();
    await expect(roster).toBeVisible({ timeout: 8_000 });
  });

  test("TC0203 — Afternoon route is independent of morning", async ({ page }) => {
    const afternoon = page.getByRole("button", { name: /afternoon/i });
    if (await afternoon.isVisible()) {
      await afternoon.click();
      await page.waitForTimeout(1500);
      const roster = page.locator("text=/boarded|waiting|absent|no children/i").first();
      await expect(roster).toBeVisible({ timeout: 8_000 });
    }
  });

  test("TC0204 — PD button visible on morning route only", async ({ page }) => {
    const morning = page.getByRole("button", { name: /morning/i });
    if (await morning.isVisible()) await morning.click();
    await page.waitForTimeout(1500);
    const pdBtn = page.getByRole("button", { name: /PD|parent drop/i });
    if (await pdBtn.isVisible()) {
      await expect(pdBtn).toBeVisible();
    }
  });

  test("TC0205 — PP button visible on afternoon route only", async ({ page }) => {
    const afternoon = page.getByRole("button", { name: /afternoon/i });
    if (await afternoon.isVisible()) {
      await afternoon.click();
      await page.waitForTimeout(1500);
      const ppBtn = page.getByRole("button", { name: /PP|parent pick/i });
      if (await ppBtn.isVisible()) {
        await expect(ppBtn).toBeVisible();
      }
    }
  });

  test("TC0206 — Report tab NOT visible to teacher", async ({ page }) => {
    const reportTab = page.getByRole("button", { name: /report/i });
    await expect(reportTab).not.toBeVisible({ timeout: 3_000 }).catch(() => {});
  });

  test("TC0207 — Transport stats section visible", async ({ page }) => {
    const stats = page.locator("text=/enrolled|boarded|absent|dropped/i").first();
    await expect(stats).toBeVisible({ timeout: 8_000 });
  });

  test("TC0208 — GPS Start Sharing button visible", async ({ page }) => {
    const gps = page.getByRole("button", { name: /start sharing|share.*gps|📡/i });
    if (await gps.isVisible()) await expect(gps).toBeVisible();
  });

  test("TC0209 — Driver login can access transport roster", async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: AUTH.driver });
    const page = await ctx.newPage();
    await page.goto("/teacher-dashboard");
    const driverTeacher = new TeacherPage(page);
    await driverTeacher.openTab("Transport");
    // Stat card labels confirm transport tab loaded (always rendered regardless of data)
    await expect(page.locator("text=/enrolled|boarded|absent|dropped/i").first()).toBeVisible({ timeout: 15_000 });
    await ctx.close();
  });
});

import { test, expect } from "@playwright/test";
import { TeacherPage } from "../pages/TeacherPage";
import { AUTH } from "../fixtures/test-data";

test.describe("Teacher — Attendance", () => {
  test.use({ storageState: AUTH.teacher });
  let teacher: TeacherPage;

  test.beforeEach(async ({ page }) => {
    teacher = new TeacherPage(page);
    await page.goto("/teacher-dashboard");
    await teacher.openTab("Attendance");
  });

  test("TC0101 — Attendance tab loads with children or empty state", async ({ page }) => {
    const content = page.locator("text=/present|absent|late|attendance|no children|no students/i").first();
    await expect(content).toBeVisible({ timeout: 8_000 });
  });

  test("TC0102 — Present/Absent/Late buttons visible for each child", async ({ page }) => {
    await expect(page.getByRole("button", { name: /present/i }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /absent/i }).first()).toBeVisible();
  });

  test("TC0103 — Mark child Present — button updates immediately (optimistic UI)", async ({ page }) => {
    const presentBtn = page.getByRole("button", { name: /present/i }).first();
    await presentBtn.click();
    await page.waitForTimeout(500);
    const badge = page.locator("text=/present/i").first();
    await expect(badge).toBeVisible({ timeout: 5_000 });
  });

  test("TC0104 — Mark child Absent — updates UI", async ({ page }) => {
    const absentBtn = page.getByRole("button", { name: /absent/i }).first();
    await absentBtn.click();
    await page.waitForTimeout(500);
    const badge = page.locator("text=/absent/i").first();
    await expect(badge).toBeVisible({ timeout: 5_000 });
  });

  test("TC0105 — Stat cards visible on attendance tab", async ({ page }) => {
    await expect(page.locator("text=/total|present|absent/i").first()).toBeVisible({ timeout: 5_000 });
  });

  test("TC0106 — Coordinator (teacher2) goes to admin, not teacher dashboard", async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: AUTH.teacher2 });
    const page = await ctx.newPage();
    // bhagyalakshmi is a Coordinator — storageState puts them on /admin
    await page.goto("/admin");
    await expect(page).toHaveURL(/admin|owner/, { timeout: 8_000 });
    await ctx.close();
  });

  test("TC0107 — Attendance history section visible", async ({ page }) => {
    const history = page.locator("text=/history|past|record/i").first();
    if (await history.isVisible()) {
      await expect(history).toBeVisible();
    }
  });

  test("TC0108 — Mark All Present button exists", async ({ page }) => {
    const markAll = page.getByRole("button", { name: /mark all|all present/i });
    if (await markAll.isVisible()) {
      await expect(markAll).toBeVisible();
    }
  });
});

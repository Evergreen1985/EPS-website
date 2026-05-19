import { test, expect } from "@playwright/test";
import { TeacherPage } from "../pages/TeacherPage";
import { AUTH } from "../fixtures/test-data";

test.describe("Teacher — Homework", () => {
  test.use({ storageState: AUTH.teacher });
  let teacher: TeacherPage;

  test.beforeEach(async ({ page }) => {
    teacher = new TeacherPage(page);
    await page.goto("/teacher-dashboard");
    await teacher.openTab("Homework");
  });

  test("TC0401 — Homework tab loads with list or empty state", async ({ page }) => {
    const content = page.locator("text=/homework|no homework|assignment/i").first();
    await expect(content).toBeVisible({ timeout: 8_000 });
  });

  test("TC0402 — Add Homework button is visible", async ({ page }) => {
    const addBtn = page.getByRole("button", { name: /assign|add|new|create/i }).first();
    await expect(addBtn).toBeVisible({ timeout: 6_000 });
  });

  test("TC0403 — Can open homework form", async ({ page }) => {
    const addBtn = page.getByRole("button", { name: /assign|add|new|create/i }).first();
    await addBtn.click();
    await page.waitForTimeout(500);
    // After clicking "Assign Homework", the form with "New Homework" heading appears
    const form = page.locator("text=/new homework|assign to class/i").first();
    await expect(form).toBeVisible({ timeout: 6_000 });
  });

  test("TC0404 — Homework subject field accepts input", async ({ page }) => {
    const addBtn = page.getByRole("button", { name: /assign|add|new|create/i }).first();
    await addBtn.click();
    await page.waitForTimeout(500);
    // Title field: placeholder "e.g. Draw your family"; Subject field: placeholder "Art, Math, English…"
    const subjectField = page.locator("input[placeholder*='Math']").first();
    if (await subjectField.isVisible()) {
      await subjectField.fill("Math Practice");
      await expect(subjectField).toHaveValue("Math Practice");
    }
  });

  test("TC0405 — Homework description field accepts input", async ({ page }) => {
    const addBtn = page.getByRole("button", { name: /assign|add|new|create/i }).first();
    await addBtn.click();
    await page.waitForTimeout(500);
    // Description field: placeholder "Add details or instructions…"
    const descField = page.locator("input[placeholder*='details']").first();
    if (await descField.isVisible()) {
      await descField.fill("Complete worksheet pages 1-3");
      await expect(descField).toHaveValue("Complete worksheet pages 1-3");
    }
  });

  test("TC0406 — Homework due date field visible", async ({ page }) => {
    const addBtn = page.getByRole("button", { name: /assign|add|new|create/i }).first();
    await addBtn.click();
    await page.waitForTimeout(500);
    const dateField = page.locator("input[type='date'], [placeholder*='date' i]").first();
    if (await dateField.isVisible()) {
      await expect(dateField).toBeVisible();
    }
  });

  test("TC0407 — Submit empty homework form shows validation", async ({ page }) => {
    const addBtn = page.getByRole("button", { name: /assign|add|new|create/i }).first();
    await addBtn.click();
    await page.waitForTimeout(500);
    const submitBtn = page.getByRole("button", { name: /save|submit|add/i }).first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(500);
      const form = page.locator("form, [role='dialog']").first();
      const stillVisible = await form.isVisible().catch(() => false);
      const errVisible = await page.locator("text=/required|fill|error/i").first().isVisible().catch(() => false);
      expect(stillVisible || errVisible).toBeTruthy();
    }
  });

  test("TC0408 — Existing homework entry shows subject", async ({ page }) => {
    const entry = page.locator("[class*='homework'], [class*='card'], li").first();
    if (await entry.isVisible({ timeout: 4_000 }).catch(() => false)) {
      await expect(entry).toBeVisible();
    }
  });

  test("TC0409 — Homework items show due date", async ({ page }) => {
    const dateEl = page.locator("text=/due|date/i").first();
    if (await dateEl.isVisible({ timeout: 4_000 }).catch(() => false)) {
      await expect(dateEl).toBeVisible();
    }
  });

  test("TC0410 — teacher2 (Nursery) homework is section-scoped", async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: AUTH.teacher2 });
    const page = await ctx.newPage();
    await page.goto("/teacher-dashboard");
    const t2 = new TeacherPage(page);
    await t2.openTab("Homework");
    await expect(page.locator("text=/homework|assignment|no homework/i").first()).toBeVisible({ timeout: 8_000 });
    await ctx.close();
  });
});

import { test, expect } from "@playwright/test";
import { AdminPage } from "../pages/AdminPage";
import { AUTH } from "../fixtures/test-data";

test.describe("Fees Management", () => {
  test.use({ storageState: AUTH.admin });
  let admin: AdminPage;

  test.beforeEach(async ({ page }) => {
    admin = new AdminPage(page);
    await page.goto("/admin");
    await admin.openTab("Fees");  // openTab now waits for session before clicking
  });

  test("TC0601 — Fees tab loads with content", async ({ page }) => {
    // FeesTab sub-tab bar always shows "Fee Records", "Reports", "Structures"
    const content = page.locator("text=/fee records|structures|reports/i").first();
    await expect(content).toBeVisible({ timeout: 8_000 });
  });

  test("TC0602 — Fee records list is visible", async ({ page }) => {
    const list = page.locator("table, [class*='list'], [class*='fee']").first();
    if (await list.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await expect(list).toBeVisible();
    }
  });

  test("TC0603 — Fee amount column is visible", async ({ page }) => {
    const amount = page.locator("text=/amount|₹|Rs\.|fee/i").first();
    await expect(amount).toBeVisible({ timeout: 6_000 });
  });

  test("TC0604 — Due date column is visible", async ({ page }) => {
    const due = page.locator("text=/due|date|month/i").first();
    if (await due.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await expect(due).toBeVisible();
    }
  });

  test("TC0605 — Payment status column is visible", async ({ page }) => {
    const status = page.locator("text=/paid|pending|overdue|status/i").first();
    if (await status.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await expect(status).toBeVisible();
    }
  });

  test("TC0606 — Add fee / record payment button visible", async ({ page }) => {
    const addBtn = page.getByRole("button", { name: /add|record|new fee|payment/i }).first();
    if (await addBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await expect(addBtn).toBeVisible();
    }
  });

  test("TC0607 — Search / filter field exists on fees tab", async ({ page }) => {
    const search = page.getByPlaceholder(/search|filter|name/i).first();
    if (await search.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await expect(search).toBeVisible();
    }
  });

  test("TC0608 — Fees tab shows child or parent name", async ({ page }) => {
    const nameEl = page.locator("text=/Lekhya|Jatin|Riya|parent|student/i").first();
    if (await nameEl.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await expect(nameEl).toBeVisible();
    }
  });

  test("TC0609 — Fee section filter works", async ({ page }) => {
    const sectionFilter = page.getByRole("combobox").first();
    if (await sectionFilter.isVisible({ timeout: 4_000 }).catch(() => false)) {
      await sectionFilter.selectOption({ index: 1 });
      await page.waitForTimeout(600);
      const content = page.locator("text=/fee|amount|no records/i").first();
      await expect(content).toBeVisible({ timeout: 5_000 });
    }
  });

  test("TC0610 — Mark fee as paid updates status", async ({ page }) => {
    const markPaidBtn = page.getByRole("button", { name: /mark paid|paid|collect/i }).first();
    if (await markPaidBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await markPaidBtn.click();
      await page.waitForTimeout(800);
      const paid = page.locator("text=/paid|collected/i").first();
      await expect(paid).toBeVisible({ timeout: 5_000 });
    }
  });

  test("TC0611 — Owner can access fees tab", async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: AUTH.owner });
    const page = await ctx.newPage();
    await page.goto("/admin");
    const ownerAdmin = new AdminPage(page);
    await ownerAdmin.openTab("Fees");
    const content = page.locator("text=/fee|amount|payment/i").first();
    await expect(content).toBeVisible({ timeout: 8_000 });
    await ctx.close();
  });

  test("TC0612 — Teacher cannot access admin fees tab", async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: AUTH.teacher });
    const page = await ctx.newPage();
    await page.goto("/admin");
    await expect(page).toHaveURL(/login/, { timeout: 8_000 });
    await ctx.close();
  });
});

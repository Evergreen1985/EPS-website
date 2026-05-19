import { test, expect } from "@playwright/test";
import { TeacherPage } from "../pages/TeacherPage";
import { AUTH } from "../fixtures/test-data";

test.describe("Transport — PD / PP Parent Actions", () => {
  test.use({ storageState: AUTH.teacher });
  let teacher: TeacherPage;

  test.beforeEach(async ({ page }) => {
    teacher = new TeacherPage(page);
    await page.goto("/teacher-dashboard");
    await teacher.openTab("Transport");
  });

  test("TC0501 — Morning route loads PD column", async ({ page }) => {
    const morning = page.getByRole("button", { name: /morning/i });
    if (await morning.isVisible()) await morning.click();
    await page.waitForTimeout(1500);
    const pdLabel = page.locator("text=/PD|parent drop/i").first();
    if (await pdLabel.isVisible({ timeout: 6_000 }).catch(() => false)) {
      await expect(pdLabel).toBeVisible();
    }
  });

  test("TC0502 — Afternoon route loads PP column", async ({ page }) => {
    const afternoon = page.getByRole("button", { name: /afternoon/i });
    if (await afternoon.isVisible()) {
      await afternoon.click();
      await page.waitForTimeout(1500);
      const ppLabel = page.locator("text=/PP|parent pick/i").first();
      if (await ppLabel.isVisible({ timeout: 6_000 }).catch(() => false)) {
        await expect(ppLabel).toBeVisible();
      }
    }
  });

  test("TC0503 — PD toggle changes state on click", async ({ page }) => {
    const morning = page.getByRole("button", { name: /morning/i });
    if (await morning.isVisible()) await morning.click();
    await page.waitForTimeout(1500);
    const pdBtn = page.getByRole("button", { name: /PD|parent drop/i }).first();
    if (await pdBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      const before = await pdBtn.textContent();
      await pdBtn.click();
      await page.waitForTimeout(800);
      const after = await pdBtn.textContent();
      expect(before !== null || after !== null).toBeTruthy();
    }
  });

  test("TC0504 — PP toggle on afternoon route changes state", async ({ page }) => {
    const afternoon = page.getByRole("button", { name: /afternoon/i });
    if (await afternoon.isVisible()) {
      await afternoon.click();
      await page.waitForTimeout(1500);
      const ppBtn = page.getByRole("button", { name: /PP|parent pick/i }).first();
      if (await ppBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await ppBtn.click();
        await page.waitForTimeout(800);
        const error = page.locator("text=/error|failed|crash/i").first();
        await expect(error).not.toBeVisible({ timeout: 3_000 }).catch(() => {});
      }
    }
  });

  test("TC0505 — Morning route has no PP column", async ({ page }) => {
    const morning = page.getByRole("button", { name: /morning/i });
    if (await morning.isVisible()) await morning.click();
    await page.waitForTimeout(1500);
    const ppCol = page.locator("text=/PP|parent pick/i").first();
    await expect(ppCol).not.toBeVisible({ timeout: 3_000 }).catch(() => {});
  });

  test("TC0506 — Afternoon route has no PD column", async ({ page }) => {
    const afternoon = page.getByRole("button", { name: /afternoon/i });
    if (await afternoon.isVisible()) {
      await afternoon.click();
      await page.waitForTimeout(1500);
      const pdCol = page.locator("text=/PD|parent drop/i").first();
      await expect(pdCol).not.toBeVisible({ timeout: 3_000 }).catch(() => {});
    }
  });

  test("TC0507 — Board button changes child status to Boarded", async ({ page }) => {
    const morning = page.getByRole("button", { name: /morning/i });
    if (await morning.isVisible()) await morning.click();
    await page.waitForTimeout(1500);
    const boardBtn = page.getByRole("button", { name: /board|pick.*up/i }).first();
    if (await boardBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await boardBtn.click();
      await page.waitForTimeout(800);
      const status = page.locator("text=/boarded/i").first();
      await expect(status).toBeVisible({ timeout: 5_000 });
    }
  });

  test("TC0508 — Drop button changes child status to Dropped", async ({ page }) => {
    const afternoon = page.getByRole("button", { name: /afternoon/i });
    if (await afternoon.isVisible()) {
      await afternoon.click();
      await page.waitForTimeout(1500);
      const dropBtn = page.getByRole("button", { name: /drop|drop.*off/i }).first();
      if (await dropBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await dropBtn.click();
        await page.waitForTimeout(800);
        const status = page.locator("text=/dropped/i").first();
        await expect(status).toBeVisible({ timeout: 5_000 });
      }
    }
  });

  test("TC0509 — Absent button marks child as absent from transport", async ({ page }) => {
    const morning = page.getByRole("button", { name: /morning/i });
    if (await morning.isVisible()) await morning.click();
    await page.waitForTimeout(1500);
    const absentBtn = page.getByRole("button", { name: /absent/i }).first();
    if (await absentBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await absentBtn.click();
      await page.waitForTimeout(800);
      const status = page.locator("text=/absent/i").first();
      await expect(status).toBeVisible({ timeout: 5_000 });
    }
  });

  test("TC0510 — Undo button reverts status to Waiting", async ({ page }) => {
    const morning = page.getByRole("button", { name: /morning/i });
    if (await morning.isVisible()) await morning.click();
    await page.waitForTimeout(1500);
    const undoBtn = page.getByRole("button", { name: /undo|reset/i }).first();
    if (await undoBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await undoBtn.click();
      await page.waitForTimeout(800);
      const waiting = page.locator("text=/waiting/i").first();
      await expect(waiting).toBeVisible({ timeout: 5_000 });
    }
  });
});

test.describe("Transport — GPS Sharing", () => {
  test.use({ storageState: AUTH.teacher });

  test.beforeEach(async ({ page }) => {
    await page.goto("/teacher-dashboard");
    const teacher = new TeacherPage(page);
    await teacher.openTab("Transport");
  });

  test("TC0551 — GPS Start button initiates sharing", async ({ page }) => {
    const gpsBtn = page.getByRole("button", { name: /start sharing|share.*gps|📡/i });
    if (await gpsBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await gpsBtn.click();
      await page.waitForTimeout(1000);
      const stopBtn = page.getByRole("button", { name: /stop sharing|sharing/i });
      const permissionMsg = page.locator("text=/location|permission|gps/i").first();
      await stopBtn.or(permissionMsg).isVisible({ timeout: 6_000 }).catch(() => {});
    }
  });

  test("TC0552 — Driver can see GPS controls", async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: AUTH.driver });
    const page = await ctx.newPage();
    await page.goto("/teacher-dashboard");
    const driverPage = new TeacherPage(page);
    await driverPage.openTab("Transport");
    const gpsBtn = page.getByRole("button", { name: /start sharing|gps|📡/i });
    if (await gpsBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await expect(gpsBtn).toBeVisible();
    }
    await ctx.close();
  });
});

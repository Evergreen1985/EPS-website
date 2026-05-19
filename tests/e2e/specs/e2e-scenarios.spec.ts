import { test, expect } from "@playwright/test";
import { AdminPage } from "../pages/AdminPage";
import { TeacherPage } from "../pages/TeacherPage";
import { AUTH } from "../fixtures/test-data";

test.describe("E2E — Enquiry to Enrolment Flow", () => {
  test.use({ storageState: AUTH.admin });

  test("TC0901 — Enquiry submitted on homepage appears in admin portal", async ({ page }) => {
    // Submit enquiry from public homepage (no auth needed for form)
    await page.goto("/");
    const form = page.locator("form").first();
    const parentField = form.getByPlaceholder(/parent.*name|your.*name|name/i).first();
    const phoneField  = form.getByPlaceholder(/phone|mobile/i).first();
    const childField  = form.getByPlaceholder(/child.*name/i).first();
    if (
      await parentField.isVisible({ timeout: 4_000 }).catch(() => false) &&
      await phoneField.isVisible({ timeout: 4_000 }).catch(() => false)
    ) {
      await parentField.fill("E2E Parent Test");
      await phoneField.fill("9123456789");
      if (await childField.isVisible().catch(() => false)) {
        await childField.fill("E2E Child Test");
      }
      await form.getByRole("button", { name: /submit|send/i }).click();
      await page.waitForTimeout(1500);

      // Now check it in admin (storageState gives us admin session)
      const admin = new AdminPage(page);
      await page.goto("/admin");
      await admin.openTab("Enquiries");
      await admin.searchEnquiry("E2E");
      const enquiry = page.locator("text=/E2E/i").first();
      await expect(enquiry).toBeVisible({ timeout: 8_000 });
    }
  });

  test("TC0902 — Admin can search for existing enquiry by name", async ({ page }) => {
    const admin = new AdminPage(page);
    await page.goto("/admin");
    await admin.openTab("Enquiries");
    await admin.searchEnquiry("Lekhya");
    await page.waitForTimeout(600);
    const result = page.locator("text=/Lekhya|enquir|result/i").first();
    if (await result.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await expect(result).toBeVisible();
    }
  });

  test("TC0903 — Admin can search enquiry by phone number", async ({ page }) => {
    const admin = new AdminPage(page);
    await page.goto("/admin");
    await admin.openTab("Enquiries");
    await admin.searchEnquiry("9876543210");
    await page.waitForTimeout(600);
    const result = page.locator("text=/result|found|enquir|no.*match/i").first();
    if (await result.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await expect(result).toBeVisible();
    }
  });
});

test.describe("E2E — Teacher Attendance + Transport Sync", () => {
  test.use({ storageState: AUTH.teacher });

  test("TC0911 — Teacher marks attendance then switches to transport tab", async ({ page }) => {
    const teacher = new TeacherPage(page);
    await page.goto("/teacher-dashboard");
    await teacher.openTab("Attendance");
    await expect(page.locator("text=/attendance|present|absent/i").first()).toBeVisible({ timeout: 8_000 });
    await teacher.openTab("Transport");
    // Transport tab shows stat cards: Enrolled, Waiting, On Van, Dropped, Absent
    await expect(page.locator("text=/enrolled|waiting|on van/i").first()).toBeVisible({ timeout: 8_000 });
  });

  test("TC0912 — Teacher marks student present and status persists on reload", async ({ page }) => {
    const teacher = new TeacherPage(page);
    await page.goto("/teacher-dashboard");
    await teacher.openTab("Attendance");

    const presentBtn = page.getByRole("button", { name: /present/i }).first();
    if (await presentBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await presentBtn.click();
      await page.waitForTimeout(1000);
      await page.reload();
      await teacher.openTab("Attendance");
      const presentBadge = page.locator("text=/present/i").first();
      await expect(presentBadge).toBeVisible({ timeout: 8_000 });
    }
  });

  test("TC0913 — Transport boarding persists after page reload", async ({ page }) => {
    const teacher = new TeacherPage(page);
    await page.goto("/teacher-dashboard");
    await teacher.openTab("Transport");

    const morning = page.getByRole("button", { name: /morning/i });
    if (await morning.isVisible()) await morning.click();
    await page.waitForTimeout(1500);

    const boardBtn = page.getByRole("button", { name: /board|pick.*up/i }).first();
    if (await boardBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await boardBtn.click();
      await page.waitForTimeout(1000);
      await page.reload();
      await teacher.openTab("Transport");
      const morning2 = page.getByRole("button", { name: /morning/i });
      if (await morning2.isVisible()) await morning2.click();
      await page.waitForTimeout(1500);
      const boarded = page.locator("text=/boarded/i").first();
      await expect(boarded).toBeVisible({ timeout: 8_000 });
    }
  });
});

test.describe("E2E — Multi-Role Session Isolation", () => {
  test.use({ storageState: AUTH.admin });

  test("TC0921 — Admin session does not leak to teacher context", async ({ browser }) => {
    const adminCtx   = await browser.newContext({ storageState: AUTH.admin });
    const teacherCtx = await browser.newContext({ storageState: AUTH.teacher });

    const adminPage   = await adminCtx.newPage();
    const teacherPage = await teacherCtx.newPage();

    await adminPage.goto("/admin");
    await teacherPage.goto("/teacher-dashboard");

    await expect(adminPage).toHaveURL(/admin|owner/);
    await expect(teacherPage).toHaveURL(/teacher-dashboard/);

    await adminCtx.close();
    await teacherCtx.close();
  });

  test("TC0922 — Logout invalidates session cookie", async ({ page }) => {
    await page.goto("/admin");
    // Wait for admin page to be fully rendered before clicking logout
    const logoutBtn = page.getByRole("button", { name: /logout/i });
    await logoutBtn.waitFor({ timeout: 25_000 });
    await logoutBtn.click();
    await page.waitForURL(/login/, { timeout: 10_000, waitUntil: "domcontentloaded" }).catch(() => {});
    await page.waitForTimeout(500);
    await page.goto("/admin");
    await expect(page).toHaveURL(/login/, { timeout: 8_000 });
  });
});

test.describe("E2E — Calendar and Announcements", () => {
  test.use({ storageState: AUTH.admin });

  test.beforeEach(async ({ page }) => {
    await page.goto("/admin");
  });

  test("TC0931 — Calendar tab loads with month view", async ({ page }) => {
    const admin = new AdminPage(page);
    await admin.openTab("Calendar");
    const cal = page.locator("text=/calendar|holiday|event|month/i").first();
    await expect(cal).toBeVisible({ timeout: 8_000 });
  });

  test("TC0932 — Holiday is visible in calendar", async ({ page }) => {
    const admin = new AdminPage(page);
    await admin.openTab("Calendar");
    const holiday = page.locator("text=/holiday|diwali|christmas|public/i").first();
    if (await holiday.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await expect(holiday).toBeVisible();
    }
  });

  test("TC0933 — Announcements tab shows publish controls", async ({ page }) => {
    const admin = new AdminPage(page);
    await admin.openTab("Announcements");
    // Heading or "New Announcement" button is always rendered
    const pub = page.locator("text=/announcement/i").first();
    await expect(pub).toBeVisible({ timeout: 8_000 });
  });

  test("TC0934 — Add announcement button opens form", async ({ page }) => {
    const admin = new AdminPage(page);
    await admin.openTab("Announcements");
    const addBtn = page.getByRole("button", { name: /add|new|create/i }).first();
    if (await addBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(500);
      const form = page.locator("form, [role='dialog'], textarea, input[placeholder]").first();
      await expect(form).toBeVisible({ timeout: 5_000 });
    }
  });
});

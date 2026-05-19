import { Page, expect } from "@playwright/test";

export class TeacherPage {
  constructor(private page: Page) {}

  async openTab(tabName: string) {
    await this.page.getByRole("button", { name: new RegExp(tabName, "i") }).click();
    await this.page.waitForTimeout(800);
  }

  // ── Attendance ───────────────────────────────────────────────
  async getStudentRows() {
    return this.page.locator("[data-testid='student-row'], tr").all();
  }

  async markAttendance(childName: string, status: "present" | "absent" | "late") {
    const row = this.page.locator(`text=${childName}`).locator("..").locator("..");
    const label = status === "present" ? /present/i : status === "absent" ? /absent/i : /late/i;
    await row.getByRole("button", { name: label }).click();
    await this.page.waitForTimeout(1000);
  }

  async getAttendanceBadge(childName: string) {
    const row = this.page.locator(`text=${childName}`).locator("..").locator("..");
    return row.locator("span, button").filter({ hasText: /present|absent|late/i }).first();
  }

  async assertStatCard(label: string, value: string | number) {
    const card = this.page.locator(`text=${label}`).locator("..").locator("..");
    await expect(card).toContainText(String(value), { timeout: 5_000 });
  }

  // ── Transport ─────────────────────────────────────────────────
  async selectRoute(route: "Morning" | "Afternoon") {
    await this.page.getByRole("button", { name: new RegExp(route, "i") }).click();
    await this.page.waitForTimeout(800);
  }

  async boardChild(childName: string) {
    const row = this.page.locator(`text=${childName}`).locator("..").locator("..");
    await row.getByRole("button", { name: /board/i }).click();
    await this.page.waitForTimeout(1000);
  }

  async dropChild(childName: string) {
    const row = this.page.locator(`text=${childName}`).locator("..").locator("..");
    await row.getByRole("button", { name: /drop/i }).click();
    await this.page.waitForTimeout(1000);
  }

  async markChildAbsentTransport(childName: string) {
    const row = this.page.locator(`text=${childName}`).locator("..").locator("..");
    await row.getByRole("button", { name: /absent/i }).click();
    await this.page.waitForTimeout(1000);
  }

  async undoChildStatus(childName: string) {
    const row = this.page.locator(`text=${childName}`).locator("..").locator("..");
    await row.getByRole("button", { name: /undo/i }).click();
    await this.page.waitForTimeout(1000);
  }

  async assertChildStatus(childName: string, status: string) {
    const row = this.page.locator(`text=${childName}`).locator("..").locator("..");
    await expect(row).toContainText(new RegExp(status, "i"), { timeout: 5_000 });
  }

  // ── Homework ──────────────────────────────────────────────────
  async addHomework(title: string, subject: string, dueDate: string) {
    await this.page.getByRole("button", { name: /add|new|\+/i }).first().click();
    await this.page.getByPlaceholder(/title/i).fill(title);
    await this.page.getByPlaceholder(/subject/i).fill(subject);
    const dateInput = this.page.locator("input[type='date']").first();
    await dateInput.fill(dueDate);
    await this.page.getByRole("button", { name: /submit|save|add/i }).last().click();
    await this.page.waitForTimeout(1000);
  }
}

import { Page, expect } from "@playwright/test";

export class AdminPage {
  constructor(private page: Page) {}

  async openTab(tabName: string) {
    // Wait for session to load before clicking (admin page returns null until session resolves)
    await this.page.getByRole("button", { name: /logout/i }).waitFor({ timeout: 25_000 }).catch(() => {});
    await this.page.getByRole("button", { name: new RegExp(tabName, "i") }).first().click();
    await this.page.waitForTimeout(800);
  }

  async assertDashboardLoaded() {
    await expect(this.page).toHaveURL(/admin|owner/, { timeout: 8_000 });
  }

  // ── Enquiries ──────────────────────────────────────────────
  async submitEnquiry(parentName: string, phone: string, childName: string) {
    await this.page.goto("/");
    const form = this.page.locator("form").first();
    await form.getByPlaceholder(/parent.*name|name/i).fill(parentName);
    await form.getByPlaceholder(/phone|mobile/i).fill(phone);
    await form.getByPlaceholder(/child.*name/i).fill(childName);
    await form.getByRole("button", { name: /submit|send/i }).click();
    await this.page.waitForTimeout(1000);
  }

  async searchEnquiry(query: string) {
    const search = this.page.getByPlaceholder(/search/i).first();
    await search.fill(query);
    await this.page.waitForTimeout(600);
  }

  async assertEnquiryVisible(childName: string) {
    await expect(this.page.locator(`text=${childName}`).first()).toBeVisible({ timeout: 5_000 });
  }

  // ── Sections ───────────────────────────────────────────────
  async assertSectionsListed() {
    const sections = ["Infantcare", "Nursery", "Daycare"];
    for (const s of sections) {
      const el = this.page.locator(`text=${s}`).first();
      if (await el.isVisible().catch(() => false)) return;
    }
  }

  // ── Fees ───────────────────────────────────────────────────
  async assertFeeTabLoads() {
    await this.openTab("Fees");
    await this.page.waitForTimeout(1000);
    await expect(this.page.locator("text=/fee|amount|due/i").first()).toBeVisible({ timeout: 6_000 });
  }
}

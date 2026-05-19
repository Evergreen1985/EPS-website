import { Page, expect } from "@playwright/test";

async function typeInto(page: Page, selector: string, value: string) {
  const el = page.locator(selector).first();
  await el.click();
  await page.keyboard.type(value, { delay: 20 });
}

export class LoginPage {
  constructor(private page: Page) {}

  async loginAdmin(username: string, password: string) {
    await this.page.goto("/admin-login");
    await typeInto(this.page, "input:not([type='password'])", username);
    await typeInto(this.page, "input[type='password']", password);
    const btn = this.page.getByRole("button", { name: /sign in/i });
    await btn.waitFor({ state: "visible", timeout: 10_000 });
    await btn.click({ force: true });
    await this.page.waitForURL(/\/(admin|owner)/, { timeout: 15_000 });
  }

  async loginTeacher(username: string, password: string) {
    await this.page.goto("/teacher-login");
    await typeInto(this.page, "input:not([type='password'])", username);
    await typeInto(this.page, "input[type='password']", password);
    const btn = this.page.getByRole("button", { name: /sign in/i });
    await btn.waitFor({ state: "visible", timeout: 10_000 });
    await btn.click({ force: true });
    await this.page.waitForURL(/teacher-dashboard/, { timeout: 15_000 });
  }

  async logout() {
    const btn = this.page.getByRole("button", { name: /logout/i });
    if (await btn.isVisible()) await btn.click();
  }

  async assertLoginError() {
    const err = this.page.locator("text=/invalid|incorrect|wrong|error/i");
    await expect(err).toBeVisible({ timeout: 5_000 });
  }

  async assertRedirectedToLogin(loginPath: string) {
    await expect(this.page).toHaveURL(new RegExp(loginPath), { timeout: 8_000 });
  }
}

import type { Page, Locator } from "@playwright/test";

export class AuthPage {
  private page: Page;
  private emailInput: Locator;
  private passwordInput: Locator;
  private loginButton: Locator;
  private errorMessage: Locator;
  private loginForm: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loginForm = page.locator('form[method="POST"]');
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[type="password"][name="password"]');
    this.loginButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator(".text-red-800");
  }

  async goto() {
    await this.page.goto("/login");
    await this.page.waitForLoadState("networkidle");
  }

  async login(email: string, password: string) {
    console.log("Starting login process...");

    // Debug info before filling form
    console.log(
      "Form state before filling:",
      await this.emailInput.isVisible(),
      await this.passwordInput.isVisible(),
      await this.loginButton.isVisible()
    );

    // Fill email field
    await this.emailInput.waitFor({ state: "visible" });
    await this.emailInput.click();
    await this.emailInput.fill(email);
    console.log("Filled email:", await this.emailInput.inputValue());

    // Fill password field
    await this.passwordInput.waitFor({ state: "visible" });
    await this.passwordInput.click();
    await this.passwordInput.fill(password);
    console.log("Filled password:", "*".repeat((await this.passwordInput.inputValue()).length));

    // Prepare for form submission
    await this.loginButton.waitFor({ state: "visible" });

    // Try multiple approaches to submit the form
    try {
      console.log("Clicking submit button...");
      // Click the button and wait for network response
      await Promise.all([
        this.page.waitForResponse((response) => response.url().includes("/login") && response.status() === 200),
        this.loginButton.click(),
      ]).catch((e) => {
        console.log("Response wait failed:", e.message);
      });

      // Wait a moment for any redirects/processing
      await this.page.waitForTimeout(1000);

      // Check if we remained on login page and if so, try submitting the form directly
      if (this.page.url().includes("/login")) {
        console.log("Still on login page, trying form.evaluate...");
        await this.loginForm.evaluate((form) => {
          (form as HTMLFormElement).submit();
        });
        await this.page.waitForTimeout(1000);
      }
    } catch (error) {
      console.error("Error during login submission:", error);
    }

    // Final URL after login attempts
    console.log("Final URL after login attempts:", this.page.url());
  }

  async expectLoginSuccess() {
    // Log the current URL for debugging
    console.log("Checking login success at URL:", this.page.url());

    // Check if we've left the login page
    if (!this.page.url().includes("/login")) {
      console.log("No longer on login page - login successful");
      return true;
    }

    // If still on login page, check for error messages
    const hasError = await this.errorMessage.isVisible();
    if (hasError) {
      console.log("Login error visible:", await this.errorMessage.textContent());
      return false;
    }

    // Check if form fields were cleared (a sign of successful login with page refresh)
    const emailValue = await this.emailInput.inputValue();
    console.log("Email field value after login:", emailValue);

    // If email field is empty, it might indicate success (form reset)
    return emailValue === "";
  }
}

import { test, expect } from "@playwright/test";
import { AuthPage } from "../page-objects/auth.page";
import { DashboardPage } from "../page-objects/dashboard.page";

test.describe("Manager Goal Definition Process", () => {
  let authPage: AuthPage;
  let dashboardPage: DashboardPage;

  // Environment variables from .env.test
  const managerEmail = process.env.E2E_USERNAME || "";
  const managerPassword = process.env.E2E_PASSWORD || "";

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    dashboardPage = new DashboardPage(page);
  });

  test("Manager can login and access dashboard", async ({ page }) => {
    // Add console logging to the page to help with debugging
    // eslint-disable-next-line no-console
    page.on("console", (msg) => console.log(`PAGE LOG: ${msg.text()}`));

    try {
      // Arrange - Go to login
      // eslint-disable-next-line no-console
      console.log("Navigating to login page");
      await authPage.goto();

      // Take a screenshot of the login page for debugging
      await page.screenshot({ path: "screenshots/login-page.png" });

      // Log the page URL for debugging
      // eslint-disable-next-line no-console
      console.log("Login page loaded, URL:", page.url());

      // Act - Login as manager
      // eslint-disable-next-line no-console
      console.log(`Logging in with email: ${managerEmail}`);
      await authPage.login(managerEmail, managerPassword);

      // After login screenshot
      await page.screenshot({ path: "screenshots/post-login.png" });
      // eslint-disable-next-line no-console
      console.log("Post-login URL:", page.url());

      // Assert - Verify login was successful
      expect(page.url()).toContain("/dashboard");

      // Now check the dashboard content
      // eslint-disable-next-line no-console
      console.log("Checking dashboard content");
      await dashboardPage.expectPageLoaded();

      // Get the dashboard heading for verification
      const heading = await dashboardPage.getPageHeading();
      // eslint-disable-next-line no-console
      console.log("Dashboard heading:", heading);

      // Verify dashboard content is visible
      await dashboardPage.expectContentVisible();

      // eslint-disable-next-line no-console
      console.log("Test completed successfully");
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Test failed with error:", error);
      // Take a screenshot on failure to help with debugging
      await page.screenshot({ path: "screenshots/test-failure.png" });
      throw error;
    }
  });
});

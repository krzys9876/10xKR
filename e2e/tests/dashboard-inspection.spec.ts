import { test } from "@playwright/test";
import { AuthPage } from "../page-objects/auth.page";

test.describe("Dashboard Page Inspection", () => {
  let authPage: AuthPage;

  // Environment variables from .env.test
  const managerEmail = process.env.E2E_USERNAME || "";
  const managerPassword = process.env.E2E_PASSWORD || "";

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
  });

  test("Inspect dashboard HTML structure", async ({ page }) => {
    // Log all console messages
    // eslint-disable-next-line no-console
    page.on("console", (msg) => console.log(`PAGE LOG: ${msg.text()}`));

    try {
      // Login
      await authPage.goto();
      await authPage.login(managerEmail, managerPassword);

      // Wait for dashboard to load
      await page.waitForURL(/.*dashboard/);
      await page.waitForLoadState("networkidle");

      // Take a screenshot of the dashboard
      await page.screenshot({ path: "screenshots/dashboard-full.png" });

      // Output HTML structure for analysis
      const bodyHTML = await page.evaluate(() => {
        return document.body.innerHTML;
      });
      // eslint-disable-next-line no-console
      console.log("Body HTML structure:");
      // eslint-disable-next-line no-console
      console.log(bodyHTML.substring(0, 2000) + "..."); // First 2000 chars

      // Get user profile section
      const userProfileHTML = await page.evaluate(() => {
        // Try different potential selectors
        const selectors = [
          "header .user-info",
          "header .profile",
          ".user-profile",
          "nav .user-info",
          'header div[class*="user"]',
          'header button[aria-label*="user"]',
          ".avatar-container",
          "header .avatar",
        ];

        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element) {
            return {
              selector,
              html: element.outerHTML,
              text: element.textContent,
            };
          }
        }
        return null;
      });
      // eslint-disable-next-line no-console
      console.log("User profile section:", userProfileHTML);

      // Get employees list section
      const employeesHTML = await page.evaluate(() => {
        // Try different potential selectors
        const selectors = [
          ".employee-list",
          ".employees",
          '[data-testid="employee-list"]',
          "table.employees",
          "ul.employees",
          'div[class*="employee"]',
          'section[class*="employee"]',
          "main ul",
          "main table",
        ];

        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element) {
            return {
              selector,
              html: element.outerHTML,
              text: element.textContent,
              items: Array.from(element.querySelectorAll("li, tr")).length,
            };
          }
        }
        return null;
      });
      // eslint-disable-next-line no-console
      console.log("Employees section:", employeesHTML);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Test failed with error:", error);
      await page.screenshot({ path: "screenshots/inspection-error.png" });
      throw error;
    }
  });
});

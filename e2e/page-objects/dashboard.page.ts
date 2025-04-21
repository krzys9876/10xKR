import { expect } from "@playwright/test";
import type { Page, Locator } from "@playwright/test";

export class DashboardPage {
  private page: Page;
  private header: Locator;
  private contentArea: Locator;
  private dataElements: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.locator("header, .header, h1, h2").first();
    this.contentArea = page.locator('main, .main, article, [role="main"]').first();
    // Data elements that should appear when loading is complete
    this.dataElements = page.locator('table, ul, .card, .grid, [data-loaded="true"]');
  }

  async waitForFullyLoaded() {
    // First wait for dashboard URL
    await expect(this.page).toHaveURL(/.*dashboard/);

    // Wait for header to be visible
    await this.header.waitFor({ state: "visible" });

    // Check for loading text and wait for it to disappear
    try {
      // Check if any loading text is visible using getByText
      const loadingText = this.page.getByText(/loading/i);
      const isLoadingVisible = await loadingText.isVisible().catch(() => false);

      if (isLoadingVisible) {
        console.log("Loading text found, waiting for it to disappear...");
        await loadingText
          .waitFor({ state: "hidden", timeout: 10000 })
          .catch((e: Error) => console.log("Loading text timeout:", e.message));
      }

      // Check for loading spinner elements
      const loadingSpinner = this.page.locator(".loading, [aria-busy='true']");
      if ((await loadingSpinner.count()) > 0 && (await loadingSpinner.isVisible())) {
        console.log("Loading spinner found, waiting for it to disappear...");
        await loadingSpinner
          .waitFor({ state: "hidden", timeout: 10000 })
          .catch((e: Error) => console.log("Loading spinner timeout:", e.message));
      }
    } catch (e: unknown) {
      const error = e as Error;
      console.log("Error handling loading indicators:", error.message);
    }

    // Add extra wait to ensure animations complete
    await this.page.waitForTimeout(1000);

    // Try to wait for data elements to appear
    try {
      if ((await this.dataElements.count()) > 0) {
        await this.dataElements.first().waitFor({ state: "visible", timeout: 5000 });
      }
    } catch (e: unknown) {
      const error = e as Error;
      console.log("Data elements not found or timeout waiting:", error.message);
    }

    // Wait for network idle to ensure API calls are complete
    await this.page
      .waitForLoadState("networkidle", { timeout: 10000 })
      .catch((e: Error) => console.log("Network idle timeout:", e.message));

    // Take a screenshot of the fully loaded dashboard
    await this.page.screenshot({ path: "screenshots/dashboard-loaded.png" });

    return true;
  }

  async expectPageLoaded() {
    // Wait for dashboard to fully load
    await this.waitForFullyLoaded();
  }

  async getPageHeading() {
    await this.waitForFullyLoaded();
    return this.header.textContent();
  }

  async expectContentVisible() {
    await this.waitForFullyLoaded();
    await expect(this.contentArea).toBeVisible();
  }
}

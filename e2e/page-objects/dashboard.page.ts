import { expect } from "@playwright/test";
import type { Page, Locator } from "@playwright/test";

export class DashboardPage {
  private page: Page;
  private header: Locator;
  private contentArea: Locator;
  private dataElements: Locator;
  private managerNameElement: Locator;
  private managerEmailElement: Locator;
  private employeesSection: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.locator("h1.text-3xl.font-bold").first();
    this.contentArea = page.locator('main, .main, article, [role="main"]').first();
    // Data elements that should appear when loading is complete
    this.dataElements = page.locator('table, ul, .card, .grid, [data-loaded="true"]');
    // Manager name element - based on inspection results
    this.managerNameElement = page.locator("h2.font-semibold.text-lg");
    // Manager email element
    this.managerEmailElement = page.locator("p.text-sm.text-slate-500");
    // Employees section
    this.employeesSection = page.locator('h2.text-xl.font-semibold:has-text("Pracownicy")').first();
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
        // eslint-disable-next-line no-console
        console.log("Loading text found, waiting for it to disappear...");
        await loadingText
          .waitFor({ state: "hidden", timeout: 10000 })
          // eslint-disable-next-line no-console
          .catch((e: Error) => console.log("Loading text timeout:", e.message));
      }

      // Check for loading spinner elements
      const loadingSpinner = this.page.locator(".loading, [aria-busy='true']");
      if ((await loadingSpinner.count()) > 0 && (await loadingSpinner.isVisible())) {
        // eslint-disable-next-line no-console
        console.log("Loading spinner found, waiting for it to disappear...");
        await loadingSpinner
          .waitFor({ state: "hidden", timeout: 10000 })
          // eslint-disable-next-line no-console
          .catch((e: Error) => console.log("Loading spinner timeout:", e.message));
      }
    } catch (e: unknown) {
      const error = e as Error;
      // eslint-disable-next-line no-console
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
      // eslint-disable-next-line no-console
      console.log("Data elements not found or timeout waiting:", error.message);
    }

    // Wait for network idle to ensure API calls are complete
    await this.page
      .waitForLoadState("networkidle", { timeout: 10000 })
      // eslint-disable-next-line no-console
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

  async getManagerName(): Promise<string | null> {
    await this.waitForFullyLoaded();
    return this.managerNameElement.textContent();
  }

  async getManagerEmail(): Promise<string | null> {
    await this.waitForFullyLoaded();
    return this.managerEmailElement.textContent();
  }

  async getEmployeeSection(): Promise<string | null> {
    await this.waitForFullyLoaded();
    return this.employeesSection.textContent();
  }

  async expectManagerNameVisible(expectedName?: string): Promise<void> {
    await this.waitForFullyLoaded();
    await expect(this.managerNameElement).toBeVisible();

    if (expectedName) {
      const managerName = await this.getManagerName();
      expect(managerName).toContain(expectedName);
    }
  }

  async expectEmployeeSectionVisible(): Promise<void> {
    await this.waitForFullyLoaded();
    await expect(this.employeesSection).toBeVisible();
  }

  async expectManagerEmailVisible(expectedEmail?: string): Promise<void> {
    await this.waitForFullyLoaded();
    await expect(this.managerEmailElement).toBeVisible();

    if (expectedEmail) {
      const email = await this.getManagerEmail();
      expect(email).toContain(expectedEmail);
    }
  }
}

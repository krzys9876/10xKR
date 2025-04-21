import { test } from "@playwright/test";
import { AuthPage } from "../page-objects/auth.page";

test.describe("Dashboard Detailed Inspection", () => {
  let authPage: AuthPage;

  // Environment variables from .env.test
  const managerEmail = process.env.E2E_USERNAME || "";
  const managerPassword = process.env.E2E_PASSWORD || "";

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
  });

  test("Inspect dashboard DOM structure in detail", async ({ page }) => {
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
      await page.screenshot({ path: "screenshots/dashboard-detailed.png" });

      // Search for text content that might be related to user profile
      const textSearch = await page.evaluate(() => {
        const textNodes: {
          text: string;
          path: string;
          class: string;
          id: string;
        }[] = [];
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) {
          const text = node.textContent?.trim();
          if (text && text.length > 0) {
            const parentElement = node.parentElement;
            if (parentElement) {
              textNodes.push({
                text,
                path: getNodePath(parentElement),
                class: parentElement.className,
                id: parentElement.id,
              });
            }
          }
        }

        // Helper function to get node path
        function getNodePath(element: Element): string {
          const path = [];
          while (element && element !== document.body) {
            let tag = element.tagName.toLowerCase();
            if (element.id) {
              tag += "#" + element.id;
            } else if (element.className && typeof element.className === "string") {
              tag += "." + element.className.replace(/\s+/g, ".");
            }
            path.unshift(tag);

            const parent = element.parentElement;
            if (!parent) break;
            element = parent;
          }
          return "body > " + path.join(" > ");
        }

        return textNodes;
      });

      // Filter for manager name
      const managerNameEnv = process.env.E2E_MANAGER_NAME || "";
      const managerMatches = textSearch.filter(
        (item) => item.text.includes(managerNameEnv) || item.text.includes(process.env.E2E_USERNAME || "")
      );

      // eslint-disable-next-line no-console
      console.log("Potential manager name elements:", managerMatches);

      // Filter for employee names
      const employee1 = process.env.E2E_EMPLOYEE1_NAME || "";
      const employee2 = process.env.E2E_EMPLOYEE2_NAME || "";

      const employeeMatches = textSearch.filter(
        (item) => item.text.includes(employee1) || item.text.includes(employee2)
      );

      // eslint-disable-next-line no-console
      console.log("Potential employee name elements:", employeeMatches);

      // Extract all headings as they often contain section titles
      const headings = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6")).map((h) => ({
          tag: h.tagName,
          text: h.textContent,
          path: h.tagName.toLowerCase() + (h.className ? "." + h.className.replace(/\s+/g, ".") : ""),
        }));
      });

      // eslint-disable-next-line no-console
      console.log("Headings found:", headings);

      // Get all list and table structures
      const lists = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("ul, ol, table")).map((list) => {
          const items =
            list.tagName === "TABLE"
              ? Array.from(list.querySelectorAll("tr")).map((tr) => tr.textContent?.trim())
              : Array.from(list.querySelectorAll("li")).map((li) => li.textContent?.trim());

          return {
            type: list.tagName,
            className: list.className,
            id: list.id,
            itemCount: items.length,
            items: items,
            path: list.tagName.toLowerCase() + (list.className ? "." + list.className.replace(/\s+/g, ".") : ""),
          };
        });
      });

      // eslint-disable-next-line no-console
      console.log("Lists and tables found:", lists);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Test failed with error:", error);
      await page.screenshot({ path: "screenshots/detailed-inspection-error.png" });
      throw error;
    }
  });
});

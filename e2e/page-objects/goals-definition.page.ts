import { expect } from "@playwright/test";
import type { Page, Locator } from "@playwright/test";

export class GoalsDefinitionPage {
  private page: Page;
  private employeeInfo: Locator;
  private goalForm: Locator;
  private goalsList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.employeeInfo = page.locator("EmployeeInfo");
    this.goalForm = page.locator("GoalForm");
    this.goalsList = page.locator("GoalsList");
  }

  async waitForPageToLoad() {
    await this.employeeInfo.waitFor({ state: "visible" });
    await expect(this.page).toHaveURL(/.*goals\/definition/);
  }

  async addNewGoal(goalData: { title: string; description: string; weight?: number }) {
    await this.page.getByRole("button", { name: "Add Goal" }).click();
    await this.page.getByLabel("Title").fill(goalData.title);
    await this.page.getByLabel("Description").fill(goalData.description);

    if (goalData.weight) {
      await this.page.getByLabel("Weight").fill(goalData.weight.toString());
    }

    await this.page.getByRole("button", { name: "Save" }).click();
  }

  async getGoalsList() {
    return this.goalsList;
  }

  async expectGoalInList(goalTitle: string) {
    const goalItem = this.page.getByText(goalTitle, { exact: false });
    await expect(goalItem).toBeVisible();
  }
}

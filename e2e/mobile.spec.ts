import { expect, test } from "@playwright/test";
import { onboard } from "./helpers";

test("mobile: bottom nav, add and complete a task from the phone", async ({ page }) => {
  await onboard(page);
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  await nav.getByRole("link", { name: "Today" }).click();
  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();
  await nav.getByRole("button", { name: "New task" }).click();
  const dialog = page.getByRole("dialog", { name: "New task" });
  await dialog.getByLabel("Title").fill("Yoga");
  await dialog.getByRole("button", { name: "Today" }).click();
  await dialog.getByRole("button", { name: "Create task" }).click();
  await page.getByRole("button", { name: "Complete “Yoga”" }).click();
  await expect(page.getByRole("button", { name: "Mark “Yoga” as not done" })).toBeVisible();
  await nav.getByRole("button", { name: "More" }).click();
  await page.getByRole("link", { name: "Analytics" }).click();
  await expect(page.getByRole("heading", { name: "Analytics" })).toBeVisible();
});

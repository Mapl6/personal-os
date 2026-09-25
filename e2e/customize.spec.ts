import { expect, test } from "@playwright/test";
import { onboard } from "./helpers";

test("switch to the Shamsi calendar", async ({ page }) => {
  await onboard(page);
  await page.goto("/settings#calendar");
  await page.getByRole("radio", { name: /Shamsi/ }).click();
  await page.goto("/month");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    /(Farvardin|Ordibehesht|Khordad|Tir|Mordad|Shahrivar|Mehr|Aban|Azar|Dey|Bahman|Esfand) 14\d\d/,
  );
  // Persian names + digits
  await page.goto("/settings#calendar");
  await page.getByRole("button", { name: "Use Iranian defaults" }).click();
  await page.goto("/week");
  await expect(page.getByRole("region", { name: /شنبه/ }).first()).toBeVisible();
});

test("theme toggle switches to light and persists", async ({ page }) => {
  await onboard(page);
  await page.getByRole("button", { name: "Switch to light theme" }).filter({ visible: true }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await page.reload();
  await expect(page.getByRole("heading", { name: /Good|Working/ })).toBeVisible();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
});

test("customize navigation, dashboard and priority names", async ({ page }) => {
  await onboard(page);
  await page.goto("/settings#customize");
  await page.getByRole("checkbox", { name: "Show Habits" }).click();
  await page.getByRole("checkbox", { name: "Show Today’s habits" }).click();
  await page.getByRole("textbox").filter({ hasText: "" }).and(page.locator('input[value="High"]')).fill("Must");
  const sidebar = page.getByRole("complementary", { name: "Main navigation" });
  await expect(sidebar.getByRole("link", { name: "Habits" })).toHaveCount(0);
  await page.goto("/");
  await expect(page.getByText("Today’s habits")).toHaveCount(0);
  await page.keyboard.press("n");
  await expect(page.getByLabel("Priority").locator("option", { hasText: "Must" })).toHaveCount(1);
});

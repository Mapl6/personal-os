import { expect, test } from "@playwright/test";
import { onboard } from "./helpers";

test("command menu theme toggle switches theme and persists", async ({ page }) => {
  await onboard(page);
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.keyboard.press("ControlOrMeta+k");
  await page.getByRole("option", { name: "Toggle dark / light" }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await page.waitForTimeout(500);
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await page.reload();
  await expect(page.getByRole("heading", { name: /Good|Working/ })).toBeVisible();
  await expect(page.locator("html")).not.toHaveClass(/dark/);

  await page.keyboard.press("ControlOrMeta+k");
  await page.getByRole("option", { name: "Toggle dark / light" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
});

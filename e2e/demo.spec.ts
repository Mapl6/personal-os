import { expect, test } from "@playwright/test";

test("?demo=1 skips onboarding and loads example data", async ({ page }) => {
  await page.goto("/?demo=1");
  await expect(page.getByRole("heading", { name: /Good (morning|afternoon|evening)|Working late/ })).toBeVisible();
  await expect(page).not.toHaveURL(/demo/);
  await page.goto("/projects");
  await expect(page.getByRole("main")).not.toContainText("No projects");
});

test("Try the demo button on the welcome step", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Try the demo" }).click();
  await expect(page.getByRole("heading", { name: /Good (morning|afternoon|evening)|Working late/ })).toBeVisible();
});

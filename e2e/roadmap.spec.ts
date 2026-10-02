import { expect, test } from "@playwright/test";

test("roadmap is public and compares today with each phase", async ({ page }) => {
  // A fresh visitor: no onboarding, no local data.
  await page.goto("/roadmap");
  await expect(page.getByRole("heading", { name: "From planner to second brain" })).toBeVisible();
  await expect(page.getByRole("radio", { name: /AI second brain/ })).toHaveAttribute("aria-checked", "true");

  const total = page.getByText(/^of \d+$/);
  const builtNumber = async () => Number((await total.locator("..").textContent())?.match(/^\d+/)?.[0]);
  const complete = await builtNumber();

  await page.getByRole("radio", { name: /Today/ }).click();
  await expect(page.getByText("Features built today")).toBeVisible();
  expect(await builtNumber()).toBeLessThan(complete);

  await page.getByRole("button", { name: /^PE-A1 / }).click();
  await expect(page.getByRole("dialog")).toContainText("Built today");
  await page.keyboard.press("Escape");

  await page.getByLabel("Search features").fill("calorie");
  await expect(page.getByRole("button", { name: /^LM-NUT-01 / })).toBeVisible();
  await expect(page.getByRole("button", { name: /^KN-01 / })).toHaveCount(0);

  await page.getByRole("link", { name: /Open the app/ }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("roadmap deep-links to a phase via the URL hash", async ({ page }) => {
  await page.goto("/roadmap#phase-2");
  await expect(page.getByRole("radio", { name: /Databases/ })).toHaveAttribute("aria-checked", "true");

  // Picking a stage updates the hash without polluting history.
  await page.getByRole("radio", { name: /Today/ }).click();
  await expect(page).toHaveURL(/#today$/);
  await expect(page.getByRole("radio", { name: /Today/ })).toHaveAttribute("aria-checked", "true");
});

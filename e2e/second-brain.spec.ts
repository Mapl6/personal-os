import { expect, test } from "@playwright/test";
import { onboard } from "./helpers";

test("inbox: capture, process to task and page with the keyboard", async ({ page }) => {
  await onboard(page);
  await page.goto("/inbox");
  const box = page.getByRole("textbox", { name: "Capture to inbox" });
  await box.fill("Buy milk tomorrow");
  await box.press("Enter");
  await box.fill("Trip ideas\nKyoto in spring");
  await box.press("Enter");
  await expect(page.getByRole("list", { name: "new inbox items" }).getByRole("listitem")).toHaveCount(2);

  await page.locator("body").click({ position: { x: 5, y: 5 } });
  // Newest first: "Trip ideas" is selected → page.
  await page.keyboard.press("p");
  await expect(page.getByText(/Page “Trip ideas” created/)).toBeVisible();
  await page.keyboard.press("t");
  await expect(page.getByText(/Task “Buy milk” created/)).toBeVisible();
  await expect(page.getByText("Inbox zero.")).toBeVisible();
});

test("capture from ⌘K with ⌘Enter", async ({ page }) => {
  await onboard(page);
  await page.keyboard.press("ControlOrMeta+k");
  await page.getByPlaceholder(/quick-add/).fill("remember to call the bank");
  await page.keyboard.press("ControlOrMeta+Enter");
  await expect(page.getByText("Added to inbox")).toBeVisible();
  await page.goto("/inbox");
  await expect(page.getByText("remember to call the bank")).toBeVisible();
});

test("pages: write, link with [[, see backlinks, survive reload", async ({ page }) => {
  await onboard(page);
  await page.goto("/pages");
  await page.getByRole("button", { name: "New page" }).first().click();
  await expect(page).toHaveURL(/\/pages\/page_/, { timeout: 30_000 });
  await page.getByLabel("Page title").fill("Reading list");
  await page.getByLabel("Page title").press("Enter");
  const editor = page.locator(".pos-editor [contenteditable=true]");
  await editor.click();
  await page.keyboard.type("کتاب‌هایی که می‌خوانم and books #reading ");
  await page.keyboard.type("[[Dune");
  await page.getByRole("option", { name: /Create “Dune”/ }).click();
  await expect(page.locator(".pos-ref", { hasText: "Dune" })).toBeVisible();
  await page.waitForTimeout(1000); // debounce

  await page.reload();
  await expect(page.locator(".pos-editor")).toContainText("می‌خوانم");
  await page.locator(".pos-ref", { hasText: "Dune" }).click();
  await expect(page.getByLabel("Page title")).toHaveValue("Dune");
  await expect(page.getByRole("region", { name: "Backlinks" })).toContainText("Reading list");
});

test("daily note is shared per day and shows the plan", async ({ page }) => {
  await onboard(page);
  await page.goto("/daily");
  await expect(page.getByRole("heading", { name: /Today/ })).toBeVisible();
  await expect(page.getByText("Nothing scheduled.")).toBeVisible();
  await page.locator(".pos-editor [contenteditable=true]").click();
  await page.keyboard.type("Felt focused today");
  await page.waitForTimeout(1000);
  const second = await page.context().newPage();
  await second.goto("/daily");
  await expect(second.locator(".pos-editor")).toContainText("Felt focused today");
});

test("check-in: mood then energy on Today", async ({ page }) => {
  await onboard(page);
  await page.goto("/today");
  await page.getByRole("radiogroup", { name: "Mood" }).getByRole("radio").nth(3).click();
  await page.getByRole("radiogroup", { name: "Energy" }).getByRole("radio", { name: "Great" }).click();
  await expect(page.getByText("Check-in saved")).toBeVisible();
  await expect(page.getByRole("list", { name: "Today’s check-ins" })).toContainText("Great");
});

import { expect, type Page } from "@playwright/test";

/** Completes onboarding. Each Playwright test gets a fresh browser context (empty IndexedDB). */
export async function onboard(page: Page, { examples = false }: { examples?: boolean } = {}) {
  await page.goto("/");
  await page.getByLabel("What should we call you?").fill("Tester");
  for (let i = 0; i < 5; i++) await page.getByRole("button", { name: "Continue" }).click();
  const toggle = page.getByRole("switch", { name: "Include example data" });
  if ((await toggle.getAttribute("aria-checked")) === "true" && !examples) await toggle.click();
  await page.getByRole("button", { name: "Start planning" }).click();
  await expect(page.getByRole("heading", { name: /Good (morning|afternoon|evening)|Working late/ })).toBeVisible();
}

/** Drag with real pointer events so dnd-kit's activation distance is honoured. */
export async function dragTo(page: Page, source: { x: number; y: number }, target: { x: number; y: number }) {
  await page.mouse.move(source.x, source.y);
  await page.mouse.down();
  await page.mouse.move(source.x + 10, source.y + 10, { steps: 3 });
  await page.mouse.move(target.x, target.y, { steps: 15 });
  await page.waitForTimeout(100);
  await page.mouse.up();
}

export async function center(page: Page, selector: ReturnType<Page["locator"]>) {
  const box = await selector.boundingBox();
  if (!box) throw new Error("element not visible");
  return { x: box.x + box.width / 2, y: box.y + box.height / 2, box };
}

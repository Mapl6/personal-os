import { expect, test } from "@playwright/test";
import { onboard } from "./helpers";

test("click an empty slot to create a task there, then resize it", async ({ page }) => {
  await onboard(page);
  await page.goto("/calendar?view=day");
  const col = page.getByLabel(/^Timeline for /);
  const box = (await col.boundingBox())!;
  // Click ~3 hours into the grid.
  await page.mouse.click(box.x + box.width / 2, box.y + 48 * 3 + 10);
  const dialog = page.getByRole("dialog", { name: "New task" });
  await expect(dialog.getByLabel("Start time")).not.toHaveValue("");
  await dialog.getByLabel("Title").fill("Slot task");
  await dialog.getByRole("button", { name: "1h", exact: true }).click();
  await dialog.getByRole("button", { name: "Create task" }).click();
  await expect(page.getByText("Created “Slot task”")).toBeVisible();

  const block = page.getByRole("button", { name: /^Slot task, \d\d:\d\d, 1h\./ });
  await expect(block).toBeVisible();
  await block.hover();
  const handle = page.getByRole("slider", { name: "Resize Slot task" });
  const h = (await handle.boundingBox())!;
  await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2);
  await page.mouse.down();
  await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2 + 58, { steps: 8 });
  await page.mouse.up();
  await expect(page.getByRole("button", { name: /^Slot task, \d\d:\d\d, 2h\./ })).toBeVisible();
});

test("apply the Normal Week template to next week after reviewing the proposal", async ({ page }) => {
  await onboard(page);
  await page.goto("/week");
  await page.getByRole("button", { name: "Next week" }).click();
  await page.getByRole("button", { name: "Apply template" }).click();
  const dialog = page.getByRole("dialog", { name: "Apply a week template" });
  const apply = dialog.getByRole("button", { name: /^Add \d+ blocks?$/ });
  await expect(apply).toBeVisible();
  // Uncheck one proposed item — nothing is applied without review.
  await dialog.getByRole("checkbox").first().click();
  const label = await apply.textContent();
  const count = Number(label!.match(/\d+/)![0]);
  await apply.click();
  await expect(page.getByText(`Added ${count} block${count === 1 ? "" : "s"} to the week`)).toBeVisible();
  // Applying again proposes only the unchecked item — no duplicates.
  await page.getByRole("button", { name: "Apply template" }).click();
  await expect(page.getByRole("dialog").getByRole("button", { name: "Add 1 block" })).toBeVisible();
});

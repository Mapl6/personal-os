import { expect, test } from "@playwright/test";
import { center, dragTo, onboard } from "./helpers";

test("onboarding creates areas, weekly goals and a template", async ({ page }) => {
  await onboard(page);
  await page.goto("/areas");
  await expect(page.getByRole("heading", { name: "Frontend" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Startup + AI" })).toBeVisible();
  await page.goto("/goals");
  await expect(page.getByRole("heading", { name: "Gym" })).toBeVisible();
  await page.goto("/settings#templates");
  await expect(page.getByRole("textbox", { name: "Template name" })).toHaveValue("Normal Week");
});

test("create a task, schedule it, complete it and persist across reload", async ({ page }) => {
  await onboard(page);
  await page.goto("/today");
  await page.getByRole("button", { name: "Task", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "New task" });
  await dialog.getByLabel("Title").fill("Learn React Rendering");
  await dialog.getByLabel("Area").selectOption({ label: "Frontend" });
  await dialog.getByLabel("Start time").fill("09:00");
  await dialog.getByRole("button", { name: "Create task" }).click();
  await expect(page.getByText("Created “Learn React Rendering”")).toBeVisible();

  const card = page.getByRole("button", { name: /Learn React Rendering, 09:00/ });
  await expect(card).toBeVisible();
  await page.getByRole("button", { name: "Complete “Learn React Rendering”" }).first().click();
  await expect(page.getByText(/Completed “Learn React Rendering”/)).toBeVisible();

  await page.reload();
  await expect(page.getByRole("button", { name: "Mark “Learn React Rendering” as not done" }).first()).toBeVisible();
  await page.goto("/tasks?");
  await page.getByRole("combobox", { name: "Status filter" }).selectOption("completed");
  await expect(page.getByRole("list", { name: "Tasks" }).getByRole("button", { name: /^Learn React Rendering/ })).toBeVisible();
});

test("quick add parses natural language via the command center", async ({ page }) => {
  await onboard(page);
  await page.keyboard.press("ControlOrMeta+k");
  await page.getByRole("combobox", { name: "Command" }).fill("Startup 3h tomorrow #mvp");
  await expect(page.getByText("Create “Startup”")).toBeVisible();
  await expect(page.getByRole("option", { name: /Create “Startup”.*Startup \+ AI.*3h.*Tomorrow.*#mvp/ })).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Created “Startup”")).toBeVisible();
  await page.goto("/tasks");
  await expect(page.getByRole("button", { name: /Startup.*3h/ })).toBeVisible();
});

test("drag an unscheduled task onto the timeline, then move it to another time", async ({ page }) => {
  await onboard(page);
  await page.keyboard.press("n");
  const dialog = page.getByRole("dialog", { name: "New task" });
  await dialog.getByLabel("Title").fill("Read book");
  await dialog.getByRole("button", { name: "1h", exact: true }).click();
  await dialog.getByRole("button", { name: "Create task" }).click();
  await expect(page.getByText(/^Created “/)).toBeVisible();

  await page.goto("/today");
  await page.getByRole("button", { name: "Timeline" }).click();
  const handle = page.getByRole("button", { name: "Drag Read book" });
  await expect(handle).toBeVisible();
  const timeline = page.getByLabel(/^Timeline for /);
  const tl = await timeline.boundingBox();
  const from = await center(page, handle);
  // Drop about two hours below the top of the grid.
  await dragTo(page, from, { x: tl!.x + tl!.width / 2, y: tl!.y + 56 * 2 + 20 });
  const block = page.getByRole("button", { name: /^Read book, \d\d:\d\d, 1h/ });
  await expect(block).toBeVisible();
  const before = await block.getAttribute("aria-label");

  const b = await center(page, block);
  await dragTo(page, { x: b.x - 40, y: b.box.y + 8 }, { x: b.x - 40, y: b.box.y + 8 + 56 * 2 });
  await expect(async () => {
    const after = await page.getByRole("button", { name: /^Read book, \d\d:\d\d/ }).getAttribute("aria-label");
    expect(after).not.toEqual(before);
  }).toPass();
  // Still exactly one task
  await page.goto("/tasks");
  await expect(page.getByRole("button", { name: /^Read book/ })).toHaveCount(1);
});

test("move a block to another day on the week board without duplicating the task", async ({ page }) => {
  await onboard(page);
  await page.goto("/week");
  const firstDay = page.locator("section[aria-label]").filter({ has: page.getByRole("button", { name: /^Add task on/ }) }).first();
  const dayName = (await firstDay.getAttribute("aria-label"))!;
  await firstDay.getByRole("button", { name: /^Add task on/ }).click();
  const dialog = page.getByRole("dialog", { name: "New task" });
  await dialog.getByLabel("Title").fill("Gym session");
  await dialog.getByLabel("Start time").fill("18:00");
  await dialog.getByRole("button", { name: "Create task" }).click();
  await expect(page.getByText(/^Created “/)).toBeVisible();

  const item = firstDay.getByRole("button", { name: /Gym session/ }).first();
  await expect(item).toBeVisible();
  const targetDay = page.locator("section[aria-label]").filter({ has: page.getByRole("button", { name: /^Add task on/ }) }).nth(3);
  const targetName = (await targetDay.getAttribute("aria-label"))!;
  expect(targetName).not.toEqual(dayName);
  const s = await center(page, item);
  const t = await center(page, targetDay);
  await dragTo(page, { x: s.box.x + 30, y: s.y }, { x: t.x, y: t.box.y + 140 });
  await expect(targetDay.getByRole("button", { name: /Gym session/ }).first()).toBeVisible();
  await expect(firstDay.getByRole("button", { name: /Gym session/ })).toHaveCount(0);
  await page.goto("/tasks");
  await expect(page.getByRole("button", { name: /^Gym session/ })).toHaveCount(1);
});

test("time tracking: start, pause, resume, stop", async ({ page }) => {
  await onboard(page);
  await page.keyboard.press("n");
  const dialog = page.getByRole("dialog", { name: "New task" });
  await dialog.getByLabel("Title").fill("Deep work");
  await dialog.getByRole("button", { name: "Today" }).click();
  await dialog.getByRole("button", { name: "Create task" }).click();
  await expect(page.getByText(/^Created “/)).toBeVisible();
  await page.goto("/today");
  await page.getByRole("button", { name: "List" }).click();
  await page.getByRole("button", { name: "Start timer for Deep work" }).click();
  const timer = page.getByRole("region", { name: "Timer" }).first();
  await expect(timer).toContainText("Focus session");
  await expect(timer).toContainText("Deep work");
  await page.waitForTimeout(1200);
  await timer.getByRole("button", { name: "Pause timer" }).click();
  await expect(timer).toContainText("Paused");
  await timer.getByRole("button", { name: "Resume timer" }).click();
  await expect(timer).toContainText("Focus session");
  await timer.getByRole("button", { name: "Stop timer" }).click();
  await expect(page.getByText(/Timer stopped/)).toBeVisible();
});

test("reschedule dialog moves a block to tomorrow", async ({ page }) => {
  await onboard(page);
  await page.keyboard.press("n");
  const dialog = page.getByRole("dialog", { name: "New task" });
  await dialog.getByLabel("Title").fill("Database design");
  await dialog.getByRole("button", { name: "Today" }).click();
  await dialog.getByLabel("Start time").fill("10:00");
  await dialog.getByRole("button", { name: "Create task" }).click();
  await expect(page.getByText(/^Created “/)).toBeVisible();
  await page.goto("/today");
  await page.getByRole("button", { name: "List" }).click();
  await page.getByRole("button", { name: "Actions for Database design" }).click();
  await page.getByRole("menuitem", { name: "Reschedule…" }).click();
  const rs = page.getByRole("dialog", { name: /Reschedule/ });
  await rs.getByRole("radio", { name: /Tomorrow/ }).click();
  await rs.getByRole("button", { name: "Move" }).click();
  await expect(page.getByText(/Moved “Database design”/)).toBeVisible();
  await expect(page.getByText("No tasks planned for this day.")).toBeVisible();
  await page.getByRole("button", { name: "Next day" }).click();
  await expect(page.getByRole("button", { name: "Move Database design" })).toBeVisible();
});

test("weekly goal progress updates when work is completed", async ({ page }) => {
  await onboard(page);
  await page.keyboard.press("n");
  const dialog = page.getByRole("dialog", { name: "New task" });
  await dialog.getByLabel("Title").fill("Gym");
  await dialog.getByLabel("Area").selectOption({ label: "Health" });
  await dialog.getByRole("button", { name: "Today" }).click();
  await dialog.getByRole("button", { name: "Create task" }).click();
  await expect(page.getByText(/^Created “/)).toBeVisible();
  await page.goto("/week");
  await expect(page.getByText("0 / 2 sessions")).toBeVisible();
  await page.getByRole("button", { name: "Complete “Gym”" }).first().click();
  await expect(page.getByText("1 / 2 sessions")).toBeVisible();
});

import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { BlockCard } from "@/features/tasks/block-card";
import { getQueryClient } from "@/lib/query/client";
import { createMemoryStore } from "@/repositories/memory-store";
import { createServices, setServices, type Services } from "@/services";

let services: Services;

beforeEach(() => {
  services = createServices(createMemoryStore());
  setServices(services);
});

async function renderBlock() {
  const task = await services.tasks.create({ title: "Learn React", estimatedMinutes: 90 }, { date: "2026-09-24", startMinutes: 540 });
  const [block] = await services.store.blocks.listBy("taskId", task.id);
  const t = (await services.store.tasks.get(task.id))!;
  render(
    <QueryClientProvider client={getQueryClient()}>
      <BlockCard block={block} task={t} variant="row" />
    </QueryClientProvider>,
  );
  return { task, block };
}

describe("BlockCard", () => {
  it("renders time range and duration", async () => {
    await renderBlock();
    expect(screen.getByText("Learn React")).toBeInTheDocument();
    expect(screen.getByText("09:00–10:30")).toBeInTheDocument();
    expect(screen.getByText("1h 30m")).toBeInTheDocument();
  });

  it("completes the block through the service layer", async () => {
    const { block, task } = await renderBlock();
    await userEvent.click(screen.getByRole("button", { name: "Complete “Learn React”" }));
    await waitFor(async () => {
      expect((await services.store.blocks.get(block.id))!.status).toBe("completed");
      expect((await services.store.tasks.get(task.id))!.status).toBe("completed");
    });
  });

  it("starts a timer for the block", async () => {
    const { block } = await renderBlock();
    await userEvent.click(screen.getByRole("button", { name: "Start timer for Learn React" }));
    await waitFor(async () => expect((await services.time.running())?.blockId).toBe(block.id));
  });
});

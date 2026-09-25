import { getStore } from "@/repositories";
import type { DataStore } from "@/repositories/types";
import { createAreaService, createProjectService } from "./area-service";
import type { ServiceContext } from "./context";
import { createDataService } from "./data-service";
import { createGoalService } from "./goal-service";
import { createHabitService } from "./habit-service";
import { createReviewService } from "./review-service";
import { createScheduleService, type ScheduleService } from "./schedule-service";
import { createTaskService, type TaskService } from "./task-service";
import { createTemplateService } from "./template-service";
import { createTimeService, type TimeService } from "./time-service";

export function createServices(store: DataStore, now: () => Date = () => new Date()) {
  const ctx: ServiceContext = { store, now };
  // Services reference each other lazily to avoid construction-order cycles.
  let tasks: TaskService;
  let schedule: ScheduleService;
  let time: TimeService;
  tasks = createTaskService(ctx, () => schedule);
  time = createTimeService(ctx, { tasks: () => tasks });
  schedule = createScheduleService(ctx, { tasks: () => tasks, time: () => time });

  return {
    store,
    tasks,
    schedule,
    time,
    areas: createAreaService(ctx),
    projects: createProjectService(ctx),
    goals: createGoalService(ctx),
    habits: createHabitService(ctx),
    reviews: createReviewService(ctx),
    templates: createTemplateService(ctx),
    data: createDataService(ctx),
  };
}

export type Services = ReturnType<typeof createServices>;

let services: Services | null = null;

export function getServices(): Services {
  services ??= createServices(getStore());
  return services;
}

export function setServices(next: Services) {
  services = next;
}

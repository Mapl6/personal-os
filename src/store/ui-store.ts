import type { DateKey } from "@/lib/date";
import type { TaskInput } from "@/services/task-service";
import { createStore } from "./create-store";

export interface TaskEditorState {
  taskId?: string;
  /** Pre-filled values for a new task (e.g. from clicking a calendar slot). */
  prefill?: Partial<TaskInput> & { date?: DateKey | null; startMinutes?: number | null };
}

interface UIState {
  commandOpen: boolean;
  taskEditor: TaskEditorState | null;
  rescheduleBlockId: string | null;
  splitBlockId: string | null;
  blockEditorId: string | null;
  rolloverOpen: boolean;
  mobileNavOpen: boolean;
}

export const uiStore = createStore<UIState>({
  commandOpen: false,
  taskEditor: null,
  rescheduleBlockId: null,
  splitBlockId: null,
  blockEditorId: null,
  rolloverOpen: false,
  mobileNavOpen: false,
});

export const ui = {
  openCommand: () => uiStore.set({ commandOpen: true }),
  closeCommand: () => uiStore.set({ commandOpen: false }),
  toggleCommand: () => uiStore.set((s) => ({ commandOpen: !s.commandOpen })),
  newTask: (prefill?: TaskEditorState["prefill"]) => uiStore.set({ taskEditor: { prefill }, commandOpen: false }),
  editTask: (taskId: string) => uiStore.set({ taskEditor: { taskId }, commandOpen: false }),
  closeTaskEditor: () => uiStore.set({ taskEditor: null }),
  reschedule: (blockId: string) => uiStore.set({ rescheduleBlockId: blockId, commandOpen: false }),
  closeReschedule: () => uiStore.set({ rescheduleBlockId: null }),
  split: (blockId: string) => uiStore.set({ splitBlockId: blockId }),
  closeSplit: () => uiStore.set({ splitBlockId: null }),
  editBlock: (blockId: string) => uiStore.set({ blockEditorId: blockId }),
  closeBlockEditor: () => uiStore.set({ blockEditorId: null }),
  openRollover: () => uiStore.set({ rolloverOpen: true, commandOpen: false }),
  closeRollover: () => uiStore.set({ rolloverOpen: false }),
  setMobileNav: (open: boolean) => uiStore.set({ mobileNavOpen: open }),
};

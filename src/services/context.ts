import type { DataStore } from "@/repositories/types";

/** Dependencies shared by all services. `now` is injectable for tests. */
export interface ServiceContext {
  store: DataStore;
  now: () => Date;
}

export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}

export async function must<T>(value: Promise<T | undefined>, what: string): Promise<T> {
  const v = await value;
  if (!v) throw new DomainError(`${what} not found`);
  return v;
}

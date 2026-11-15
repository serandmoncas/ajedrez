import { createIndexedDbStore, createMemoryStore, type ProgressStore } from "./store";

export type OpenedStore = { store: ProgressStore; persistent: boolean };

/**
 * IndexedDB store when it opens; otherwise (e.g. private browsing) an in-memory store,
 * flagged as not persistent so the UI can warn the user.
 */
export async function openStore(create: () => ProgressStore = createIndexedDbStore): Promise<OpenedStore> {
  try {
    const store = create();
    await store.load();
    return { store, persistent: true };
  } catch {
    return { store: createMemoryStore(), persistent: false };
  }
}

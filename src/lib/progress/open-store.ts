import { createIndexedDbStore, createMemoryStore, type ProgressStore } from "./store";

export type OpenedStore = { store: ProgressStore; persistent: boolean };

let persistRequested = false;

/** Asks the browser once not to evict our data under storage pressure; failures are ignored. */
function requestPersistence() {
  if (persistRequested || typeof navigator === "undefined" || !navigator.storage?.persist) return;
  persistRequested = true;
  try {
    navigator.storage.persist().catch(() => {});
  } catch {
    // Not supported or refused: the app works the same.
  }
}

/**
 * IndexedDB store when it opens; otherwise (e.g. private browsing) an in-memory store,
 * flagged as not persistent so the UI can warn the user.
 */
export async function openStore(create: () => ProgressStore = createIndexedDbStore): Promise<OpenedStore> {
  try {
    const store = create();
    await store.load();
    requestPersistence();
    return { store, persistent: true };
  } catch {
    return { store: createMemoryStore(), persistent: false };
  }
}

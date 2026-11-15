import { openDB, type IDBPDatabase } from "idb";
import { emptyProgress, progressSchema, type Progress } from "./types";

export interface ProgressStore {
  load(): Promise<Progress>;
  save(p: Progress): Promise<void>;
  exportJson(): Promise<string>;
  importJson(json: string): Promise<void>;
}

const STORE_NAME = "kv";
const KEY = "progress";

/** Parses and fully validates a backup; throws a Spanish Error before anything is written. */
function parseBackup(json: string): Progress {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new Error("El respaldo no es válido");
  }
  if (
    typeof raw === "object" &&
    raw !== null &&
    "schemaVersion" in raw &&
    raw.schemaVersion !== 1
  ) {
    throw new Error(
      `El respaldo no es válido: versión ${String(raw.schemaVersion)} no compatible`,
    );
  }
  const parsed = progressSchema.safeParse(raw);
  if (!parsed.success) throw new Error("El respaldo no es válido");
  return parsed.data;
}

function build(
  read: () => Promise<Progress | undefined>,
  write: (p: Progress) => Promise<void>,
): ProgressStore {
  const load = async () => (await read()) ?? emptyProgress(new Date());
  return {
    load,
    save: write,
    exportJson: async () => JSON.stringify(await load()),
    importJson: async (json) => write(parseBackup(json)),
  };
}

export function createIndexedDbStore(dbName = "ajedrez"): ProgressStore {
  let dbPromise: Promise<IDBPDatabase> | undefined;
  const db = () =>
    (dbPromise ??= openDB(dbName, 1, {
      upgrade(d) {
        d.createObjectStore(STORE_NAME);
      },
    }));
  return build(
    async () => (await db()).get(STORE_NAME, KEY) as Promise<Progress | undefined>,
    async (p) => {
      await (await db()).put(STORE_NAME, p, KEY);
    },
  );
}

export function createMemoryStore(initial?: Progress): ProgressStore {
  let current = initial;
  return build(
    async () => current,
    async (p) => {
      current = structuredClone(p);
    },
  );
}

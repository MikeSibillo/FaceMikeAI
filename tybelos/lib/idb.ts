import type { Decisione, TicketEscalation, Vincolo } from "@/lib/types";

type StoreName = "decisions" | "constraints" | "tickets";

type StoreMap = {
  decisions: Decisione;
  constraints: Vincolo;
  tickets: TicketEscalation;
};

const DB_NAME = "tybelos-db";
const DB_VERSION = 1;

function assertBrowser() {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB non disponibile lato server.");
  }
}

export function openDb(): Promise<IDBDatabase> {
  assertBrowser();
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("decisions")) {
        db.createObjectStore("decisions", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("constraints")) {
        db.createObjectStore("constraints", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("tickets")) {
        db.createObjectStore("tickets", { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
  });
}

async function withStore<T>(
  storeName: StoreName,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDb();
  return await new Promise<T>((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const req = fn(store);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
  });
}

export async function putItem<S extends StoreName>(
  store: S,
  value: StoreMap[S]
): Promise<void> {
  await withStore(store, "readwrite", (s) => s.put(value));
}

export async function getItem<S extends StoreName>(
  store: S,
  id: string
): Promise<StoreMap[S] | undefined> {
  const result = await withStore(store, "readonly", (s) => s.get(id));
  return result as StoreMap[S] | undefined;
}

export async function getAllItems<S extends StoreName>(
  store: S
): Promise<Array<StoreMap[S]>> {
  const result = await withStore(store, "readonly", (s) => s.getAll());
  return result as Array<StoreMap[S]>;
}

export async function deleteItem<S extends StoreName>(
  store: S,
  id: string
): Promise<void> {
  await withStore(store, "readwrite", (s) => s.delete(id));
}


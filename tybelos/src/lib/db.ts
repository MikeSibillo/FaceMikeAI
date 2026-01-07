import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Constraint, Decision, Ticket } from "@/lib/types";

type StoreName = "constraints" | "decisions" | "tickets";

interface TybelosDB extends DBSchema {
  constraints: {
    key: string;
    value: Constraint;
    indexes: { "by-updatedAt": number };
  };
  decisions: {
    key: string;
    value: Decision;
    indexes: { "by-createdAt": number; "by-updatedAt": number };
  };
  tickets: {
    key: string;
    value: Ticket;
    indexes: { "by-updatedAt": number };
  };
}

let dbPromise: Promise<IDBPDatabase<TybelosDB>> | null = null;

export function getDb() {
  if (typeof window === "undefined") {
    throw new Error("TybelosDB disponibile solo nel browser.");
  }

  if (!dbPromise) {
    dbPromise = openDB<TybelosDB>("tybelos-db", 1, {
      upgrade(db) {
        const constraints = db.createObjectStore("constraints", {
          keyPath: "id",
        });
        constraints.createIndex("by-updatedAt", "updatedAt");

        const decisions = db.createObjectStore("decisions", { keyPath: "id" });
        decisions.createIndex("by-createdAt", "createdAt");
        decisions.createIndex("by-updatedAt", "updatedAt");

        const tickets = db.createObjectStore("tickets", { keyPath: "id" });
        tickets.createIndex("by-updatedAt", "updatedAt");
      },
    });
  }

  return dbPromise;
}

export async function clearStore(store: StoreName) {
  const db = await getDb();
  const tx = db.transaction(store, "readwrite");
  await tx.store.clear();
  await tx.done;
}


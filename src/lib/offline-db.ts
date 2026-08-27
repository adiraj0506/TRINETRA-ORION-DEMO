export interface OfflineClaim {
  id?: number;
  payload: any;
  createdAt: string;
}

const DB_NAME = "TrinetraOfflineDB";
const STORE_NAME = "offline_claims";

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("IndexedDB is only available in browser environments"));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveClaimOffline(payload: any): Promise<number> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add({
      payload,
      createdAt: new Date().toISOString(),
    });
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
}

export async function getOfflineClaims(): Promise<OfflineClaim[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteOfflineClaim(id: number): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/** Synchronizes queued offline claims to the remote database when online */
export async function syncOfflineClaims(): Promise<number> {
  if (typeof window === "undefined" || !navigator.onLine) return 0;
  
  const claims = await getOfflineClaims();
  if (claims.length === 0) return 0;
  
  let syncedCount = 0;
  for (const claim of claims) {
    try {
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(claim.payload),
      });
      if (res.ok) {
        await deleteOfflineClaim(claim.id!);
        syncedCount++;
      }
    } catch (err) {
      console.error("[Offline DB] Sync failed for claim ID:", claim.id, err);
      break;
    }
  }
  return syncedCount;
}

// Automatically register online sync listener in browser environments
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    console.log("[Offline DB] Internet is back online! Synchronizing claims...");
    syncOfflineClaims().then((count) => {
      if (count > 0) {
        console.log(`[Offline DB] Successfully synced ${count} offline claims.`);
      }
    });
  });
}

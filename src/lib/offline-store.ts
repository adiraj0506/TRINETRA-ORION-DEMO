"use client";

import { useState, useEffect } from "react";

const listeners = new Set<() => void>();

let offlineModeActive = false;
let offlineQueue: any[] = [];

// Hydrate from localStorage on client side
if (typeof window !== "undefined") {
  offlineModeActive = localStorage.getItem("trinetra_offline_mode") === "true";
  try {
    offlineQueue = JSON.parse(localStorage.getItem("trinetra_offline_queue") || "[]");
  } catch {
    offlineQueue = [];
  }
}

function notifySubscribers() {
  listeners.forEach((listener) => listener());
}

export const offlineStore = {
  isOffline: () => offlineModeActive,
  
  setOffline: (active: boolean) => {
    offlineModeActive = active;
    if (typeof window !== "undefined") {
      localStorage.setItem("trinetra_offline_mode", String(active));
    }
    notifySubscribers();
  },

  getQueue: () => offlineQueue,

  addClaim: (claim: any) => {
    offlineQueue.push({
      ...claim,
      offline_id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    });
    if (typeof window !== "undefined") {
      localStorage.setItem("trinetra_offline_queue", JSON.stringify(offlineQueue));
    }
    notifySubscribers();
  },

  clearQueue: () => {
    offlineQueue = [];
    if (typeof window !== "undefined") {
      localStorage.removeItem("trinetra_offline_queue");
    }
    notifySubscribers();
  },

  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }
};

export function useOffline() {
  const [isOffline, setIsOffline] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const [queue, setQueue] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsOffline(offlineStore.isOffline());
    setQueueCount(offlineStore.getQueue().length);
    setQueue([...offlineStore.getQueue()]);

    const handleUpdate = () => {
      setIsOffline(offlineStore.isOffline());
      setQueueCount(offlineStore.getQueue().length);
      setQueue([...offlineStore.getQueue()]);
    };

    const unsubscribe = offlineStore.subscribe(handleUpdate);
    return unsubscribe;
  }, []);

  const activeOffline = mounted ? isOffline : false;
  const activeQueueCount = mounted ? queueCount : 0;

  return {
    isOffline: activeOffline,
    queueCount: activeQueueCount,
    setOffline: offlineStore.setOffline,
    addClaim: offlineStore.addClaim,
    clearQueue: offlineStore.clearQueue,
    queue: mounted ? queue : [],
    mounted
  };
}

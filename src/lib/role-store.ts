"use client";

import { useState, useEffect } from "react";

export type UserRole = "community" | "verifier" | "admin";

const listeners = new Set<() => void>();
let currentRole: UserRole = "admin"; // default to admin so the demo starts fully unlocked!

if (typeof window !== "undefined") {
  currentRole = (localStorage.getItem("trinetra_user_role") as UserRole) || "admin";
}

function notifySubscribers() {
  listeners.forEach((listener) => listener());
}

export const roleStore = {
  getRole: () => currentRole,
  
  setRole: (role: UserRole) => {
    currentRole = role;
    if (typeof window !== "undefined") {
      localStorage.setItem("trinetra_user_role", role);
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

export function useRole() {
  const [role, setRoleState] = useState<UserRole>("admin");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setRoleState(roleStore.getRole());

    const handleUpdate = () => {
      setRoleState(roleStore.getRole());
    };

    const unsubscribe = roleStore.subscribe(handleUpdate);
    return unsubscribe;
  }, []);

  const effectiveRole = mounted ? role : "admin";

  return {
    role: effectiveRole,
    setRole: roleStore.setRole,
    isCommunity: effectiveRole === "community",
    isVerifier: effectiveRole === "verifier" || effectiveRole === "admin",
    isAdmin: effectiveRole === "admin",
    mounted
  };
}

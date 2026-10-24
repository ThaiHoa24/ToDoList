"use client";

import { useMemo, useSyncExternalStore } from "react";

type CurrentUser = {
  name?: string;
  email?: string;
};

const emptySnapshot = "";

function getCurrentUserSnapshot() {
  if (typeof window === "undefined") return emptySnapshot;

  return window.localStorage.getItem("currentUser") || emptySnapshot;
}

function subscribeToCurrentUser(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
  };
}

export function useCurrentUser() {
  const currentUserSnapshot = useSyncExternalStore(
    subscribeToCurrentUser,
    getCurrentUserSnapshot,
    () => emptySnapshot,
  );

  return useMemo<CurrentUser | null>(() => {
    if (!currentUserSnapshot) return null;

    try {
      return JSON.parse(currentUserSnapshot) as CurrentUser;
    } catch {
      return null;
    }
  }, [currentUserSnapshot]);
}

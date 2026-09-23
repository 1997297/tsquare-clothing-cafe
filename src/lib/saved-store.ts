"use client";

import { useEffect, useState, useCallback } from "react";
import { Style } from "@/types";
import { getAllStyles } from "@/data/styles";

const STORAGE_KEY = "tcc_saved_looks_v1";
const EVENT_NAME = "tcc:saved_looks_changed";

export function getSavedLookIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Error reading saved looks:", err);
    return [];
  }
}

export function saveLookId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const current = getSavedLookIds();
    if (!current.includes(id)) {
      const updated = [id, ...current];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: updated }));
    }
  } catch (err) {
    console.error("Error saving look:", err);
  }
}

export function removeLookId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const current = getSavedLookIds();
    const updated = current.filter((item) => item !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: updated }));
  } catch (err) {
    console.error("Error removing look:", err);
  }
}

export function toggleSavedLook(id: string): boolean {
  const current = getSavedLookIds();
  const isSaved = current.includes(id);
  if (isSaved) {
    removeLookId(id);
    return false;
  } else {
    saveLookId(id);
    return true;
  }
}

export function useSavedStyles() {
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setSavedIds(getSavedLookIds());
    setIsLoaded(true);

    const handleStorageChange = (e: Event) => {
      const customEvent = e as CustomEvent<string[]>;
      if (customEvent.detail) {
        setSavedIds(customEvent.detail);
      } else {
        setSavedIds(getSavedLookIds());
      }
    };

    window.addEventListener(EVENT_NAME, handleStorageChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener(EVENT_NAME, handleStorageChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const isSaved = useCallback(
    (id: string) => savedIds.includes(id),
    [savedIds]
  );

  const toggle = useCallback((id: string) => {
    return toggleSavedLook(id);
  }, []);

  const savedStyles: Style[] = isLoaded
    ? getAllStyles().filter((style) => savedIds.includes(style.id))
    : [];

  return {
    savedIds,
    savedStyles,
    count: savedIds.length,
    isLoaded,
    isSaved,
    toggle,
    save: saveLookId,
    remove: removeLookId,
  };
}

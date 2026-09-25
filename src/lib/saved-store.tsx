"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Style } from "@/types";
import { getAllStyles } from "@/data/styles";
import { useAuth } from "./auth-context";
import { isSupabaseConfigured, supabase } from "./supabase/client";

const STORAGE_KEY = "tcc_saved_looks_v1";

interface SavedStylesContextValue {
  savedIds: string[];
  savedStyles: Style[];
  count: number;
  isLoaded: boolean;
  error: string | null;
  isSaved: (id: string) => boolean;
  toggle: (id: string) => Promise<boolean>;
  save: (id: string) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

const SavedStylesContext = createContext<SavedStylesContextValue | undefined>(undefined);

export function getSavedLookIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function persistGuestIds(ids: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function SavedStylesProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const savedIdsRef = useRef<string[]>([]);
  const mutationVersions = useRef(new Map<string, number>());
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applySavedIds = useCallback((ids: string[]) => {
    const uniqueIds = Array.from(new Set(ids));
    savedIdsRef.current = uniqueIds;
    setSavedIds(uniqueIds);
  }, []);

  const refresh = useCallback(async () => {
    if (isAuthLoading) return;
    setError(null);

    if (!user || !isSupabaseConfigured) {
      applySavedIds(getSavedLookIds());
      setIsLoaded(true);
      return;
    }

    const { data, error: queryError } = await supabase
      .from("saved_styles")
      .select("style_id")
      .order("saved_at", { ascending: false });

    if (queryError) {
      console.error("Saved-style query failed", queryError);
      applySavedIds([]);
      setError("Unable to load Saved Looks. Please try again.");
    } else {
      applySavedIds((data ?? []).map((row) => row.style_id));
    }
    setIsLoaded(true);
  }, [applySavedIds, isAuthLoading, user]);

  useEffect(() => {
    let active = true;

    const hydrate = async () => {
      if (isAuthLoading) return;
      setIsLoaded(false);
      setError(null);

      if (!user || !isSupabaseConfigured) {
        if (active) {
          applySavedIds(getSavedLookIds());
          setIsLoaded(true);
        }
        return;
      }

      const guestIds = getSavedLookIds();
      if (guestIds.length > 0) {
        const rows = guestIds.map((styleId) => ({ customer_id: user.id, style_id: styleId }));
        const { error: migrationError } = await supabase
          .from("saved_styles")
          .upsert(rows, {
            onConflict: "customer_id,style_id",
            ignoreDuplicates: true,
          });

        if (migrationError) {
          console.error("Saved-style migration failed", migrationError);
          if (active) setError("Some guest saves could not be moved to your account yet.");
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }

      const { data, error: queryError } = await supabase
        .from("saved_styles")
        .select("style_id")
        .order("saved_at", { ascending: false });

      if (!active) return;
      if (queryError) {
        console.error("Saved-style query failed", queryError);
        applySavedIds([]);
        setError("Unable to load Saved Looks. Please try again.");
      } else {
        applySavedIds((data ?? []).map((row) => row.style_id));
      }
      setIsLoaded(true);
    };

    void hydrate();
    return () => {
      active = false;
    };
  }, [applySavedIds, isAuthLoading, user]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || (user && isSupabaseConfigured)) return;
      applySavedIds(getSavedLookIds());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [applySavedIds, user]);

  const setSaved = useCallback(
    async (styleId: string, shouldSave: boolean) => {
      const previous = savedIdsRef.current;
      const next = shouldSave
        ? [styleId, ...previous.filter((id) => id !== styleId)]
        : previous.filter((id) => id !== styleId);
      const mutationVersion = (mutationVersions.current.get(styleId) ?? 0) + 1;
      mutationVersions.current.set(styleId, mutationVersion);
      applySavedIds(next);
      setError(null);

      if (!user || !isSupabaseConfigured) {
        persistGuestIds(next);
        return shouldSave;
      }

      const result = shouldSave
        ? await supabase.from("saved_styles").insert({ customer_id: user.id, style_id: styleId })
        : await supabase
            .from("saved_styles")
            .delete()
            .eq("customer_id", user.id)
            .eq("style_id", styleId);

      if (result.error) {
        console.error("Saved-style update failed", result.error);
        if (mutationVersions.current.get(styleId) === mutationVersion) applySavedIds(previous);
        setError(shouldSave ? "Failed to save favourite." : "Failed to remove favourite.");
        return !shouldSave;
      }
      return shouldSave;
    },
    [applySavedIds, user]
  );

  const isSaved = useCallback((id: string) => savedIds.includes(id), [savedIds]);
  const toggle = useCallback(
    (id: string) => setSaved(id, !savedIdsRef.current.includes(id)),
    [setSaved]
  );
  const save = useCallback((id: string) => setSaved(id, true), [setSaved]);
  const remove = useCallback((id: string) => setSaved(id, false), [setSaved]);
  const savedStyles = useMemo(
    () => (isLoaded ? getAllStyles().filter((style) => savedIds.includes(style.id)) : []),
    [isLoaded, savedIds]
  );

  const value = useMemo(
    () => ({
      savedIds,
      savedStyles,
      count: savedIds.length,
      isLoaded,
      error,
      isSaved,
      toggle,
      save,
      remove,
      refresh,
    }),
    [error, isLoaded, isSaved, refresh, remove, save, savedIds, savedStyles, toggle]
  );

  return (
    <SavedStylesContext.Provider value={value}>
      {children}
      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="fixed bottom-5 left-1/2 z-[80] w-[min(92vw,28rem)] -translate-x-1/2 rounded-2xl border border-red-800/60 bg-red-950 px-5 py-3 text-center text-xs text-red-200 shadow-2xl"
        >
          {error}
        </div>
      )}
    </SavedStylesContext.Provider>
  );
}

export function useSavedStyles() {
  const context = useContext(SavedStylesContext);
  if (!context) throw new Error("useSavedStyles must be used within SavedStylesProvider");
  return context;
}

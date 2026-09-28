"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Collection, Style } from "@/types";
import { searchCatalogueStyles } from "@/lib/catalogue";

interface CatalogueContextValue {
  styles: Style[];
  collections: Collection[];
  getStyleById: (id: string) => Style | undefined;
  getStyleBySlug: (slug: string) => Style | undefined;
  searchStyles: (query: string) => Style[];
}

const CatalogueContext = createContext<CatalogueContextValue | undefined>(undefined);

export function CatalogueProvider({
  styles,
  collections,
  children,
}: {
  styles: Style[];
  collections: Collection[];
  children: ReactNode;
}) {
  const value = useMemo<CatalogueContextValue>(
    () => ({
      styles,
      collections,
      getStyleById: (id) => styles.find((style) => style.id === id),
      getStyleBySlug: (slug) => styles.find((style) => style.slug === slug),
      searchStyles: (query) => searchCatalogueStyles(styles, query),
    }),
    [collections, styles]
  );

  return <CatalogueContext.Provider value={value}>{children}</CatalogueContext.Provider>;
}

export function useCatalogue() {
  const context = useContext(CatalogueContext);
  if (!context) throw new Error("useCatalogue must be used within CatalogueProvider");
  return context;
}

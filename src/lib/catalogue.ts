import type { Collection, ProductCategory, Style, StyleImage } from "@/types";

export function getStyleGallery(style: Style): StyleImage[] {
  if (style.gallery?.length) return style.gallery;

  return style.images.map((src, index) => ({
    src,
    alt: index === 0 ? `${style.name} full look` : `${style.name} garment detail ${index}`,
    isPrimary: index === 0,
  }));
}

export function getPrimaryStyleImage(style: Style): StyleImage {
  const gallery = getStyleGallery(style);
  return gallery.find((image) => image.isPrimary) ?? gallery[0] ?? {
    src: "/images/editorial/hero-editorial.jpg",
    alt: style.name,
    isPrimary: true,
  };
}

export function getStylesByCategory(styles: Style[], category: ProductCategory): Style[] {
  return styles.filter((style) => style.category === category);
}

export function getRelatedStyles(styles: Style[], currentStyle: Style, limit = 3): Style[] {
  return styles
    .filter(
      (style) =>
        style.id !== currentStyle.id &&
        (style.category === currentStyle.category ||
          style.occasions.some((occasion) => currentStyle.occasions.includes(occasion)))
    )
    .slice(0, limit);
}

export function searchCatalogueStyles(styles: Style[], query: string): Style[] {
  const normalized = query.toLowerCase().trim();
  if (!normalized) return [];

  return styles.filter((style) => {
    const searchable = [
      style.name,
      style.code,
      style.category,
      style.categoryLabel,
      style.description,
      style.fabricInformation,
      style.collection,
      ...style.occasions,
      ...style.tags,
      ...(style.availableFabrics?.flatMap((fabric) => [fabric.name, fabric.description]) ?? []),
      ...style.availableColours.map((colour) => colour.name),
    ];

    return searchable.some((value) => value.toLowerCase().includes(normalized));
  });
}

export function getCollectionBySlug(collections: Collection[], slug: string) {
  return collections.find((collection) => collection.slug === slug);
}

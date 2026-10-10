"use client";

import { supabase } from "@/lib/supabase/client";
import { validateCatalogueImage, validateCatalogueImageBytes } from "@/lib/catalogue-images";
import { addFitImageAction } from "./actions";

export async function uploadCatalogueImage(fitId: string, name: string, file: File, path: string) {
  validateCatalogueImage(file);
  validateCatalogueImageBytes(file.type, new Uint8Array(await file.arrayBuffer()));
  const { error } = await supabase.storage.from("catalogue-media").upload(path, file, {
    cacheControl: "3600", contentType: file.type, upsert: false,
  });
  // A retry uses the same random object path; never overwrite a stored photograph.
  if (error && error.statusCode !== "409") throw new Error("Photograph upload failed. Your draft is saved; retry or open its gallery.");
  try {
    const result = await addFitImageAction({ fitId, storageObjectPath: path, altText: `${name} garment view`.slice(0, 180) });
    if (!result.success) throw new Error(result.error);
    return result.data.id;
  } catch (failure) {
    // An interrupted response may follow a successful insert. Do not delete a linked
    // object: recover its ID first, and only clean up a definitely unregistered upload.
    const linked = await supabase.from("catalogue_fit_images").select("id").eq("fit_id", fitId).eq("storage_object_path", path).maybeSingle();
    if (linked.error) throw new Error("Upload status could not be confirmed. Retry this draft; no photograph was deleted.");
    if (linked.data) return linked.data.id as number;
    const removed = await supabase.storage.from("catalogue-media").remove([path]);
    if (removed.error) throw new Error("Photograph registration and cleanup need a retry. Your draft and upload have been preserved.");
    throw failure;
  }
}

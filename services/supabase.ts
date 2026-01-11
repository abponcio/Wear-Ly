/**
 * Supabase client configuration and helper functions
 */

import { createClient } from "@supabase/supabase-js";
import * as FileSystem from "expo-file-system";
import type { Database } from "@/types/database";
import type { ItemInsert, ItemRow } from "@/types/database";
import type { WardrobeItem } from "@/types/wardrobe";
import { supabaseStorage } from "@/lib/supabase-storage";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check your .env file."
  );
}

/**
 * Supabase client instance configured for React Native
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: supabaseStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Uploads an image file to Supabase Storage
 * @param bucket - Storage bucket name
 * @param path - File path within the bucket (e.g., "user_id/item_id/filename.png")
 * @param imageUri - Local URI of the image file
 * @returns Public URL of the uploaded file
 */
export const uploadImage = async (
  bucket: string,
  path: string,
  imageUri: string
): Promise<string> => {
  try {
    // Read image file
    const base64Image = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Convert base64 to ArrayBuffer
    const byteCharacters = atob(base64Image);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, byteArray, {
        contentType: imageUri.toLowerCase().endsWith(".png")
          ? "image/png"
          : "image/jpeg",
        upsert: false,
      });

    if (error) {
      console.error("Error uploading image to Supabase:", error);
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);

    if (!urlData?.publicUrl) {
      throw new Error("Failed to get public URL for uploaded image");
    }

    return urlData.publicUrl;
  } catch (error) {
    console.error("Error in uploadImage:", error);
    throw error;
  }
};

/**
 * Uploads an isolated (background-removed) image to Supabase Storage
 * @param userId - User ID
 * @param itemId - Item ID
 * @param imageUri - Local URI of the isolated PNG image
 * @returns Public URL of the uploaded isolated image
 */
export const uploadIsolatedImage = async (
  userId: string,
  itemId: string,
  imageUri: string
): Promise<string> => {
  const path = `${userId}/${itemId}/isolated.png`;
  return uploadImage("isolated-images", path, imageUri);
};

/**
 * Uploads the original image to Supabase Storage
 * @param userId - User ID
 * @param itemId - Item ID
 * @param imageUri - Local URI of the original image
 * @returns Public URL of the uploaded original image
 */
export const uploadOriginalImage = async (
  userId: string,
  itemId: string,
  imageUri: string
): Promise<string> => {
  // Get file extension
  const extension = imageUri.toLowerCase().endsWith(".png") ? "png" : "jpg";
  const path = `${userId}/${itemId}/original.${extension}`;
  return uploadImage("wardrobe-images", path, imageUri);
};

/**
 * Creates a new wardrobe item in the database
 * @param itemData - Item data to insert
 * @returns Created item row
 */
export const createItem = async (itemData: ItemInsert): Promise<ItemRow> => {
  const { data, error } = await supabase
    .from("items")
    .insert(itemData)
    .select()
    .single();

  if (error) {
    console.error("Error creating item:", error);
    throw error;
  }

  if (!data) {
    throw new Error("Failed to create item: no data returned");
  }

  return data;
};

/**
 * Fetches all wardrobe items for a specific user
 * @param userId - User ID
 * @returns Array of wardrobe items
 */
export const getUserItems = async (userId: string): Promise<WardrobeItem[]> => {
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching user items:", error);
    throw error;
  }

  // Transform database rows to WardrobeItem format
  return (data || []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    imageUrl: row.image_url,
    isolatedImageUrl: row.isolated_image_url,
    category: row.category,
    subcategory: row.subcategory,
    color: row.color,
    material: row.material,
    attributes: row.attributes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
};

/**
 * Gets the current authenticated user
 * @returns User ID or null if not authenticated
 */
export const getCurrentUserId = async (): Promise<string | null> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id || null;
};

/**
 * Deletes a wardrobe item and its associated images from storage
 * @param itemId - Item ID to delete
 * @returns true if deletion was successful, false otherwise
 */
export const deleteItem = async (itemId: string): Promise<boolean> => {
  try {
    // First, fetch the item to get user_id and image paths
    const { data: itemData, error: fetchError } = await supabase
      .from("items")
      .select("user_id, image_url, isolated_image_url")
      .eq("id", itemId)
      .single();

    if (fetchError || !itemData) {
      console.error("Error fetching item for deletion:", fetchError);
      throw new Error("Item not found");
    }

    const userId = itemData.user_id;

    // Delete images from storage buckets
    try {
      // Extract file paths from URLs
      // URLs format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
      const extractPath = (url: string, bucket: string): string | null => {
        const bucketIndex = url.indexOf(`/${bucket}/`);
        if (bucketIndex === -1) return null;
        return url.substring(bucketIndex + bucket.length + 1);
      };

      // Delete original image
      if (itemData.image_url) {
        const originalPath = extractPath(itemData.image_url, "wardrobe-images");
        if (originalPath) {
          const { error: originalError } = await supabase.storage
            .from("wardrobe-images")
            .remove([originalPath]);
          if (originalError) {
            console.warn("Error deleting original image:", originalError);
            // Don't throw - continue with deletion even if storage delete fails
          }
        }
      }

      // Delete isolated image
      if (itemData.isolated_image_url) {
        const isolatedPath = extractPath(
          itemData.isolated_image_url,
          "isolated-images"
        );
        if (isolatedPath) {
          const { error: isolatedError } = await supabase.storage
            .from("isolated-images")
            .remove([isolatedPath]);
          if (isolatedError) {
            console.warn("Error deleting isolated image:", isolatedError);
            // Don't throw - continue with deletion even if storage delete fails
          }
        }
      }

      // Alternative approach: Try deleting by folder structure
      // This is more reliable if URL parsing fails
      try {
        const folderPath = `${userId}/${itemId}`;
        await supabase.storage.from("wardrobe-images").remove([`${folderPath}/original.jpg`, `${folderPath}/original.png`]);
        await supabase.storage.from("isolated-images").remove([`${folderPath}/isolated.png`]);
      } catch (folderError) {
        console.warn("Error deleting by folder path:", folderError);
        // Continue with database deletion
      }
    } catch (storageError) {
      console.warn("Storage deletion errors (continuing with DB deletion):", storageError);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from("items")
      .delete()
      .eq("id", itemId);

    if (deleteError) {
      console.error("Error deleting item from database:", deleteError);
      throw deleteError;
    }

    return true;
  } catch (error) {
    console.error("Error in deleteItem:", error);
    throw error;
  }
};

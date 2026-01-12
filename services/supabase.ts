/**
 * Supabase client configuration and helper functions
 */

import { createClient } from "@supabase/supabase-js";
import { readAsStringAsync, EncodingType } from "expo-file-system/legacy";
import type { Database } from "@/types/database";
import type {
  ItemInsert,
  ItemRow,
  ItemUpdate,
  OutfitInsert,
  OutfitRow,
  ProfileRow,
  ProfileUpdate,
  OutfitVisualizationInsert,
  OutfitVisualizationRow,
} from "@/types/database";
import type {
  WardrobeItem,
  Outfit,
  UserProfile,
  OutfitVisualization,
  Gender,
} from "@/types/wardrobe";
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
    const base64Image = await readAsStringAsync(imageUri, {
      encoding: EncodingType.Base64,
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
    gender: row.gender,
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
        await supabase.storage
          .from("wardrobe-images")
          .remove([`${folderPath}/original.jpg`, `${folderPath}/original.png`]);
        await supabase.storage
          .from("isolated-images")
          .remove([`${folderPath}/isolated.png`]);
      } catch (folderError) {
        console.warn("Error deleting by folder path:", folderError);
        // Continue with database deletion
      }
    } catch (storageError) {
      console.warn(
        "Storage deletion errors (continuing with DB deletion):",
        storageError
      );
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

// ==================== OUTFIT FUNCTIONS ====================

/**
 * Saves an outfit to the database
 * @param outfitData - Outfit data to save
 * @returns Created outfit row
 */
export const saveOutfit = async (outfitData: {
  itemIds: string[];
  occasion?: string;
  weather?: string;
  suggestion?: string;
}): Promise<Outfit> => {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const insertData: OutfitInsert = {
    user_id: userId,
    item_ids: outfitData.itemIds,
    occasion: outfitData.occasion || null,
    weather: outfitData.weather || null,
    gemini_suggestion: outfitData.suggestion || null,
  };

  const { data, error } = await supabase
    .from("outfits")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error("Error saving outfit:", error);
    throw error;
  }

  if (!data) {
    throw new Error("Failed to save outfit: no data returned");
  }

  return {
    id: data.id,
    userId: data.user_id,
    itemIds: data.item_ids,
    occasion: data.occasion || undefined,
    weather: data.weather || undefined,
    geminiSuggestion: data.gemini_suggestion || undefined,
    createdAt: data.created_at,
  };
};

/**
 * Fetches all saved outfits for the current user
 * @returns Array of outfits (without populated items)
 */
export const getUserOutfits = async (): Promise<Outfit[]> => {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("outfits")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching user outfits:", error);
    throw error;
  }

  return (data || []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    itemIds: row.item_ids,
    occasion: row.occasion || undefined,
    weather: row.weather || undefined,
    geminiSuggestion: row.gemini_suggestion || undefined,
    createdAt: row.created_at,
  }));
};

/**
 * Deletes an outfit from the database
 * @param outfitId - Outfit ID to delete
 * @returns true if deletion was successful
 */
export const deleteOutfit = async (outfitId: string): Promise<boolean> => {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const { error } = await supabase
    .from("outfits")
    .delete()
    .eq("id", outfitId)
    .eq("user_id", userId); // Extra safety: ensure user owns the outfit

  if (error) {
    console.error("Error deleting outfit:", error);
    throw error;
  }

  return true;
};

/**
 * Updates an item's gender
 * @param itemId - Item ID to update
 * @param gender - New gender value
 * @returns true if update was successful
 */
export const updateItemGender = async (
  itemId: string,
  gender: Gender | null
): Promise<boolean> => {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const { error } = await supabase
    .from("items")
    .update({ gender } as ItemUpdate)
    .eq("id", itemId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error updating item gender:", error);
    throw error;
  }

  return true;
};

// ==================== PROFILE FUNCTIONS ====================

/**
 * Gets or creates a user profile
 * @returns User profile
 */
export const getUserProfile = async (): Promise<UserProfile | null> => {
  const userId = await getCurrentUserId();
  if (!userId) {
    return null;
  }

  // Try to get existing profile
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows returned
    console.error("Error fetching profile:", error);
    throw error;
  }

  if (!data) {
    // Create profile if it doesn't exist
    const { data: newProfile, error: createError } = await supabase
      .from("profiles")
      .insert({ id: userId })
      .select()
      .single();

    if (createError) {
      console.error("Error creating profile:", createError);
      throw createError;
    }

    return newProfile
      ? {
          id: newProfile.id,
          personalModelUrl: newProfile.personal_model_url,
          gender: newProfile.gender,
          createdAt: newProfile.created_at,
          updatedAt: newProfile.updated_at,
        }
      : null;
  }

  return {
    id: data.id,
    personalModelUrl: data.personal_model_url,
    gender: data.gender,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

/**
 * Updates the user's profile
 * @param updates - Fields to update
 * @returns Updated profile
 */
export const updateUserProfile = async (
  updates: ProfileUpdate
): Promise<UserProfile> => {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating profile:", error);
    throw error;
  }

  if (!data) {
    throw new Error("Failed to update profile: no data returned");
  }

  return {
    id: data.id,
    personalModelUrl: data.personal_model_url,
    gender: data.gender,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

/**
 * Uploads a personal model image to Supabase Storage
 * @param imageUri - Local URI of the image
 * @returns Public URL of the uploaded image
 */
export const uploadPersonalModelImage = async (
  imageUri: string
): Promise<string> => {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const extension = imageUri.toLowerCase().endsWith(".png") ? "png" : "jpg";
  const path = `${userId}/personal-model.${extension}`;

  // Use isolated-images bucket for personal models
  return uploadImage("isolated-images", path, imageUri);
};

// ==================== OUTFIT VISUALIZATION FUNCTIONS ====================

/**
 * Gets a cached outfit visualization by hash
 * @param combinationHash - Hash of profile + sorted item IDs
 * @returns Cached visualization or null
 */
export const getCachedVisualization = async (
  combinationHash: string
): Promise<OutfitVisualization | null> => {
  const { data, error } = await supabase
    .from("outfit_visualizations")
    .select("*")
    .eq("combination_hash", combinationHash)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching cached visualization:", error);
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    userId: data.user_id,
    combinationHash: data.combination_hash,
    itemIds: data.item_ids,
    visualizationUrl: data.visualization_url,
    createdAt: data.created_at,
  };
};

/**
 * Gets a cached outfit visualization by item IDs
 * Looks up visualization that contains the same set of items
 * @param itemIds - Array of item IDs to match
 * @returns Cached visualization or null
 */
export const getVisualizationByItemIds = async (
  itemIds: string[]
): Promise<OutfitVisualization | null> => {
  // Sort item IDs for consistent matching
  const sortedIds = [...itemIds].sort();

  const { data, error } = await supabase
    .from("outfit_visualizations")
    .select("*")
    .contains("item_ids", sortedIds)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 is "no rows returned" - not a real error
    return null;
  }

  if (!data) {
    return null;
  }

  // Verify exact match (contains might return supersets)
  const dataItemsSorted = [...data.item_ids].sort();
  if (JSON.stringify(dataItemsSorted) !== JSON.stringify(sortedIds)) {
    return null;
  }

  return {
    id: data.id,
    userId: data.user_id,
    combinationHash: data.combination_hash,
    itemIds: data.item_ids,
    visualizationUrl: data.visualization_url,
    createdAt: data.created_at,
  };
};

/**
 * Saves a new outfit visualization to the cache
 * @param combinationHash - Hash of profile + sorted item IDs
 * @param itemIds - Array of item IDs in the outfit
 * @param visualizationUrl - URL of the generated visualization image
 * @returns Created visualization
 */
export const saveVisualization = async (
  combinationHash: string,
  itemIds: string[],
  visualizationUrl: string
): Promise<OutfitVisualization> => {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const insertData: OutfitVisualizationInsert = {
    user_id: userId,
    combination_hash: combinationHash,
    item_ids: itemIds,
    visualization_url: visualizationUrl,
  };

  // Use upsert to update if hash exists, insert if not
  const { data, error } = await supabase
    .from("outfit_visualizations")
    .upsert(insertData, { onConflict: "combination_hash" })
    .select()
    .single();

  if (error) {
    console.error("Error saving visualization:", error);
    throw error;
  }

  if (!data) {
    throw new Error("Failed to save visualization: no data returned");
  }

  return {
    id: data.id,
    userId: data.user_id,
    combinationHash: data.combination_hash,
    itemIds: data.item_ids,
    visualizationUrl: data.visualization_url,
    createdAt: data.created_at,
  };
};

/**
 * Uploads a visualization image to Supabase Storage
 * @param imageUri - Local URI of the image
 * @param hash - Combination hash for unique naming
 * @returns Public URL of the uploaded image
 */
export const uploadVisualizationImage = async (
  imageUri: string,
  hash: string
): Promise<string> => {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const extension = imageUri.toLowerCase().endsWith(".png") ? "png" : "jpg";
  const path = `${userId}/visualizations/${hash}.${extension}`;

  return uploadImage("isolated-images", path, imageUri);
};

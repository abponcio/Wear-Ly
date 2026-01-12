/**
 * Custom hook for uploading wardrobe items
 * Orchestrates the complete upload workflow: Gemini analysis, background removal, and Supabase storage
 */

import { useState, useCallback } from "react";
import { processImageWithGemini } from "@/services/gemini";
import { removeBackground } from "@/services/photoroom";
import {
  supabase,
  uploadOriginalImage,
  uploadIsolatedImage,
  createItem,
  getCurrentUserId,
} from "@/services/supabase";
import type { WardrobeItem } from "@/types/wardrobe";

/**
 * Generate a UUID v4 (React Native compatible)
 */
const generateUUID = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export type UploadStep =
  | "idle"
  | "analyzing"
  | "removing-background"
  | "uploading-images"
  | "saving"
  | "complete";

interface UseUploadItemReturn {
  uploadItem: (imageUri: string) => Promise<WardrobeItem | null>;
  isLoading: boolean;
  currentStep: UploadStep;
  error: string | null;
  resetError: () => void;
}

/**
 * Hook for uploading wardrobe items with AI analysis and background removal
 */
export const useUploadItem = (): UseUploadItemReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<UploadStep>("idle");
  const [error, setError] = useState<string | null>(null);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  const uploadItem = useCallback(
    async (imageUri: string): Promise<WardrobeItem | null> => {
      setIsLoading(true);
      setError(null);

      try {
        // Step 1: Get current user ID
        const userId = await getCurrentUserId();
        if (!userId) {
          throw new Error("Please sign in to upload items.");
        }

        // Step 2: Analyze image with Gemini to get metadata
        setCurrentStep("analyzing");
        console.log("Analyzing image with Gemini...");
        const metadata = await processImageWithGemini(imageUri);

        if (!metadata) {
          throw new Error(
            "Couldn't identify the clothing item. Please try a clearer photo."
          );
        }

        console.log("Metadata extracted:", metadata);

        // Step 3: Remove background using Photoroom
        setCurrentStep("removing-background");
        console.log("Removing background...");
        const isolatedImageUri = await removeBackground(imageUri);
        console.log("Background removed, isolated image:", isolatedImageUri);

        // Step 4: Generate item ID
        const itemId = generateUUID();

        // Step 5: Upload images to Supabase Storage
        setCurrentStep("uploading-images");
        console.log("Uploading images...");
        const [originalImageUrl, isolatedImageUrl] = await Promise.all([
          uploadOriginalImage(userId, itemId, imageUri),
          uploadIsolatedImage(userId, itemId, isolatedImageUri),
        ]);
        console.log("Images uploaded:", { originalImageUrl, isolatedImageUrl });

        // Step 6: Save item metadata to database
        setCurrentStep("saving");
        console.log("Saving item to database...");
        const itemData = {
          id: itemId,
          user_id: userId,
          image_url: originalImageUrl,
          isolated_image_url: isolatedImageUrl,
          category: metadata.category,
          subcategory: metadata.subcategory,
          color: metadata.color,
          material: metadata.material,
          attributes: metadata.attributes,
        };

        const createdItem = await createItem(itemData);
        console.log("Item created successfully:", createdItem.id);

        setCurrentStep("complete");

        // Step 8: Transform to WardrobeItem format and return
        const wardrobeItem: WardrobeItem = {
          id: createdItem.id,
          userId: createdItem.user_id,
          imageUrl: createdItem.image_url,
          isolatedImageUrl: createdItem.isolated_image_url,
          category: createdItem.category,
          subcategory: createdItem.subcategory,
          color: createdItem.color,
          material: createdItem.material,
          attributes: createdItem.attributes,
          createdAt: createdItem.created_at,
          updatedAt: createdItem.updated_at,
        };

        setIsLoading(false);
        setCurrentStep("idle");
        return wardrobeItem;
      } catch (err) {
        console.error("Error uploading item:", err);

        // User-friendly error messages
        let errorMessage = "Something went wrong. Please try again.";

        if (err instanceof Error) {
          const message = err.message.toLowerCase();
          if (message.includes("network") || message.includes("fetch")) {
            errorMessage =
              "Network error. Please check your connection and try again.";
          } else if (message.includes("auth") || message.includes("sign in")) {
            errorMessage = "Please sign in to upload items.";
          } else if (message.includes("api") || message.includes("gemini")) {
            errorMessage =
              "AI analysis failed. Please try again with a clearer photo.";
          } else if (
            message.includes("storage") ||
            message.includes("upload")
          ) {
            errorMessage =
              "Failed to upload images. Please check your connection and try again.";
          } else if (message.includes("database") || message.includes("save")) {
            errorMessage = "Failed to save item. Please try again.";
          } else {
            // Use the original message if it's already user-friendly
            errorMessage = err.message;
          }
        }

        setError(errorMessage);
        setIsLoading(false);
        setCurrentStep("idle");
        return null;
      }
    },
    []
  );

  return {
    uploadItem,
    isLoading,
    currentStep,
    error,
    resetError,
  };
};

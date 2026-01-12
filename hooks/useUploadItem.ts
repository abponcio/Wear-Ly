/**
 * Custom hook for uploading wardrobe items
 * Two-phase workflow:
 * 1. Analyze: Detect clothing items in photo (fast, no generation)
 * 2. Process: Generate clean images for selected items only
 */

import { useState, useCallback } from "react";
import { detectAllClothingItems, generateCleanProductImage } from "@/services/gemini";
import {
  uploadOriginalImage,
  uploadIsolatedImage,
  createItem,
  getCurrentUserId,
} from "@/services/supabase";
import type { WardrobeItem } from "@/types/wardrobe";
import type { WardrobeItemMetadata } from "@/lib/validations";

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
  | "generating-images"
  | "uploading-images"
  | "saving"
  | "complete";

export interface DetectedItem extends WardrobeItemMetadata {
  id: string; // Temporary ID for selection tracking
  selected: boolean;
}

interface UploadProgress {
  currentItem: number;
  totalItems: number;
}

interface UseUploadItemReturn {
  // Phase 1: Analyze
  analyzeImage: (imageUri: string) => Promise<DetectedItem[] | null>;
  detectedItems: DetectedItem[];
  setDetectedItems: React.Dispatch<React.SetStateAction<DetectedItem[]>>;
  toggleItemSelection: (itemId: string) => void;
  selectAllItems: () => void;
  deselectAllItems: () => void;

  // Phase 2: Process
  processSelectedItems: (imageUri: string) => Promise<WardrobeItem[]>;

  // State
  isLoading: boolean;
  isAnalyzing: boolean;
  isProcessing: boolean;
  currentStep: UploadStep;
  progress: UploadProgress;
  error: string | null;
  resetError: () => void;
  resetState: () => void;
}

/**
 * Hook for uploading wardrobe items with AI multi-item detection and generative imaging
 */
export const useUploadItem = (): UseUploadItemReturn => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<UploadStep>("idle");
  const [progress, setProgress] = useState<UploadProgress>({ currentItem: 0, totalItems: 0 });
  const [error, setError] = useState<string | null>(null);
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  const resetState = useCallback(() => {
    setDetectedItems([]);
    setError(null);
    setCurrentStep("idle");
    setProgress({ currentItem: 0, totalItems: 0 });
    setIsAnalyzing(false);
    setIsProcessing(false);
  }, []);

  /**
   * Toggle selection for a specific item
   */
  const toggleItemSelection = useCallback((itemId: string) => {
    setDetectedItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, selected: !item.selected } : item
      )
    );
  }, []);

  /**
   * Select all detected items
   */
  const selectAllItems = useCallback(() => {
    setDetectedItems(prev => prev.map(item => ({ ...item, selected: true })));
  }, []);

  /**
   * Deselect all detected items
   */
  const deselectAllItems = useCallback(() => {
    setDetectedItems(prev => prev.map(item => ({ ...item, selected: false })));
  }, []);

  /**
   * Phase 1: Analyze image and detect clothing items (no image generation)
   */
  const analyzeImage = useCallback(
    async (imageUri: string): Promise<DetectedItem[] | null> => {
      setIsAnalyzing(true);
      setError(null);
      setCurrentStep("analyzing");
      setDetectedItems([]);

      try {
        // Get current user ID first
        const userId = await getCurrentUserId();
        if (!userId) {
          throw new Error("Please sign in to upload items.");
        }

        console.log("[Upload] Analyzing image for multiple items...");
        const items = await detectAllClothingItems(imageUri);

        if (!items || items.length === 0) {
          throw new Error(
            "Couldn't identify any clothing items. Please try a clearer photo."
          );
        }

        console.log(`[Upload] Detected ${items.length} items:`, items);

        // Convert to DetectedItems with selection state (all selected by default)
        const detectedWithSelection: DetectedItem[] = items.map((item, index) => ({
          ...item,
          id: `detected-${index}-${Date.now()}`, // Temporary ID for tracking
          selected: true, // Default to selected
        }));

        setDetectedItems(detectedWithSelection);
        setCurrentStep("idle");
        setIsAnalyzing(false);
        return detectedWithSelection;
      } catch (err) {
        console.error("[Upload] Error analyzing image:", err);

        let errorMessage = "Failed to analyze image. Please try again.";
        if (err instanceof Error) {
          const message = err.message.toLowerCase();
          if (message.includes("network") || message.includes("fetch")) {
            errorMessage = "Network error. Please check your connection.";
          } else if (message.includes("auth") || message.includes("sign in")) {
            errorMessage = "Please sign in to upload items.";
          } else if (message.includes("quota") || message.includes("busy")) {
            errorMessage = "AI service is busy. Please wait and try again.";
          } else {
            errorMessage = err.message;
          }
        }

        setError(errorMessage);
        setIsAnalyzing(false);
        setCurrentStep("idle");
        return null;
      }
    },
    []
  );

  /**
   * Phase 2: Process selected items - generate images and save to DB
   */
  const processSelectedItems = useCallback(
    async (imageUri: string): Promise<WardrobeItem[]> => {
      const selectedItems = detectedItems.filter(item => item.selected);

      if (selectedItems.length === 0) {
        setError("Please select at least one item to add.");
        return [];
      }

      setIsProcessing(true);
      setError(null);
      const createdItems: WardrobeItem[] = [];

      try {
        const userId = await getCurrentUserId();
        if (!userId) {
          throw new Error("Please sign in to upload items.");
        }

        setProgress({ currentItem: 0, totalItems: selectedItems.length });

        // Process each selected item
        for (let i = 0; i < selectedItems.length; i++) {
          const itemMetadata = selectedItems[i];
          setProgress({ currentItem: i + 1, totalItems: selectedItems.length });

          console.log(`[Upload] Processing item ${i + 1}/${selectedItems.length}: ${itemMetadata.color} ${itemMetadata.subcategory}`);

          // Generate clean product image using Gemini
          setCurrentStep("generating-images");
          console.log(`[Upload] Generating clean product image for item ${i + 1}...`);
          const cleanImageUri = await generateCleanProductImage(imageUri, itemMetadata);
          console.log(`[Upload] Clean image generated: ${cleanImageUri}`);

          // Generate item ID
          const itemId = generateUUID();

          // Upload images to Supabase Storage
          setCurrentStep("uploading-images");
          console.log(`[Upload] Uploading images for item ${i + 1}...`);
          const [originalImageUrl, cleanImageUrl] = await Promise.all([
            uploadOriginalImage(userId, itemId, imageUri),
            uploadIsolatedImage(userId, itemId, cleanImageUri),
          ]);
          console.log(`[Upload] Images uploaded for item ${i + 1}:`, { originalImageUrl, cleanImageUrl });

          // Save item metadata to database
          setCurrentStep("saving");
          console.log(`[Upload] Saving item ${i + 1} to database...`);
          const itemData = {
            id: itemId,
            user_id: userId,
            image_url: originalImageUrl,
            isolated_image_url: cleanImageUrl,
            category: itemMetadata.category,
            subcategory: itemMetadata.subcategory,
            color: itemMetadata.color,
            material: itemMetadata.material,
            attributes: itemMetadata.attributes,
            gender: itemMetadata.gender || 'unisex',
          };

          const createdItem = await createItem(itemData);
          console.log(`[Upload] Item ${i + 1} created successfully:`, createdItem.id);

          // Transform to WardrobeItem format
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
            gender: createdItem.gender,
            createdAt: createdItem.created_at,
            updatedAt: createdItem.updated_at,
          };

          createdItems.push(wardrobeItem);
        }

        setCurrentStep("complete");
        console.log(`[Upload] Successfully created ${createdItems.length} items`);

        setIsProcessing(false);
        setCurrentStep("idle");
        setProgress({ currentItem: 0, totalItems: 0 });
        setDetectedItems([]);
        return createdItems;
      } catch (err) {
        console.error("[Upload] Error processing items:", err);

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
              "AI image generation failed. Please try again.";
          } else if (message.includes("quota") || message.includes("busy")) {
            errorMessage = "AI service is busy. Please wait a moment and try again.";
          } else if (
            message.includes("storage") ||
            message.includes("upload")
          ) {
            errorMessage =
              "Failed to upload images. Please check your connection.";
          } else if (message.includes("database") || message.includes("save")) {
            errorMessage = "Failed to save items. Please try again.";
          } else {
            errorMessage = err.message;
          }
        }

        setError(errorMessage);
        setIsProcessing(false);
        setCurrentStep("idle");
        setProgress({ currentItem: 0, totalItems: 0 });
        return createdItems; // Return any items that were created before the error
      }
    },
    [detectedItems]
  );

  const isLoading = isAnalyzing || isProcessing;

  return {
    // Phase 1
    analyzeImage,
    detectedItems,
    setDetectedItems,
    toggleItemSelection,
    selectAllItems,
    deselectAllItems,

    // Phase 2
    processSelectedItems,

    // State
    isLoading,
    isAnalyzing,
    isProcessing,
    currentStep,
    progress,
    error,
    resetError,
    resetState,
  };
};

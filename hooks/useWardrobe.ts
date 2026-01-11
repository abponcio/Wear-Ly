/**
 * Custom hook for fetching wardrobe items and generating outfits
 */

import { useState, useEffect, useCallback } from "react";
import {
  getUserItems,
  getCurrentUserId,
  deleteItem as deleteItemService,
} from "@/services/supabase";
import { generateOutfit } from "@/services/gemini";
import type {
  WardrobeItem,
  OutfitContext,
  OutfitSuggestion,
} from "@/types/wardrobe";

interface UseWardrobeReturn {
  items: WardrobeItem[];
  isLoading: boolean;
  error: string | null;
  refreshItems: () => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;
}

interface UseOutfitGenerationReturn {
  generateOutfitSuggestion: (
    context: OutfitContext
  ) => Promise<OutfitSuggestion | null>;
  isLoading: boolean;
  error: string | null;
  currentOutfit: OutfitSuggestion | null;
}

/**
 * Hook for fetching and managing wardrobe items
 */
export const useWardrobe = (): UseWardrobeReturn => {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error("User not authenticated. Please sign in.");
      }

      const userItems = await getUserItems(userId);
      setItems(userItems);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load wardrobe items";
      setError(errorMessage);
      console.error("Error fetching wardrobe items:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const deleteItem = useCallback(
    async (itemId: string): Promise<void> => {
      try {
        // Optimistic UI update - remove item from list immediately
        setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));

        // Delete from database and storage
        const success = await deleteItemService(itemId);

        if (!success) {
          // If deletion failed, refresh to restore the item
          await fetchItems();
          throw new Error("Failed to delete item");
        }

        // Refresh to ensure consistency
        await fetchItems();
      } catch (err) {
        // Restore item on error
        await fetchItems();
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete item";
        setError(errorMessage);
        throw err; // Re-throw to allow caller to handle
      }
    },
    [fetchItems]
  );

  return {
    items,
    isLoading,
    error,
    refreshItems: fetchItems,
    deleteItem,
  };
};

/**
 * Hook for generating outfit suggestions
 */
export const useOutfitGeneration = (
  wardrobeItems: WardrobeItem[]
): UseOutfitGenerationReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentOutfit, setCurrentOutfit] = useState<OutfitSuggestion | null>(
    null
  );

  const generateOutfitSuggestion = useCallback(
    async (context: OutfitContext): Promise<OutfitSuggestion | null> => {
      if (wardrobeItems.length < 3) {
        setError(
          "You need at least 3 items in your wardrobe to generate an outfit"
        );
        return null;
      }

      setIsLoading(true);
      setError(null);
      setCurrentOutfit(null);

      try {
        const suggestion = await generateOutfit(wardrobeItems, context);

        if (!suggestion) {
          throw new Error("Failed to generate outfit suggestion");
        }

        setCurrentOutfit(suggestion);
        return suggestion;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to generate outfit suggestion";
        setError(errorMessage);
        console.error("Error generating outfit:", err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [wardrobeItems]
  );

  return {
    generateOutfitSuggestion,
    isLoading,
    error,
    currentOutfit,
  };
};

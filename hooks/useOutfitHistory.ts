import { useState, useEffect, useCallback } from "react";
import {
  getUserOutfits,
  deleteOutfit as deleteOutfitService,
  saveOutfit as saveOutfitService,
} from "@/services/supabase";
import type { Outfit, WardrobeItem } from "@/types/wardrobe";

interface UseOutfitHistoryReturn {
  outfits: Outfit[];
  isLoading: boolean;
  error: string | null;
  refreshOutfits: () => Promise<void>;
  saveOutfit: (data: {
    itemIds: string[];
    occasion?: string;
    weather?: string;
    suggestion?: string;
  }) => Promise<Outfit | null>;
  deleteOutfit: (outfitId: string) => Promise<boolean>;
  isSaving: boolean;
  isDeleting: boolean;
}

/**
 * Hook for managing outfit history (saved outfits)
 */
export const useOutfitHistory = (): UseOutfitHistoryReturn => {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchOutfits = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const userOutfits = await getUserOutfits();
      setOutfits(userOutfits);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load outfit history";
      setError(errorMessage);
      console.error("Error fetching outfit history:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOutfits();
  }, [fetchOutfits]);

  const saveOutfit = useCallback(
    async (data: {
      itemIds: string[];
      occasion?: string;
      weather?: string;
      suggestion?: string;
    }): Promise<Outfit | null> => {
      try {
        setIsSaving(true);
        setError(null);
        const savedOutfit = await saveOutfitService(data);
        // Add to local state
        setOutfits((prev) => [savedOutfit, ...prev]);
        return savedOutfit;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to save outfit";
        setError(errorMessage);
        console.error("Error saving outfit:", err);
        return null;
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  const deleteOutfit = useCallback(
    async (outfitId: string): Promise<boolean> => {
      try {
        setIsDeleting(true);
        setError(null);

        // Optimistic update
        setOutfits((prev) => prev.filter((o) => o.id !== outfitId));

        const success = await deleteOutfitService(outfitId);

        if (!success) {
          // Revert on failure
          await fetchOutfits();
          throw new Error("Failed to delete outfit");
        }

        return true;
      } catch (err) {
        // Revert on error
        await fetchOutfits();
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete outfit";
        setError(errorMessage);
        console.error("Error deleting outfit:", err);
        return false;
      } finally {
        setIsDeleting(false);
      }
    },
    [fetchOutfits]
  );

  return {
    outfits,
    isLoading,
    error,
    refreshOutfits: fetchOutfits,
    saveOutfit,
    deleteOutfit,
    isSaving,
    isDeleting,
  };
};

/**
 * Helper to populate outfit items from wardrobe
 */
export const populateOutfitItems = (
  outfit: Outfit,
  wardrobeItems: WardrobeItem[]
): Outfit => {
  const items = outfit.itemIds
    .map((id) => wardrobeItems.find((item) => item.id === id))
    .filter((item): item is WardrobeItem => item !== undefined);

  return {
    ...outfit,
    items,
  };
};

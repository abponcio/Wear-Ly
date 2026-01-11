/**
 * Custom hook for uploading wardrobe items
 * Orchestrates the complete upload workflow: Gemini analysis, background removal, and Supabase storage
 */

import { useState, useCallback } from 'react';
import { processImageWithGemini } from '@/services/gemini';
import { removeBackground } from '@/services/photoroom';
import {
  supabase,
  uploadOriginalImage,
  uploadIsolatedImage,
  createItem,
  getCurrentUserId,
} from '@/services/supabase';
import type { WardrobeItem } from '@/types/wardrobe';

interface UseUploadItemReturn {
  uploadItem: (imageUri: string) => Promise<WardrobeItem | null>;
  isLoading: boolean;
  error: string | null;
  resetError: () => void;
}

/**
 * Hook for uploading wardrobe items with AI analysis and background removal
 */
export const useUploadItem = (): UseUploadItemReturn => {
  const [isLoading, setIsLoading] = useState(false);
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
          throw new Error('User not authenticated. Please sign in.');
        }

        // Step 2: Analyze image with Gemini to get metadata
        console.log('Analyzing image with Gemini...');
        const metadata = await processImageWithGemini(imageUri);
        
        if (!metadata) {
          throw new Error('Failed to analyze image. Please try again.');
        }

        console.log('Metadata extracted:', metadata);

        // Step 3: Remove background using Photoroom
        console.log('Removing background...');
        const isolatedImageUri = await removeBackground(imageUri);
        console.log('Background removed, isolated image:', isolatedImageUri);

        // Step 4: Generate item ID
        const itemId = crypto.randomUUID();

        // Step 5: Upload original image to Supabase Storage
        console.log('Uploading original image...');
        const originalImageUrl = await uploadOriginalImage(userId, itemId, imageUri);
        console.log('Original image uploaded:', originalImageUrl);

        // Step 6: Upload isolated image to Supabase Storage
        console.log('Uploading isolated image...');
        const isolatedImageUrl = await uploadIsolatedImage(userId, itemId, isolatedImageUri);
        console.log('Isolated image uploaded:', isolatedImageUrl);

        // Step 7: Save item metadata to database
        console.log('Saving item to database...');
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
        console.log('Item created successfully:', createdItem.id);

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
        return wardrobeItem;
      } catch (err) {
        console.error('Error uploading item:', err);
        
        const errorMessage = err instanceof Error 
          ? err.message 
          : 'An unexpected error occurred during upload';
        
        setError(errorMessage);
        setIsLoading(false);
        return null;
      }
    },
    []
  );

  return {
    uploadItem,
    isLoading,
    error,
    resetError,
  };
};

/**
 * Virtual Try-On Service
 * Handles generating outfit visualizations with caching for performance
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  readAsStringAsync,
  writeAsStringAsync,
  cacheDirectory,
  EncodingType,
} from "expo-file-system/legacy";
import {
  getCachedVisualization,
  saveVisualization,
  uploadVisualizationImage,
  getCurrentUserId,
} from "@/services/supabase";
import type { WardrobeItem, OutfitVisualization, ProfileGender, Gender } from "@/types/wardrobe";

// Initialize Gemini client
const getGeminiClient = () => {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("EXPO_PUBLIC_GEMINI_API_KEY is not set in environment variables");
  }
  return new GoogleGenerativeAI(apiKey);
};

/**
 * Generates a unique combination hash for caching
 * @param profileId - User's profile ID
 * @param itemIds - Array of item IDs in the outfit
 * @returns Unique hash string
 */
export const generateCombinationHash = (
  profileId: string,
  itemIds: string[]
): string => {
  // Sort item IDs to ensure consistent hashing regardless of order
  const sortedIds = [...itemIds].sort();
  const combined = `${profileId}_${sortedIds.join("_")}`;

  // Simple hash function for the combination
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return `${profileId.slice(0, 8)}_${Math.abs(hash).toString(16)}`;
};

/**
 * Checks gender compatibility between user and clothing items
 * @param userGender - User's gender from profile
 * @param items - Array of wardrobe items
 * @returns Object with compatibility status and any incompatible items
 */
export const checkGenderCompatibility = (
  userGender: ProfileGender | null | undefined,
  items: WardrobeItem[]
): { isCompatible: boolean; incompatibleItems: WardrobeItem[] } => {
  if (!userGender) {
    // If no gender set, allow all items
    return { isCompatible: true, incompatibleItems: [] };
  }

  const incompatibleItems: WardrobeItem[] = [];

  for (const item of items) {
    if (!item.gender || item.gender === "unisex") {
      // Unisex items are always compatible
      continue;
    }

    // Check if the item gender matches user gender
    // male items only for male users, female items only for female users
    // non-binary users can wear any gendered item
    if (userGender === "non-binary") {
      continue;
    }

    if (
      (userGender === "male" && item.gender === "female") ||
      (userGender === "female" && item.gender === "male")
    ) {
      incompatibleItems.push(item);
    }
  }

  return {
    isCompatible: incompatibleItems.length === 0,
    incompatibleItems,
  };
};

/**
 * Fetches an image from URL and converts to base64
 */
const fetchImageAsBase64 = async (imageUrl: string): Promise<string> => {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove data URL prefix if present
        const base64 = base64String.includes(",")
          ? base64String.split(",")[1]
          : base64String;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("[Try-On] Error fetching image:", error);
    throw error;
  }
};

/**
 * Generates a virtual try-on visualization using multi-image fusion
 * @param personalModelUrl - URL of the user's personal model image
 * @param clothingItems - Array of wardrobe items to dress the model in
 * @returns Local URI of the generated visualization
 */
export const generateTryOnVisualization = async (
  personalModelUrl: string,
  clothingItems: WardrobeItem[]
): Promise<string> => {
  try {
    const genAI = getGeminiClient();

    // Use gemini-3-pro-image-preview for higher quality image generation
    // This model has better handling of full-body shots and complex prompts
    const model = genAI.getGenerativeModel(
      {
        model: "gemini-3-pro-image-preview",
        generationConfig: {
          // @ts-ignore - responseModalities is supported in v2 API but not in types yet
          responseModalities: ["TEXT", "IMAGE"],
        },
      },
      { apiVersion: "v1beta" }
    );

    console.log("[Try-On] Fetching images for fusion...");

    // Fetch all images and convert to base64
    const personalModelBase64 = await fetchImageAsBase64(personalModelUrl);

    // Fetch clothing images
    const clothingImagesBase64 = await Promise.all(
      clothingItems.map(async (item) => {
        const imageUrl = item.isolatedImageUrl || item.imageUrl;
        const base64 = await fetchImageAsBase64(imageUrl);
        return {
          base64,
          description: `${item.color} ${item.subcategory} (${item.category})`,
        };
      })
    );

    // Build clothing description for prompt
    const clothingDescriptions = clothingImagesBase64
      .map((c, i) => `${i + 2}. ${c.description}`)
      .join("\n");

    // Prompt for multi-image fusion virtual try-on - emphasizing full body framing
    const prompt = `Create a professional fashion photography virtual try-on image.

REFERENCE IMAGES PROVIDED:
1. Person reference (Image 1) - The model to dress. Preserve their exact face, hair, skin tone, and body shape.
${clothingDescriptions}

MANDATORY OUTPUT SPECIFICATIONS:
- Aspect ratio: 3:4 (portrait orientation, like a fashion magazine cover)
- Framing: COMPLETE FULL BODY from top of head to bottom of feet
- Composition: Person centered with 10-15% margin on all sides
- Camera angle: Straight-on, eye-level fashion photography shot

ABSOLUTE REQUIREMENTS (DO NOT VIOLATE):
1. HEAD MUST BE FULLY VISIBLE - Include at least 2 inches of space above the head
2. FEET MUST BE FULLY VISIBLE - Show complete shoes/feet at the bottom
3. ENTIRE BODY IN FRAME - No cropping of any body parts whatsoever
4. Person should be standing upright in a natural, confident pose

STYLING INSTRUCTIONS:
- Dress the person in ALL clothing items from images 2+
- Clothes must fit naturally and drape realistically
- Preserve the model's exact identity - same face, same hair, same body proportions
- Professional studio lighting: soft, even, flattering
- Background: Clean, solid light gray or white studio backdrop

QUALITY:
- High resolution, sharp details
- E-commerce/lookbook catalog quality
- Natural skin tones and fabric textures

Generate ONE complete fashion photo showing the full outfit on the model.`;

    console.log(`[Try-On] Generating visualization with ${clothingItems.length} items...`);

    // Build the content array with all images
    const contentParts: any[] = [prompt];

    // Add personal model image
    contentParts.push({
      inlineData: {
        data: personalModelBase64,
        mimeType: "image/jpeg",
      },
    });

    // Add clothing images
    for (const clothing of clothingImagesBase64) {
      contentParts.push({
        inlineData: {
          data: clothing.base64,
          mimeType: "image/png",
        },
      });
    }

    // Generate the visualization
    const result = await model.generateContent(contentParts);
    const response = result.response;
    const candidates = response.candidates;

    if (!candidates || candidates.length === 0) {
      throw new Error("No visualization generated");
    }

    // Look for image data in the response parts
    for (const candidate of candidates) {
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          // @ts-ignore - inlineData with image is returned for image generation
          if (part.inlineData && part.inlineData.data) {
            // @ts-ignore
            const imageBase64 = part.inlineData.data;
            // @ts-ignore
            const imageMimeType = part.inlineData.mimeType || "image/png";

            // Determine file extension
            const ext = imageMimeType.includes("png") ? "png" : "jpeg";

            // Save to local filesystem
            const visualizationUri = `${cacheDirectory}tryon_${Date.now()}.${ext}`;
            await writeAsStringAsync(visualizationUri, imageBase64, {
              encoding: EncodingType.Base64,
            });

            console.log(`[Try-On] Successfully generated visualization: ${visualizationUri}`);
            return visualizationUri;
          }
        }
      }
    }

    throw new Error("No image data in response");
  } catch (error) {
    console.error("[Try-On] Error generating visualization:", error);
    throw error;
  }
};

/**
 * Main function to get or generate a try-on visualization
 * Checks cache first, generates if needed, and saves to cache
 * @param personalModelUrl - URL of the user's personal model image
 * @param clothingItems - Array of wardrobe items to try on
 * @param forceRegenerate - If true, skip cache and generate a new image
 * @returns Visualization URL (either cached or newly generated)
 */
export const getTryOnVisualization = async (
  personalModelUrl: string,
  clothingItems: WardrobeItem[],
  forceRegenerate: boolean = false
): Promise<OutfitVisualization> => {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const itemIds = clothingItems.map(item => item.id);
  const combinationHash = generateCombinationHash(userId, itemIds);

  // Check cache first (unless forcing regeneration)
  if (!forceRegenerate) {
    console.log(`[Try-On] Checking cache for hash: ${combinationHash}`);
    const cached = await getCachedVisualization(combinationHash);
    if (cached) {
      console.log("[Try-On] Cache hit! Returning cached visualization");
      return cached;
    }
  } else {
    console.log("[Try-On] Force regenerate requested, skipping cache");
  }

  console.log("[Try-On] Generating new visualization...");

  // Generate new visualization
  const localUri = await generateTryOnVisualization(personalModelUrl, clothingItems);

  // Upload to Supabase storage with timestamp to avoid cache issues
  const timestampedHash = forceRegenerate ? `${combinationHash}_${Date.now()}` : combinationHash;
  const visualizationUrl = await uploadVisualizationImage(localUri, timestampedHash);

  // Save to cache (update existing or create new)
  const saved = await saveVisualization(combinationHash, itemIds, visualizationUrl);

  console.log("[Try-On] Visualization saved to cache");

  return saved;
};

/**
 * Gemini AI service for analyzing clothing items and generating outfit suggestions
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  readAsStringAsync,
  writeAsStringAsync,
  cacheDirectory,
  EncodingType,
  getInfoAsync,
} from "expo-file-system/legacy";
import {
  WardrobeItemMetadataSchema,
  DetectedClothingItemsSchema,
  OutfitSuggestionSchema,
} from "@/lib/validations";
import type {
  WardrobeItemMetadata,
  DetectedClothingItems,
  OutfitSuggestion,
} from "@/lib/validations";
import type { WardrobeItem, OutfitContext } from "@/types/wardrobe";

// Initialize Gemini client
const getGeminiClient = () => {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "EXPO_PUBLIC_GEMINI_API_KEY is not set in environment variables"
    );
  }
  console.log("Gemini API Key configured:", apiKey.substring(0, 8) + "...");
  return new GoogleGenerativeAI(apiKey);
};

/**
 * Test Gemini API connection without image (for debugging)
 */
export const testGeminiConnection = async (): Promise<boolean> => {
  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel(
      { model: "gemini-2.0-flash" },
      { apiVersion: "v1beta" }
    );

    const result = await model.generateContent("Say hello in one word");
    const text = result.response.text();
    console.log("Gemini test response:", text);
    return true;
  } catch (error) {
    console.error("Gemini connection test failed:", error);
    return false;
  }
};

/**
 * Converts a local image URI to base64 format for Gemini API
 * Handles various URI formats from camera, gallery, and simulator
 */
const imageToBase64 = async (imageUri: string): Promise<string> => {
  try {
    // Normalize the URI - handle different formats
    let normalizedUri = imageUri;

    // Handle file:// prefix variations
    if (
      !normalizedUri.startsWith("file://") &&
      !normalizedUri.startsWith("http")
    ) {
      normalizedUri = normalizedUri;
    }

    // Check if file exists first
    const fileInfo = await getInfoAsync(normalizedUri);

    if (!fileInfo.exists) {
      // Try with file:// prefix
      if (!normalizedUri.startsWith("file://")) {
        normalizedUri = `file://${normalizedUri}`;
        const retryInfo = await getInfoAsync(normalizedUri);
        if (!retryInfo.exists) {
          throw new Error(`Image file not found at: ${imageUri}`);
        }
      } else {
        throw new Error(`Image file not found at: ${imageUri}`);
      }
    }

    const base64 = await readAsStringAsync(normalizedUri, {
      encoding: EncodingType.Base64,
    });

    if (!base64 || base64.length === 0) {
      throw new Error("Image file is empty");
    }

    return base64;
  } catch (error) {
    console.error("Error converting image to base64:", error);
    console.error("Image URI:", imageUri);
    throw new Error(
      `Failed to read image file: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

/**
 * Extracts JSON from Gemini response (handles markdown code blocks, objects, and arrays)
 */
const extractJSONFromResponse = (response: string): string => {
  // Remove markdown code blocks if present
  const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    return jsonMatch[1].trim();
  }

  // Try to find JSON object in response
  const jsonObjectMatch = response.match(/\{[\s\S]*\}/);
  if (jsonObjectMatch) {
    return jsonObjectMatch[0];
  }

  // Try to find JSON array in response
  const jsonArrayMatch = response.match(/\[[\s\S]*\]/);
  if (jsonArrayMatch) {
    return jsonArrayMatch[0];
  }

  return response.trim();
};

/**
 * Analyzes a clothing item image using Gemini AI and returns structured metadata
 * @param imageUri - Local URI of the image file (from camera/gallery)
 * @returns Validated metadata object or null if analysis fails
 */
export const processImageWithGemini = async (
  imageUri: string
): Promise<WardrobeItemMetadata | null> => {
  try {
    const genAI = getGeminiClient();
    // Use gemini-2.0-flash for image analysis (multimodal capable)
    const model = genAI.getGenerativeModel(
      { model: "gemini-2.0-flash" },
      { apiVersion: "v1beta" }
    );

    // Convert image to base64
    const base64Image = await imageToBase64(imageUri);

    // Log image size for debugging
    const imageSizeKB = Math.round(base64Image.length / 1024);
    console.log(`Image size: ${imageSizeKB} KB (base64)`);

    // Warn if image is very large (over 4MB base64 = ~3MB actual)
    if (base64Image.length > 4 * 1024 * 1024) {
      console.warn("Image is very large, may cause network issues");
    }

    // Get file extension to determine MIME type
    const lowerUri = imageUri.toLowerCase();
    let mimeType = "image/jpeg";
    if (lowerUri.endsWith(".png")) {
      mimeType = "image/png";
    } else if (lowerUri.endsWith(".heic") || lowerUri.endsWith(".heif")) {
      mimeType = "image/heic";
    } else if (lowerUri.endsWith(".webp")) {
      mimeType = "image/webp";
    }

    // Create structured prompt for clothing analysis
    const prompt = `Analyze this clothing item image and return a JSON object with the following structure:
{
  "category": "Main category (Top, Bottom, Shoes, Accessories, Outerwear)",
  "subcategory": "Specific type (e.g., T-Shirt, Jeans, Sneakers, Watch, Jacket)",
  "color": "Primary color name (e.g., Blue, Black, White, Red)",
  "material": "Material/fabric type (e.g., Cotton, Denim, Leather, Polyester)",
  "attributes": ["casual", "formal", "summer", "winter", "vintage", "sporty", etc.]
}

Important:
- Return ONLY valid JSON, no markdown formatting, no explanations
- Category must be one of: Top, Bottom, Shoes, Accessories, Outerwear
- Subcategory should be specific (e.g., "T-Shirt" not just "Shirt")
- Color should be a simple color name
- Attributes should be an array of descriptive tags (at least 2-3 tags)
- Be accurate and descriptive`;

    // Generate content with image
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType,
        },
      },
    ]);

    const response = result.response;
    const text = response.text();

    // Extract JSON from response
    const jsonString = extractJSONFromResponse(text);

    // Parse JSON
    let parsedData: unknown;
    try {
      parsedData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Failed to parse JSON from Gemini response:", parseError);
      console.error("Response text:", text);
      return null;
    }

    // Validate with Zod schema
    const validationResult = WardrobeItemMetadataSchema.safeParse(parsedData);

    if (!validationResult.success) {
      console.error("Validation failed:", validationResult.error);
      console.error("Parsed data:", parsedData);
      return null;
    }

    return validationResult.data;
  } catch (error) {
    console.error("Error processing image with Gemini:", error);

    // Handle specific error types and rethrow with user-friendly message
    if (error instanceof Error) {
      if (error.message.includes("API_KEY")) {
        console.error("Invalid or missing Gemini API key");
        throw new Error("API configuration error. Please check your API key.");
      } else if (
        error.message.includes("429") ||
        error.message.includes("quota") ||
        error.message.includes("QUOTA")
      ) {
        console.error("Gemini API quota exceeded");
        throw new Error(
          "AI service is busy. Please wait a moment and try again."
        );
      } else if (
        error.message.includes("network") ||
        error.message.includes("Network request failed")
      ) {
        console.error("Network error connecting to Gemini API");
        throw new Error(
          "Network error. Please check your connection and try again."
        );
      }
    }

    return null;
  }
};

/**
 * Detects ALL clothing items in an image and returns metadata for each
 * Used for multi-item detection when user uploads a full outfit photo
 * @param imageUri - Local URI of the image file (from camera/gallery)
 * @returns Array of detected items with metadata, or null if detection fails
 */
export const detectAllClothingItems = async (
  imageUri: string
): Promise<WardrobeItemMetadata[] | null> => {
  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel(
      { model: "gemini-2.0-flash" },
      { apiVersion: "v1beta" }
    );

    // Convert image to base64
    const base64Image = await imageToBase64(imageUri);

    // Log image size for debugging
    const imageSizeKB = Math.round(base64Image.length / 1024);
    console.log(
      `[Multi-Item Detection] Image size: ${imageSizeKB} KB (base64)`
    );

    // Get file extension to determine MIME type
    const lowerUri = imageUri.toLowerCase();
    let mimeType = "image/jpeg";
    if (lowerUri.endsWith(".png")) {
      mimeType = "image/png";
    } else if (lowerUri.endsWith(".heic") || lowerUri.endsWith(".heif")) {
      mimeType = "image/heic";
    } else if (lowerUri.endsWith(".webp")) {
      mimeType = "image/webp";
    }

    // Prompt for detecting ALL clothing items in the image with detailed attributes
    const prompt = `Analyze this image and identify ALL visible clothing items worn by the person or displayed.

Return a JSON object with an "items" array containing each detected clothing item with DETAILED attributes:
{
  "items": [
    {
      "category": "Top/Bottom/Shoes/Accessories/Outerwear",
      "subcategory": "Specific type (Polo Shirt, Jeans, Sneakers, Watch, Bomber Jacket, etc.)",
      "color": "Primary color name",
      "material": "Material/fabric type (cotton, denim, leather, polyester, etc.)",
      "attributes": ["casual", "formal", "summer", "winter", "vintage", "sporty", etc.],
      "gender": "male/female/unisex",
      "sleeveLength": "short/long/sleeveless/3-4/cap (for tops/outerwear only)",
      "fit": "slim/regular/relaxed/oversized/cropped",
      "neckline": "crew/v-neck/polo/mock/turtleneck/scoop/henley/collar (for tops only)",
      "pattern": "solid/striped/plaid/printed/graphic/checkered",
      "length": "cropped/regular/long/mini/midi/maxi/ankle (for bottoms/dresses)"
    }
  ]
}

CRITICAL RULES:
- Return ONLY valid JSON, no markdown, no explanations
- Detect EVERY distinct clothing item visible (e.g., jacket AND shirt AND pants = 3 items)
- Category must be one of: Top, Bottom, Shoes, Accessories, Outerwear
- Do NOT include the same item twice
- Each item must have ALL fields including the detailed attributes
- Be VERY SPECIFIC with details - this data is used to generate accurate product images

DETAILED ATTRIBUTE GUIDELINES:
- sleeveLength: REQUIRED for tops/outerwear. "short" for t-shirts/polos, "long" for dress shirts/sweaters, "sleeveless" for tanks, "3-4" for 3/4 sleeves
- fit: How the garment fits the body. "slim" for fitted, "regular" for standard, "oversized" for loose
- neckline: REQUIRED for tops. "polo" for collared polo shirts, "crew" for round neck, "v-neck" for V-shaped
- pattern: "solid" for single color, "striped" for stripes, "graphic" for prints/logos
- length: For bottoms - "regular" for standard, "cropped" for above ankle, "ankle" for ankle length

Gender: "male" for traditionally masculine, "female" for feminine, "unisex" for neutral items`;

    // Generate content with image
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType,
        },
      },
    ]);

    const response = result.response;
    const text = response.text();
    console.log("[Multi-Item Detection] Raw response:", text);

    // Extract JSON from response
    const jsonString = extractJSONFromResponse(text);

    // Parse JSON
    let parsedData: unknown;
    try {
      parsedData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("[Multi-Item Detection] Failed to parse JSON:", parseError);
      console.error("Response text:", text);
      return null;
    }

    // Validate with Zod schema
    const validationResult = DetectedClothingItemsSchema.safeParse(parsedData);

    if (!validationResult.success) {
      console.error(
        "[Multi-Item Detection] Validation failed:",
        validationResult.error
      );
      console.error("Parsed data:", parsedData);
      return null;
    }

    console.log(
      `[Multi-Item Detection] Found ${validationResult.data.items.length} items`
    );
    return validationResult.data.items;
  } catch (error) {
    console.error("[Multi-Item Detection] Error:", error);

    if (error instanceof Error) {
      if (error.message.includes("API_KEY")) {
        throw new Error("API configuration error. Please check your API key.");
      } else if (
        error.message.includes("429") ||
        error.message.includes("quota") ||
        error.message.includes("QUOTA")
      ) {
        throw new Error(
          "AI service is busy. Please wait a moment and try again."
        );
      } else if (
        error.message.includes("network") ||
        error.message.includes("Network request failed")
      ) {
        throw new Error(
          "Network error. Please check your connection and try again."
        );
      }
    }

    return null;
  }
};

/**
 * Generates a clean, studio-quality product image for a clothing item using Gemini
 * Uses the original photo as visual context to create a professional e-commerce style shot
 * @param originalImageUri - Local URI of the original image
 * @param itemMetadata - Metadata about the specific clothing item to generate
 * @returns Local URI of the generated image, or the original URI if generation fails
 */
export const generateCleanProductImage = async (
  originalImageUri: string,
  itemMetadata: WardrobeItemMetadata
): Promise<string> => {
  try {
    const genAI = getGeminiClient();

    // Use gemini-3-pro-image-preview for better quality image generation
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

    // Convert original image to base64 for visual context
    const base64Image = await imageToBase64(originalImageUri);

    // Get MIME type
    const lowerUri = originalImageUri.toLowerCase();
    let mimeType = "image/jpeg";
    if (lowerUri.endsWith(".png")) {
      mimeType = "image/png";
    } else if (lowerUri.endsWith(".heic") || lowerUri.endsWith(".heif")) {
      mimeType = "image/heic";
    } else if (lowerUri.endsWith(".webp")) {
      mimeType = "image/webp";
    }

    // Build detailed specifications from metadata
    const specs = [];
    if (itemMetadata.sleeveLength)
      specs.push(`Sleeve length: ${itemMetadata.sleeveLength}`);
    if (itemMetadata.fit) specs.push(`Fit: ${itemMetadata.fit}`);
    if (itemMetadata.neckline) specs.push(`Neckline: ${itemMetadata.neckline}`);
    if (itemMetadata.pattern) specs.push(`Pattern: ${itemMetadata.pattern}`);
    if (itemMetadata.length) specs.push(`Length: ${itemMetadata.length}`);
    const specificationsText =
      specs.length > 0 ? specs.join("\n- ") : "as shown in reference";

    // Build a detailed prompt for studio-quality product shot with exact specifications
    const prompt = `Generate a professional studio product photograph of ONLY this specific clothing item: ${
      itemMetadata.color
    } ${itemMetadata.subcategory}.

EXACT GARMENT SPECIFICATIONS (MUST MATCH PRECISELY):
- Color: ${itemMetadata.color}
- Type: ${itemMetadata.subcategory} (${itemMetadata.category})
- Material: ${itemMetadata.material}
- ${specificationsText}

CRITICAL ACCURACY REQUIREMENTS:
${
  itemMetadata.sleeveLength
    ? `- SLEEVE LENGTH MUST BE ${itemMetadata.sleeveLength.toUpperCase()} - Do NOT change this`
    : ""
}
${
  itemMetadata.neckline
    ? `- NECKLINE MUST BE ${itemMetadata.neckline.toUpperCase()} style - Do NOT change this`
    : ""
}
${
  itemMetadata.fit
    ? `- FIT MUST BE ${itemMetadata.fit.toUpperCase()} - Do NOT change this`
    : ""
}
${
  itemMetadata.pattern
    ? `- PATTERN MUST BE ${itemMetadata.pattern.toUpperCase()} - Do NOT change this`
    : ""
}

PHOTOGRAPHY REQUIREMENTS:
- Pure white background (#FFFFFF)
- Professional e-commerce lighting (soft, even, no harsh shadows)
- Item centered in frame, laid flat or naturally positioned
- No model, mannequin, or person - just the isolated garment
- High detail showing the ${itemMetadata.material} texture and construction
- Clean, crisp product photography style like Zara or H&M catalog

Reference the attached image for the EXACT style, details, and construction of this ${
      itemMetadata.subcategory
    }.
Generate ONLY the clothing item matching ALL specifications above.`;

    console.log(
      `[Image Gen] Generating clean image for: ${itemMetadata.color} ${itemMetadata.subcategory}`
    );

    // Generate with image context
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType,
        },
      },
    ]);

    const response = result.response;
    const candidates = response.candidates;

    if (!candidates || candidates.length === 0) {
      console.warn("[Image Gen] No candidates in response, returning original");
      return originalImageUri;
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
            const generatedImageUri = `${cacheDirectory}generated_${Date.now()}.${ext}`;
            await writeAsStringAsync(generatedImageUri, imageBase64, {
              encoding: EncodingType.Base64,
            });

            console.log(
              `[Image Gen] Successfully generated: ${generatedImageUri}`
            );
            return generatedImageUri;
          }
        }
      }
    }

    // If no image was generated, fall back to original
    console.warn("[Image Gen] No image data in response, returning original");
    return originalImageUri;
  } catch (error) {
    console.error("[Image Gen] Error generating product image:", error);

    // Return original image as fallback - don't block the upload flow
    console.warn("[Image Gen] Falling back to original image");
    return originalImageUri;
  }
};

/**
 * Generates a professional "personal model" reference image from a user's photo
 * Transforms the user into a fashion model in a neutral studio setting while preserving identity
 * @param userPhotoUri - Local URI of the user's photo
 * @returns Local URI of the generated personal model image, or the original if generation fails
 */
export const generatePersonalModel = async (
  userPhotoUri: string
): Promise<string> => {
  try {
    const genAI = getGeminiClient();

    // Use gemini-3-pro-image-preview for better quality image generation
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

    // Convert user photo to base64
    const base64Image = await imageToBase64(userPhotoUri);

    // Get MIME type
    const lowerUri = userPhotoUri.toLowerCase();
    let mimeType = "image/jpeg";
    if (lowerUri.endsWith(".png")) {
      mimeType = "image/png";
    } else if (lowerUri.endsWith(".heic") || lowerUri.endsWith(".heif")) {
      mimeType = "image/heic";
    } else if (lowerUri.endsWith(".webp")) {
      mimeType = "image/webp";
    }

    // Prompt to transform user into fashion model reference
    const prompt = `Transform this person into a professional fashion model reference image.

Requirements:
- PRESERVE their exact facial features, hair color, hairstyle, and body shape
- Place them in a neutral studio setting with soft, even lighting
- Use a clean, minimalist light gray or white background
- Dress them in simple, tight-fitting white base-layer clothing (white t-shirt and light pants)
- Professional fashion photography pose - standing straight, relaxed, facing camera
- Full body shot from head to feet
- High quality, studio lighting with no harsh shadows
- The person should look like they're ready for a virtual try-on session

This is a fashion model reference photo for virtual clothing try-on. Maintain the person's identity exactly.`;

    console.log("[Personal Model] Generating model reference image...");

    // Generate with image context
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType,
        },
      },
    ]);

    const response = result.response;
    const candidates = response.candidates;

    if (!candidates || candidates.length === 0) {
      console.warn(
        "[Personal Model] No candidates in response, returning original"
      );
      return userPhotoUri;
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
            const personalModelUri = `${cacheDirectory}personal_model_${Date.now()}.${ext}`;
            await writeAsStringAsync(personalModelUri, imageBase64, {
              encoding: EncodingType.Base64,
            });

            console.log(
              `[Personal Model] Successfully generated: ${personalModelUri}`
            );
            return personalModelUri;
          }
        }
      }
    }

    // If no image was generated, fall back to original
    console.warn(
      "[Personal Model] No image data in response, returning original"
    );
    return userPhotoUri;
  } catch (error) {
    console.error("[Personal Model] Error generating personal model:", error);

    // Return original image as fallback
    console.warn("[Personal Model] Falling back to original image");
    return userPhotoUri;
  }
};

/**
 * Generates an outfit suggestion using Gemini AI based on wardrobe items and context
 * @param wardrobeItems - Array of wardrobe items with metadata
 * @param context - Occasion and weather context for outfit selection
 * @returns Outfit suggestion with 3 item IDs and explanation, or null if generation fails
 */
export const generateOutfit = async (
  wardrobeItems: WardrobeItem[],
  context: OutfitContext
): Promise<OutfitSuggestion | null> => {
  try {
    const genAI = getGeminiClient();
    // Use gemini-2.0-flash for outfit generation
    const model = genAI.getGenerativeModel(
      { model: "gemini-2.0-flash" },
      { apiVersion: "v1beta" }
    );

    // Format wardrobe items for prompt with all details
    const itemsJSON = JSON.stringify(
      wardrobeItems.map((item) => ({
        id: item.id,
        category: item.category,
        subcategory: item.subcategory,
        color: item.color,
        material: item.material,
        attributes: item.attributes,
      })),
      null,
      2
    );

    const occasion = context.occasion || "casual";
    const weather = context.weather || "moderate";

    // Group items by category for context
    const categories = [...new Set(wardrobeItems.map((i) => i.category))];
    const categoryInfo = categories
      .map((cat) => {
        const count = wardrobeItems.filter((i) => i.category === cat).length;
        return `${cat}: ${count} items`;
      })
      .join(", ");

    const prompt = `You are a SEASONED FASHION STYLIST with 20+ years of experience styling celebrities, editorial shoots, and everyday clients. You have an exceptional eye for color coordination, proportions, and creating cohesive looks.

CLIENT'S WARDROBE:
${itemsJSON}

Available pieces: ${categoryInfo}

STYLING BRIEF:
- Occasion: ${occasion}
- Weather: ${weather}

YOUR TASK:
Create a KILLER outfit that would make this client look their absolute best. Use your expert judgment on how many pieces to include - sometimes less is more, sometimes layering is everything.

Return ONLY valid JSON:
{
  "itemIds": ["uuid1", "uuid2", ...],
  "suggestion": "Your professional styling rationale - explain the look, color story, and why it works (2-3 sentences)",
  "stylistNote": "One insider styling tip for how to wear this look (optional but appreciated)"
}

STYLING PRINCIPLES (use your judgment):
- A polished look can be 2-7 pieces depending on the vibe
- Color harmony matters: complementary colors, monochromatic schemes, or intentional contrast
- Occasion-appropriate: formal needs more structure, casual can be relaxed
- Weather-smart: layer for cold, breathe for hot, prepare for rain
- Balance proportions: oversized top with slim bottom, or vice versa
- Accessories can make or break a look - use them wisely
- Shoes complete the outfit - barefoot is not a look (unless it's the beach)

CONSTRAINTS:
- Only use item IDs from the wardrobe above
- Return valid JSON only, no markdown
- Be creative but realistic - this should be wearable

Now style this client like you're prepping them for their best day yet.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Extract JSON from response
    const jsonString = extractJSONFromResponse(text);

    // Parse JSON
    let parsedData: unknown;
    try {
      parsedData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Failed to parse JSON from Gemini response:", parseError);
      console.error("Response text:", text);
      return null;
    }

    // Validate with Zod schema
    const validationResult = OutfitSuggestionSchema.safeParse(parsedData);

    if (!validationResult.success) {
      console.error("Validation failed:", validationResult.error);
      console.error("Parsed data:", parsedData);
      return null;
    }

    return validationResult.data;
  } catch (error) {
    console.error("Error generating outfit with Gemini:", error);

    if (error instanceof Error) {
      if (error.message.includes("API_KEY")) {
        console.error("Invalid or missing Gemini API key");
      } else if (error.message.includes("QUOTA")) {
        console.error("Gemini API quota exceeded");
      }
    }

    return null;
  }
};

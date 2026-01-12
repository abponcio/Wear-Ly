/**
 * Gemini AI service for analyzing clothing items and generating outfit suggestions
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  readAsStringAsync,
  EncodingType,
  getInfoAsync,
} from "expo-file-system/legacy";
import {
  WardrobeItemMetadataSchema,
  OutfitSuggestionSchema,
} from "@/lib/validations";
import type { WardrobeItemMetadata, OutfitSuggestion } from "@/lib/validations";
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
 * Extracts JSON from Gemini response (handles markdown code blocks)
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

    // Format wardrobe items for prompt
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

    const prompt = `Given this wardrobe:
${itemsJSON}

Context:
- Occasion: ${occasion}
- Weather: ${weather}

Suggest 3 items that create a stylish, cohesive outfit. Return ONLY valid JSON in this format:
{
  "itemIds": ["uuid1", "uuid2", "uuid3"],
  "suggestion": "Brief explanation of why these items work together (2-3 sentences)"
}

Important:
- Return ONLY valid JSON, no markdown formatting
- Must suggest exactly 3 items
- Item IDs must match IDs from the wardrobe array
- Choose items that complement each other in color, style, and occasion
- Consider the weather context for appropriate clothing`;

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

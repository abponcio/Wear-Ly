/**
 * Gemini AI service for analyzing clothing items and generating outfit suggestions
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import * as FileSystem from 'expo-file-system';
import { WardrobeItemMetadataSchema, OutfitSuggestionSchema } from '@/lib/validations';
import type { WardrobeItemMetadata, OutfitSuggestion } from '@/lib/validations';
import type { WardrobeItem, OutfitContext } from '@/types/wardrobe';

// Initialize Gemini client
const getGeminiClient = () => {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('EXPO_PUBLIC_GEMINI_API_KEY is not set in environment variables');
  }
  return new GoogleGenerativeAI(apiKey);
};

/**
 * Converts a local image URI to base64 format for Gemini API
 */
const imageToBase64 = async (imageUri: string): Promise<string> => {
  try {
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw new Error('Failed to read image file');
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
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Convert image to base64
    const base64Image = await imageToBase64(imageUri);
    
    // Get file extension to determine MIME type
    const mimeType = imageUri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

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
      console.error('Failed to parse JSON from Gemini response:', parseError);
      console.error('Response text:', text);
      return null;
    }

    // Validate with Zod schema
    const validationResult = WardrobeItemMetadataSchema.safeParse(parsedData);
    
    if (!validationResult.success) {
      console.error('Validation failed:', validationResult.error);
      console.error('Parsed data:', parsedData);
      return null;
    }

    return validationResult.data;
  } catch (error) {
    console.error('Error processing image with Gemini:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('API_KEY')) {
        console.error('Invalid or missing Gemini API key');
      } else if (error.message.includes('QUOTA')) {
        console.error('Gemini API quota exceeded');
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        console.error('Network error connecting to Gemini API');
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
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

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

    const occasion = context.occasion || 'casual';
    const weather = context.weather || 'moderate';

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
      console.error('Failed to parse JSON from Gemini response:', parseError);
      console.error('Response text:', text);
      return null;
    }

    // Validate with Zod schema
    const validationResult = OutfitSuggestionSchema.safeParse(parsedData);
    
    if (!validationResult.success) {
      console.error('Validation failed:', validationResult.error);
      console.error('Parsed data:', parsedData);
      return null;
    }

    return validationResult.data;
  } catch (error) {
    console.error('Error generating outfit with Gemini:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('API_KEY')) {
        console.error('Invalid or missing Gemini API key');
      } else if (error.message.includes('QUOTA')) {
        console.error('Gemini API quota exceeded');
      }
    }
    
    return null;
  }
};

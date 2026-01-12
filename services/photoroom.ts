/**
 * Photoroom API service for background removal
 */

import {
  readAsStringAsync,
  writeAsStringAsync,
  cacheDirectory,
  EncodingType,
} from "expo-file-system/legacy";

const PHOTOROOM_API_URL = "https://sdk.photoroom.com/v1/segment";
const PHOTOROOM_API_KEY = process.env.EXPO_PUBLIC_PHOTOROOM_API_KEY;

/**
 * Removes the background from an image using Photoroom API
 * @param imageUri - Local URI of the image file
 * @returns Local URI of the transparent PNG image, or original URI if removal fails
 */
export const removeBackground = async (imageUri: string): Promise<string> => {
  if (!PHOTOROOM_API_KEY) {
    console.warn("Photoroom API key not set, returning original image");
    return imageUri;
  }

  try {
    // Determine MIME type from file extension
    const mimeType = imageUri.toLowerCase().endsWith(".png")
      ? "image/png"
      : "image/jpeg";

    // Create FormData for React Native
    // React Native FormData accepts file-like objects with uri, type, and name
    const formData = new FormData();
    formData.append("image_file", {
      uri: imageUri,
      type: mimeType,
      name: imageUri.split("/").pop() || "image.jpg",
    } as any);

    // Make API request
    const response = await fetch(PHOTOROOM_API_URL, {
      method: "POST",
      headers: {
        "x-api-key": PHOTOROOM_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Photoroom API error:", response.status, errorText);
      throw new Error(`Photoroom API failed: ${response.status}`);
    }

    // Get the PNG binary data
    const blobData = await response.blob();

    // Convert blob to base64
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove data URL prefix if present
        const base64 = base64String.includes(",")
          ? base64String.split(",")[1]
          : base64String;
        resolve(base64);
      };
      reader.onerror = reject;
    });

    reader.readAsDataURL(blobData);
    const base64Png = await base64Promise;

    // Save PNG to local filesystem
    const isolatedImageUri = `${cacheDirectory}isolated_${Date.now()}.png`;
    await writeAsStringAsync(isolatedImageUri, base64Png, {
      encoding: EncodingType.Base64,
    });

    return isolatedImageUri;
  } catch (error) {
    console.error("Error removing background with Photoroom:", error);

    // Return original image URI as fallback
    console.warn("Returning original image as fallback");
    return imageUri;
  }
};

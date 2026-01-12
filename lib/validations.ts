/**
 * Zod validation schemas for API responses and data validation
 */

import { z } from 'zod';

/**
 * Gender enum for clothing items
 */
export const GenderSchema = z.enum(['male', 'female', 'unisex']);

/**
 * Schema for validating a single clothing item metadata
 * Includes detailed garment attributes for accurate image generation
 */
export const WardrobeItemMetadataSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().min(1, 'Subcategory is required'),
  color: z.string().min(1, 'Color is required'),
  material: z.string().min(1, 'Material is required'),
  attributes: z.array(z.string()).default([]),
  gender: GenderSchema.nullable().optional().default('unisex'),
  // Detailed garment attributes for accurate image generation
  // Using .nullable() because Gemini returns null for non-applicable attributes (e.g., sleeveLength for pants)
  sleeveLength: z.string().nullable().optional(), // "short", "long", "sleeveless", "3/4", "cap"
  fit: z.string().nullable().optional(), // "slim", "regular", "relaxed", "oversized", "cropped"
  neckline: z.string().nullable().optional(), // "crew", "v-neck", "polo", "mock", "turtleneck", "scoop", "henley"
  pattern: z.string().nullable().optional(), // "solid", "striped", "plaid", "printed", "graphic", "checkered"
  length: z.string().nullable().optional(), // "cropped", "regular", "long", "mini", "midi", "maxi", "ankle"
});

/**
 * Schema for multi-item detection response from Gemini
 */
export const DetectedClothingItemsSchema = z.object({
  items: z.array(WardrobeItemMetadataSchema).min(1, 'At least one item must be detected'),
});

/**
 * Schema for validating Gemini AI outfit suggestion response
 * Flexible: allows 2-7 items for complete outfit looks
 */
export const OutfitSuggestionSchema = z.object({
  itemIds: z.array(z.string().uuid('Invalid UUID format')).min(2, 'At least 2 items required').max(7, 'Maximum 7 items'),
  suggestion: z.string().min(1, 'Suggestion text is required'),
  stylistNote: z.string().optional(), // Optional styling tip from the AI stylist
});

/**
 * Type inference from schemas
 */
export type WardrobeItemMetadata = z.infer<typeof WardrobeItemMetadataSchema>;
export type DetectedClothingItems = z.infer<typeof DetectedClothingItemsSchema>;
export type OutfitSuggestion = z.infer<typeof OutfitSuggestionSchema>;

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
 */
export const WardrobeItemMetadataSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().min(1, 'Subcategory is required'),
  color: z.string().min(1, 'Color is required'),
  material: z.string().min(1, 'Material is required'),
  attributes: z.array(z.string()).default([]),
  gender: GenderSchema.optional().default('unisex'),
});

/**
 * Schema for multi-item detection response from Gemini
 */
export const DetectedClothingItemsSchema = z.object({
  items: z.array(WardrobeItemMetadataSchema).min(1, 'At least one item must be detected'),
});

/**
 * Schema for validating Gemini AI outfit suggestion response
 */
export const OutfitSuggestionSchema = z.object({
  itemIds: z.array(z.string().uuid('Invalid UUID format')).length(3, 'Must suggest exactly 3 items'),
  suggestion: z.string().min(1, 'Suggestion text is required'),
});

/**
 * Type inference from schemas
 */
export type WardrobeItemMetadata = z.infer<typeof WardrobeItemMetadataSchema>;
export type DetectedClothingItems = z.infer<typeof DetectedClothingItemsSchema>;
export type OutfitSuggestion = z.infer<typeof OutfitSuggestionSchema>;

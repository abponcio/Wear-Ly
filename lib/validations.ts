/**
 * Zod validation schemas for API responses and data validation
 */

import { z } from 'zod';

/**
 * Schema for validating Gemini AI response when analyzing clothing items
 */
export const WardrobeItemMetadataSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().min(1, 'Subcategory is required'),
  color: z.string().min(1, 'Color is required'),
  material: z.string().min(1, 'Material is required'),
  attributes: z.array(z.string()).default([]),
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
export type OutfitSuggestion = z.infer<typeof OutfitSuggestionSchema>;

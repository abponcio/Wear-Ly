/**
 * Type definitions for wardrobe items and related data structures
 */

export interface WardrobeItemMetadata {
  category: string;
  subcategory: string;
  color: string;
  material: string;
  attributes: string[];
}

export interface WardrobeItem {
  id: string;
  userId: string;
  imageUrl: string;
  isolatedImageUrl: string;
  category: string;
  subcategory: string;
  color: string;
  material: string;
  attributes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface OutfitContext {
  occasion?: string;
  weather?: string;
}

export interface OutfitSuggestion {
  itemIds: string[];
  suggestion: string;
}

export interface Outfit {
  id: string;
  userId: string;
  itemIds: string[];
  occasion?: string;
  weather?: string;
  geminiSuggestion?: string;
  createdAt: string;
  items?: WardrobeItem[]; // Populated when fetching with joins
}

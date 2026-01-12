/**
 * Type definitions for wardrobe items and related data structures
 */

export type Gender = 'male' | 'female' | 'unisex';
export type ProfileGender = 'male' | 'female' | 'non-binary';

export interface WardrobeItemMetadata {
  category: string;
  subcategory: string;
  color: string;
  material: string;
  attributes: string[];
  gender?: Gender;
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
  gender?: Gender | null;
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
  stylistNote?: string; // Optional insider styling tip from the AI stylist
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

export interface UserProfile {
  id: string;
  personalModelUrl?: string | null;
  gender?: ProfileGender | null;
  createdAt: string;
  updatedAt: string;
}

export interface OutfitVisualization {
  id: string;
  userId: string;
  combinationHash: string;
  itemIds: string[];
  visualizationUrl: string;
  createdAt: string;
}

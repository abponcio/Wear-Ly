/**
 * TypeScript types for Supabase database schema
 * Generated types matching the database structure
 */

export interface Database {
  public: {
    Tables: {
      items: {
        Row: {
          id: string;
          user_id: string;
          image_url: string;
          isolated_image_url: string;
          category: string;
          subcategory: string;
          color: string;
          material: string;
          attributes: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          image_url: string;
          isolated_image_url: string;
          category: string;
          subcategory: string;
          color: string;
          material: string;
          attributes?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          image_url?: string;
          isolated_image_url?: string;
          category?: string;
          subcategory?: string;
          color?: string;
          material?: string;
          attributes?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      outfits: {
        Row: {
          id: string;
          user_id: string;
          item_ids: string[];
          occasion: string | null;
          weather: string | null;
          gemini_suggestion: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          item_ids: string[];
          occasion?: string | null;
          weather?: string | null;
          gemini_suggestion?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          item_ids?: string[];
          occasion?: string | null;
          weather?: string | null;
          gemini_suggestion?: string | null;
          created_at?: string;
        };
      };
    };
  };
}

// Helper types for easier usage
export type ItemRow = Database['public']['Tables']['items']['Row'];
export type ItemInsert = Database['public']['Tables']['items']['Insert'];
export type ItemUpdate = Database['public']['Tables']['items']['Update'];

export type OutfitRow = Database['public']['Tables']['outfits']['Row'];
export type OutfitInsert = Database['public']['Tables']['outfits']['Insert'];
export type OutfitUpdate = Database['public']['Tables']['outfits']['Update'];

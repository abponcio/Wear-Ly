/**
 * Custom storage adapter for Supabase Auth using expo-secure-store
 * Supabase expects localStorage-like interface, but SecureStore has different API
 */

import * as SecureStore from "expo-secure-store";

const PREFIX = "supabase.auth.token";

export const supabaseStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(`${PREFIX}.${key}`);
    } catch (error) {
      console.error("Error getting item from SecureStore:", error);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(`${PREFIX}.${key}`, value);
    } catch (error) {
      console.error("Error setting item in SecureStore:", error);
      throw error;
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(`${PREFIX}.${key}`);
    } catch (error) {
      console.error("Error removing item from SecureStore:", error);
      // Don't throw - removal failures shouldn't break auth flow
    }
  },
};

import React from "react";
import { View, Text, SafeAreaView, RefreshControl, ScrollView } from "react-native";
import WardrobeGrid from "@/components/WardrobeGrid";
import { useWardrobe } from "@/hooks/useWardrobe";
import type { WardrobeItem } from "@/types/wardrobe";

export default function WardrobeScreen() {
  const { items, isLoading, error, refreshItems } = useWardrobe();

  const handleItemPress = (item: WardrobeItem) => {
    // TODO: Navigate to item detail screen
    console.log("Item pressed:", item.id);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1">
        {/* Header */}
        <View className="bg-white px-4 py-4 border-b border-gray-200">
          <Text className="text-2xl font-bold text-gray-900">My Wardrobe</Text>
          <Text className="text-sm text-gray-500 mt-1">
            {items.length} {items.length === 1 ? "item" : "items"}
          </Text>
        </View>

        {/* Error Message */}
        {error && (
          <View className="bg-red-50 border border-red-200 mx-4 mt-4 p-3 rounded-lg">
            <Text className="text-red-700 text-sm">{error}</Text>
          </View>
        )}

        {/* Wardrobe Grid */}
        <WardrobeGrid
          items={items}
          onItemPress={handleItemPress}
          loading={isLoading}
        />
      </View>
    </SafeAreaView>
  );
}

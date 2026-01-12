import React, { useCallback } from "react";
import { View, Text, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import WardrobeGrid from "@/components/WardrobeGrid";
import { useWardrobe } from "@/hooks/useWardrobe";
import type { WardrobeItem } from "@/types/wardrobe";

export default function WardrobeScreen() {
  const router = useRouter();
  const { items, isLoading, error, refreshItems } = useWardrobe();

  // Refresh items when screen comes into focus (sync with other screens)
  useFocusEffect(
    useCallback(() => {
      refreshItems();
    }, [refreshItems])
  );

  const handleItemPress = (item: WardrobeItem) => {
    router.push(`/item/${item.id}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-cream-100" edges={["bottom"]}>
      <View className="flex-1">
        {/* Minimal Header */}
        <View className="px-5 pt-2 pb-4">
          <Text className="text-xs tracking-widest text-charcoal-muted uppercase">
            {items.length} {items.length === 1 ? "piece" : "pieces"}
          </Text>
        </View>

        {/* Error Message */}
        {error && (
          <View className="mx-5 mb-4 p-4 border border-charcoal/10">
            <Text className="text-charcoal text-sm">{error}</Text>
          </View>
        )}

        {/* Wardrobe Grid */}
        <WardrobeGrid
          items={items}
          onItemPress={handleItemPress}
          loading={isLoading}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refreshItems}
              tintColor="#1A1A1A"
            />
          }
        />
      </View>
    </SafeAreaView>
  );
}

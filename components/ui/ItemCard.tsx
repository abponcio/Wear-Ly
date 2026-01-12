import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { WardrobeItem } from "@/types/wardrobe";

interface ItemCardProps {
  item: WardrobeItem;
  onPress?: () => void;
}

// Category colors for fallback display
const CATEGORY_COLORS: Record<string, string> = {
  Top: "#E8E0F0",      // Light purple
  Bottom: "#E0E8F0",   // Light blue
  Shoes: "#E0F0E8",    // Light green
  Outerwear: "#F0E8E0", // Light orange
  Accessories: "#F0E0E8", // Light pink
};

export default function ItemCard({ item, onPress }: ItemCardProps) {
  const [imageError, setImageError] = useState(false);
  const fallbackColor = CATEGORY_COLORS[item.category] || "#F5F3F0";

  return (
    <Pressable
      onPress={onPress}
      className="bg-white border border-cream-200 overflow-hidden active:opacity-70"
    >
      {/* Image Container */}
      <View
        className="w-full aspect-[3/4]"
        style={{ backgroundColor: fallbackColor }}
      >
        {!imageError ? (
          <Image
            source={{ uri: item.isolatedImageUrl || item.imageUrl }}
            contentFit="cover"
            transition={200}
            style={{ width: '100%', height: '100%' }}
            onError={() => setImageError(true)}
          />
        ) : (
          // Fallback: Solid color with item info
          <View className="flex-1 items-center justify-center p-4">
            <Text className="text-charcoal/40 text-xs tracking-widest uppercase text-center">
              {item.category}
            </Text>
            <Text className="text-charcoal/60 text-sm text-center mt-1" numberOfLines={2}>
              {item.color} {item.subcategory}
            </Text>
          </View>
        )}
      </View>

      {/* Content Container - Minimal */}
      <View className="p-3">
        {/* Category */}
        <Text className="text-[10px] tracking-widest text-charcoal-muted uppercase mb-1">
          {item.category}
        </Text>

        {/* Subcategory */}
        <Text
          className="text-sm text-charcoal font-normal mb-1"
          numberOfLines={1}
        >
          {item.subcategory}
        </Text>

        {/* Color */}
        <Text className="text-xs text-charcoal-muted">{item.color}</Text>
      </View>
    </Pressable>
  );
}

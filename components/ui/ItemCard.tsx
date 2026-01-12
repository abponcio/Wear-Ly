import React from "react";
import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { WardrobeItem } from "@/types/wardrobe";

interface ItemCardProps {
  item: WardrobeItem;
  onPress?: () => void;
}

export default function ItemCard({ item, onPress }: ItemCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-white border border-cream-200 overflow-hidden active:opacity-70"
    >
      {/* Image Container */}
      <View className="w-full aspect-[3/4] bg-cream-100">
        <Image
          source={{ uri: item.isolatedImageUrl || item.imageUrl }}
          contentFit="cover"
          transition={200}
          style={{ width: '100%', height: '100%' }}
          placeholder={require('@/assets/icon.png')}
          onError={(e) => console.log('Image load error:', e, item.isolatedImageUrl)}
        />
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

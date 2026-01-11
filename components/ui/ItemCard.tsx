import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Tag, Palette, Shirt } from 'lucide-react-native';
import { WardrobeItem } from '@/types/wardrobe';

interface ItemCardProps {
  item: WardrobeItem;
  onPress?: () => void;
}

export default function ItemCard({ item, onPress }: ItemCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-lg shadow-md overflow-hidden active:opacity-80"
    >
      {/* Image Container */}
      <View className="w-full aspect-square bg-gray-100">
        <Image
          source={{ uri: item.isolatedImageUrl || item.imageUrl }}
          contentFit="cover"
          transition={200}
          className="w-full h-full"
        />
      </View>

      {/* Content Container */}
      <View className="p-3">
        {/* Category Badge */}
        <View className="flex-row items-center mb-2">
          <Shirt size={12} color="#6B7280" />
          <Text className="text-xs font-semibold text-gray-600 uppercase tracking-wide ml-1">
            {item.category}
          </Text>
        </View>

        {/* Subcategory */}
        <Text className="text-base font-semibold text-gray-900 mb-2" numberOfLines={1}>
          {item.subcategory}
        </Text>

        {/* Color & Material Tags */}
        <View className="flex-row flex-wrap mb-2">
          <View className="flex-row items-center bg-blue-50 px-2 py-1 rounded-full mr-2">
            <Palette size={10} color="#3B82F6" />
            <Text className="text-xs text-blue-700 font-medium ml-1">{item.color}</Text>
          </View>
          <View className="flex-row items-center bg-purple-50 px-2 py-1 rounded-full">
            <Tag size={10} color="#9333EA" />
            <Text className="text-xs text-purple-700 font-medium ml-1">{item.material}</Text>
          </View>
        </View>

        {/* Attributes Chips */}
        {item.attributes && item.attributes.length > 0 && (
          <View className="flex-row flex-wrap">
            {item.attributes.slice(0, 3).map((attr, index) => (
              <View
                key={index}
                className="bg-gray-100 px-2 py-0.5 rounded-full mr-1.5 mb-1"
              >
                <Text className="text-xs text-gray-600">{attr}</Text>
              </View>
            ))}
            {item.attributes.length > 3 && (
              <View className="bg-gray-100 px-2 py-0.5 rounded-full mb-1">
                <Text className="text-xs text-gray-600">+{item.attributes.length - 3}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}

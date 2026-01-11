import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import WardrobeGrid from '@/components/WardrobeGrid';
import { mockWardrobeItems } from '@/lib/mockData';
import { WardrobeItem } from '@/types/wardrobe';

export default function WardrobeScreen() {
  const handleItemPress = (item: WardrobeItem) => {
    // TODO: Navigate to item detail screen
    console.log('Item pressed:', item.id);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1">
        {/* Header */}
        <View className="bg-white px-4 py-4 border-b border-gray-200">
          <Text className="text-2xl font-bold text-gray-900">My Wardrobe</Text>
          <Text className="text-sm text-gray-500 mt-1">
            {mockWardrobeItems.length} items
          </Text>
        </View>

        {/* Wardrobe Grid */}
        <WardrobeGrid
          items={mockWardrobeItems}
          onItemPress={handleItemPress}
        />
      </View>
    </SafeAreaView>
  );
}

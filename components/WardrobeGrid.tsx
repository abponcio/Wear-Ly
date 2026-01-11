import React from 'react';
import { View, Text, FlatList, Dimensions, RefreshControl } from 'react-native';
import { Package } from 'lucide-react-native';
import ItemCard from '@/components/ui/ItemCard';
import { WardrobeItem } from '@/types/wardrobe';

interface WardrobeGridProps {
  items: WardrobeItem[];
  onItemPress?: (item: WardrobeItem) => void;
  loading?: boolean;
  refreshControl?: React.ReactElement<typeof RefreshControl>;
}

const { width } = Dimensions.get('window');
const CARD_MARGIN = 16;
const CARD_PADDING = 16;
const NUM_COLUMNS = 2;
const CARD_WIDTH = (width - CARD_PADDING * 2 - CARD_MARGIN) / NUM_COLUMNS;

export default function WardrobeGrid({ items, onItemPress, loading = false, refreshControl }: WardrobeGridProps) {
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center p-8">
        <Text className="text-gray-500 text-base">Loading your wardrobe...</Text>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View className="flex-1 justify-center items-center p-8">
        <Package size={48} color="#9CA3AF" />
        <Text className="text-gray-600 text-lg font-semibold mt-4 mb-2">
          Your wardrobe is empty
        </Text>
        <Text className="text-gray-500 text-center text-sm">
          Start adding items to build your virtual closet
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      numColumns={NUM_COLUMNS}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{
        padding: CARD_PADDING,
      }}
      columnWrapperStyle={{
        justifyContent: 'space-between',
        marginBottom: CARD_MARGIN,
      }}
      renderItem={({ item }) => (
        <View style={{ width: CARD_WIDTH }}>
          <ItemCard
            item={item}
            onPress={() => onItemPress?.(item)}
          />
        </View>
      )}
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
    />
  );
}

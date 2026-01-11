import React from 'react';
import { View, Text, FlatList, Dimensions, RefreshControl, ScrollView } from 'react-native';
import { Package } from 'lucide-react-native';
import ItemCard from '@/components/ui/ItemCard';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
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
  if (loading && items.length === 0) {
    return (
      <ScrollView
        contentContainerStyle={{ paddingVertical: 16 }}
        refreshControl={refreshControl}
      >
        <LoadingSkeleton count={6} />
      </ScrollView>
    );
  }

  if (items.length === 0 && !loading) {
    return (
      <ScrollView
        contentContainerClassName="flex-1 justify-center items-center p-8"
        refreshControl={refreshControl}
      >
        <View className="items-center">
          <View className="bg-indigo-100 rounded-full p-6 mb-4">
            <Package size={48} color="#6366F1" />
          </View>
          <Text className="text-gray-900 text-xl font-bold mt-4 mb-2">
            Your wardrobe is empty
          </Text>
          <Text className="text-gray-500 text-center text-sm max-w-xs">
            Start adding items to build your AI-powered virtual closet
          </Text>
        </View>
      </ScrollView>
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

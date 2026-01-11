import React from "react";
import {
  View,
  Text,
  FlatList,
  Dimensions,
  RefreshControl,
  ScrollView,
} from "react-native";
import { Shirt } from "lucide-react-native";
import ItemCard from "@/components/ui/ItemCard";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import { WardrobeItem } from "@/types/wardrobe";

interface WardrobeGridProps {
  items: WardrobeItem[];
  onItemPress?: (item: WardrobeItem) => void;
  loading?: boolean;
  refreshControl?: React.ReactElement<typeof RefreshControl>;
}

const { width } = Dimensions.get("window");
const CARD_GAP = 12;
const CARD_PADDING = 20;
const NUM_COLUMNS = 2;
const CARD_WIDTH = (width - CARD_PADDING * 2 - CARD_GAP) / NUM_COLUMNS;

export default function WardrobeGrid({
  items,
  onItemPress,
  loading = false,
  refreshControl,
}: WardrobeGridProps) {
  if (loading && items.length === 0) {
    return (
      <ScrollView
        contentContainerStyle={{ paddingVertical: 16 }}
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
      >
        <LoadingSkeleton count={6} />
      </ScrollView>
    );
  }

  if (items.length === 0 && !loading) {
    return (
      <ScrollView
        contentContainerClassName="flex-1 justify-center items-center px-8 py-16"
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center">
          <Shirt size={32} color="#6B6B6B" strokeWidth={1} />
          <Text className="text-charcoal text-center mt-6 mb-2">
            Your closet is empty
          </Text>
          <Text className="text-charcoal-muted text-sm text-center">
            Add items to build your wardrobe
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
        paddingHorizontal: CARD_PADDING,
        paddingBottom: 100, // Account for tab bar
      }}
      columnWrapperStyle={{
        justifyContent: "space-between",
        marginBottom: CARD_GAP,
      }}
      renderItem={({ item }) => (
        <View style={{ width: CARD_WIDTH }}>
          <ItemCard item={item} onPress={() => onItemPress?.(item)} />
        </View>
      )}
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
    />
  );
}

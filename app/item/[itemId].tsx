import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { ChevronLeft, Trash2 } from "lucide-react-native";
import { useWardrobe } from "@/hooks/useWardrobe";

export default function ItemDetailScreen() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const router = useRouter();
  const { items, deleteItem, isLoading: isLoadingWardrobe } = useWardrobe();
  const [isDeleting, setIsDeleting] = useState(false);

  const item = items.find((i) => i.id === itemId);

  useEffect(() => {
    if (!isLoadingWardrobe && !item) {
      Alert.alert("Item Not Found", "This item could not be found.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    }
  }, [item, isLoadingWardrobe, router]);

  const handleDelete = () => {
    if (!item) return;

    Alert.alert(
      "Remove Item",
      "Are you sure you want to remove this item from your closet?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteItem(item.id);
              Alert.alert("Removed", "Item has been removed.", [
                { text: "OK", onPress: () => router.back() },
              ]);
            } catch (error) {
              Alert.alert("Error", "Failed to remove item. Please try again.", [
                { text: "OK" },
              ]);
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (isLoadingWardrobe) {
    return (
      <SafeAreaView className="flex-1 bg-cream-100">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="small" color="#1A1A1A" />
          <Text className="text-charcoal-muted text-xs tracking-wide uppercase mt-4">
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!item) {
    return null;
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-cream-100">
      {/* Header */}
      <View className="px-5 py-4 flex-row items-center justify-between bg-white border-b border-cream-200">
        <Pressable
          onPress={() => router.back()}
          className="p-2 -ml-2 active:opacity-50"
        >
          <ChevronLeft size={24} color="#1A1A1A" strokeWidth={1.5} />
        </Pressable>
        <Pressable
          onPress={handleDelete}
          disabled={isDeleting}
          className="p-2 -mr-2 active:opacity-50"
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color="#1A1A1A" />
          ) : (
            <Trash2 size={20} color="#1A1A1A" strokeWidth={1.5} />
          )}
        </Pressable>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Image Section */}
        <View className="bg-white">
          <View className="w-full aspect-[3/4] bg-cream-100">
            <Image
              source={{ uri: item.isolatedImageUrl || item.imageUrl }}
              contentFit="contain"
              transition={200}
              className="w-full h-full"
            />
          </View>
        </View>

        {/* Details Section */}
        <View className="px-5 py-6">
          {/* Category */}
          <Text className="text-xs tracking-widest text-charcoal-muted uppercase mb-2">
            {item.category}
          </Text>

          {/* Subcategory */}
          <Text className="text-2xl font-light text-charcoal tracking-wide mb-6">
            {item.subcategory}
          </Text>

          {/* Details Grid */}
          <View className="flex-row gap-4 mb-6">
            <View className="flex-1 border border-cream-300 p-4 bg-white">
              <Text className="text-[10px] tracking-widest text-charcoal-muted uppercase mb-1">
                Color
              </Text>
              <Text className="text-charcoal text-sm">{item.color}</Text>
            </View>
            <View className="flex-1 border border-cream-300 p-4 bg-white">
              <Text className="text-[10px] tracking-widest text-charcoal-muted uppercase mb-1">
                Material
              </Text>
              <Text className="text-charcoal text-sm">{item.material}</Text>
            </View>
          </View>

          {/* Attributes */}
          {item.attributes && item.attributes.length > 0 && (
            <View className="mb-6">
              <Text className="text-xs tracking-widest text-charcoal-muted uppercase mb-3">
                Style Tags
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {item.attributes.map((attr, index) => (
                  <View
                    key={index}
                    className="border border-charcoal/20 px-3 py-2"
                  >
                    <Text className="text-xs text-charcoal capitalize">
                      {attr}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Date Added */}
          <View className="pt-6 border-t border-cream-200">
            <Text className="text-xs text-charcoal-muted">
              Added {formatDate(item.createdAt)}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

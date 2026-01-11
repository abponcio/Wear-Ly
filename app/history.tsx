import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import {
  ChevronLeft,
  Clock,
  Trash2,
  Cloud,
  Sun,
  Snowflake,
  CloudRain,
  Shirt,
} from "lucide-react-native";
import { useOutfitHistory, populateOutfitItems } from "@/hooks/useOutfitHistory";
import { useWardrobe } from "@/hooks/useWardrobe";
import type { Outfit, WardrobeItem } from "@/types/wardrobe";

const WEATHER_ICONS: Record<string, React.ElementType> = {
  hot: Sun,
  warm: Sun,
  moderate: Cloud,
  cool: Cloud,
  cold: Snowflake,
  rainy: CloudRain,
};

interface OutfitCardProps {
  outfit: Outfit;
  items: WardrobeItem[];
  onDelete: () => void;
  isDeleting: boolean;
}

function OutfitCard({ outfit, items, onDelete, isDeleting }: OutfitCardProps) {
  const WeatherIcon = outfit.weather
    ? WEATHER_ICONS[outfit.weather] || Cloud
    : Cloud;

  const handleDelete = () => {
    Alert.alert(
      "Delete Outfit",
      "Are you sure you want to delete this saved outfit?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: onDelete,
        },
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <View className="bg-white border border-cream-200 mb-4">
      {/* Item Images Row */}
      <View className="flex-row">
        {items.slice(0, 3).map((item) => (
          <View key={item.id} className="flex-1 aspect-square bg-cream-100">
            <Image
              source={{ uri: item.isolatedImageUrl || item.imageUrl }}
              contentFit="cover"
              className="w-full h-full"
            />
          </View>
        ))}
        {items.length < 3 &&
          Array(3 - items.length)
            .fill(0)
            .map((_, index) => (
              <View
                key={`placeholder-${index}`}
                className="flex-1 aspect-square bg-cream-200 items-center justify-center"
              >
                <Shirt size={20} color="#6B6B6B" strokeWidth={1} />
              </View>
            ))}
      </View>

      {/* Outfit Details */}
      <View className="p-4">
        {/* Context Tags */}
        <View className="flex-row items-center gap-2 mb-3">
          {outfit.occasion && (
            <View className="border border-charcoal/20 px-2 py-1">
              <Text className="text-[10px] tracking-wide uppercase text-charcoal">
                {outfit.occasion}
              </Text>
            </View>
          )}
          {outfit.weather && (
            <View className="border border-charcoal/20 px-2 py-1 flex-row items-center gap-1">
              <WeatherIcon size={10} color="#1A1A1A" strokeWidth={1.5} />
              <Text className="text-[10px] tracking-wide uppercase text-charcoal">
                {outfit.weather}
              </Text>
            </View>
          )}
        </View>

        {/* Suggestion Text */}
        {outfit.geminiSuggestion && (
          <Text
            className="text-charcoal text-sm leading-5 italic mb-3"
            numberOfLines={2}
          >
            "{outfit.geminiSuggestion}"
          </Text>
        )}

        {/* Footer */}
        <View className="flex-row items-center justify-between pt-3 border-t border-cream-200">
          <Text className="text-xs text-charcoal-muted">
            {formatDate(outfit.createdAt)}
          </Text>

          <Pressable
            onPress={handleDelete}
            disabled={isDeleting}
            className="p-2 active:opacity-50"
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#1A1A1A" />
            ) : (
              <Trash2 size={16} color="#1A1A1A" strokeWidth={1.5} />
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const router = useRouter();
  const { items: wardrobeItems, isLoading: itemsLoading } = useWardrobe();
  const {
    outfits,
    isLoading,
    error,
    refreshOutfits,
    deleteOutfit,
    isDeleting,
  } = useOutfitHistory();

  const populatedOutfits = useMemo(() => {
    return outfits.map((outfit) => populateOutfitItems(outfit, wardrobeItems));
  }, [outfits, wardrobeItems]);

  const handleDeleteOutfit = async (outfitId: string) => {
    const success = await deleteOutfit(outfitId);
    if (!success) {
      Alert.alert("Error", "Failed to delete outfit. Please try again.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-cream-100">
      {/* Header */}
      <View className="px-5 py-4 flex-row items-center border-b border-cream-200 bg-white">
        <Pressable
          onPress={() => router.back()}
          className="p-2 -ml-2 active:opacity-50"
        >
          <ChevronLeft size={24} color="#1A1A1A" strokeWidth={1.5} />
        </Pressable>
        <View className="flex-row items-center gap-2 ml-2">
          <Clock size={18} color="#1A1A1A" strokeWidth={1.5} />
          <Text className="text-base font-light text-charcoal tracking-wide">
            Saved Looks
          </Text>
        </View>
      </View>

      {/* Content */}
      {isLoading || itemsLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="small" color="#1A1A1A" />
          <Text className="text-charcoal-muted text-xs tracking-wide uppercase mt-4">
            Loading...
          </Text>
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center px-8">
          <Text className="text-charcoal text-center mb-4">{error}</Text>
          <Pressable
            onPress={refreshOutfits}
            className="bg-charcoal px-6 py-3"
          >
            <Text className="text-white text-xs tracking-widest uppercase">
              Try Again
            </Text>
          </Pressable>
        </View>
      ) : outfits.length === 0 ? (
        <View className="flex-1 justify-center items-center px-8">
          <Clock size={32} color="#6B6B6B" strokeWidth={1} />
          <Text className="text-charcoal text-center mt-6 mb-2">
            No saved looks yet
          </Text>
          <Text className="text-charcoal-muted text-sm text-center mb-6">
            Generate an outfit and save it to see it here
          </Text>
          <Pressable
            onPress={() => router.back()}
            className="bg-charcoal px-8 py-4 active:opacity-80"
          >
            <Text className="text-white text-xs tracking-widest uppercase">
              Generate Look
            </Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-5 pt-4"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refreshOutfits}
              tintColor="#1A1A1A"
            />
          }
        >
          <Text className="text-xs tracking-widest text-charcoal-muted uppercase mb-4">
            {outfits.length} saved {outfits.length === 1 ? "look" : "looks"}
          </Text>

          {populatedOutfits.map((outfit) => (
            <OutfitCard
              key={outfit.id}
              outfit={outfit}
              items={outfit.items || []}
              onDelete={() => handleDeleteOutfit(outfit.id)}
              isDeleting={isDeleting}
            />
          ))}

          <View className="h-8" />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

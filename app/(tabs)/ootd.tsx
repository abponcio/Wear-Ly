import React, { useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Sparkles, Cloud, Sun, CloudRain, Snowflake } from "lucide-react-native";
import { useWardrobe, useOutfitGeneration } from "@/hooks/useWardrobe";
import ItemCard from "@/components/ui/ItemCard";
import type { WardrobeItem, OutfitContext } from "@/types/wardrobe";

const OCCASIONS = [
  { value: "casual", label: "Casual" },
  { value: "formal", label: "Formal" },
  { value: "business", label: "Business" },
  { value: "party", label: "Party" },
  { value: "date", label: "Date Night" },
  { value: "sporty", label: "Sporty" },
];

const WEATHER_OPTIONS = [
  { value: "hot", label: "Hot", icon: Sun },
  { value: "warm", label: "Warm", icon: Sun },
  { value: "moderate", label: "Moderate", icon: Cloud },
  { value: "cool", label: "Cool", icon: Cloud },
  { value: "cold", label: "Cold", icon: Snowflake },
  { value: "rainy", label: "Rainy", icon: CloudRain },
];

export default function OOTDScreen() {
  const { items, isLoading: itemsLoading, error: itemsError } = useWardrobe();
  const { generateOutfitSuggestion, isLoading, error, currentOutfit } =
    useOutfitGeneration(items);

  const [occasion, setOccasion] = useState<string>("casual");
  const [weather, setWeather] = useState<string>("moderate");

  const handleGenerate = async () => {
    const context: OutfitContext = {
      occasion,
      weather,
    };
    await generateOutfitSuggestion(context);
  };

  // Get outfit items from suggestion
  const outfitItems: WardrobeItem[] = currentOutfit
    ? items.filter((item) => currentOutfit.itemIds.includes(item.id))
    : [];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="bg-white px-4 py-4 border-b border-gray-200">
          <View className="flex-row items-center gap-2 mb-2">
            <Sparkles size={24} color="#6366F1" />
            <Text className="text-2xl font-bold text-gray-900">OOTD Generator</Text>
          </View>
          <Text className="text-sm text-gray-500">
            Get AI-powered outfit suggestions based on your wardrobe
          </Text>
        </View>

        {/* Context Selection */}
        <View className="bg-white px-4 py-4 mt-2 border-b border-gray-200">
          {/* Occasion Selection */}
          <Text className="text-base font-semibold text-gray-900 mb-3">
            Occasion
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {OCCASIONS.map((occ) => (
              <Pressable
                key={occ.value}
                onPress={() => setOccasion(occ.value)}
                className={`px-4 py-2 rounded-full border ${
                  occasion === occ.value
                    ? "bg-indigo-500 border-indigo-500"
                    : "bg-gray-100 border-gray-300"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    occasion === occ.value ? "text-white" : "text-gray-700"
                  }`}
                >
                  {occ.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Weather Selection */}
          <Text className="text-base font-semibold text-gray-900 mb-3">
            Weather
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {WEATHER_OPTIONS.map((w) => {
              const Icon = w.icon;
              return (
                <Pressable
                  key={w.value}
                  onPress={() => setWeather(w.value)}
                  className={`px-4 py-2 rounded-full border flex-row items-center gap-2 ${
                    weather === w.value
                      ? "bg-indigo-500 border-indigo-500"
                      : "bg-gray-100 border-gray-300"
                  }`}
                >
                  <Icon
                    size={16}
                    color={weather === w.value ? "#FFFFFF" : "#374151"}
                  />
                  <Text
                    className={`text-sm font-medium ${
                      weather === w.value ? "text-white" : "text-gray-700"
                    }`}
                  >
                    {w.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Generate Button */}
          <Pressable
            onPress={handleGenerate}
            disabled={isLoading || items.length < 3}
            className={`mt-4 py-3 rounded-lg flex-row items-center justify-center gap-2 ${
              isLoading || items.length < 3
                ? "bg-gray-300"
                : "bg-indigo-600 active:bg-indigo-700"
            }`}
          >
            {isLoading ? (
              <>
                <ActivityIndicator color="#FFFFFF" />
                <Text className="text-white font-semibold">Generating...</Text>
              </>
            ) : (
              <>
                <Sparkles size={20} color="#FFFFFF" />
                <Text className="text-white font-semibold text-base">
                  Generate Outfit
                </Text>
              </>
            )}
          </Pressable>

          {items.length < 3 && (
            <Text className="text-sm text-gray-500 mt-2 text-center">
              You need at least 3 items in your wardrobe to generate an outfit
            </Text>
          )}
        </View>

        {/* Error Messages */}
        {itemsError && (
          <View className="bg-red-50 border border-red-200 mx-4 mt-4 p-3 rounded-lg">
            <Text className="text-red-700 text-sm">{itemsError}</Text>
          </View>
        )}

        {error && (
          <View className="bg-red-50 border border-red-200 mx-4 mt-4 p-3 rounded-lg">
            <Text className="text-red-700 text-sm">{error}</Text>
          </View>
        )}

        {/* Loading State */}
        {itemsLoading && (
          <View className="flex-1 justify-center items-center py-8">
            <ActivityIndicator size="large" color="#6366F1" />
            <Text className="text-gray-500 mt-2">Loading your wardrobe...</Text>
          </View>
        )}

        {/* Outfit Suggestion */}
        {currentOutfit && outfitItems.length === 3 && (
          <View className="px-4 py-4">
            <Text className="text-lg font-bold text-gray-900 mb-2">
              Your Outfit Suggestion
            </Text>
            <View className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg mb-4">
              <Text className="text-indigo-900 text-sm leading-5">
                {currentOutfit.suggestion}
              </Text>
            </View>

            {/* Outfit Items Grid */}
            <View className="flex-row flex-wrap justify-between gap-2">
              {outfitItems.map((item) => (
                <View key={item.id} className="w-[48%]">
                  <ItemCard item={item} />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Empty State */}
        {!itemsLoading && items.length === 0 && (
          <View className="flex-1 justify-center items-center py-8 px-4">
            <Sparkles size={48} color="#9CA3AF" />
            <Text className="text-gray-600 text-lg font-semibold mt-4 mb-2">
              No items in your wardrobe yet
            </Text>
            <Text className="text-gray-500 text-center text-sm">
              Add some items to your wardrobe first to generate outfit suggestions
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

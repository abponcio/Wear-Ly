import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import {
  Sparkles,
  Cloud,
  Sun,
  CloudRain,
  Snowflake,
  Bookmark,
  Clock,
  Check,
  User,
  AlertCircle,
} from "lucide-react-native";
import { Image } from "expo-image";
import { useWardrobe, useOutfitGeneration } from "@/hooks/useWardrobe";
import { useOutfitHistory } from "@/hooks/useOutfitHistory";
import { getUserProfile } from "@/services/supabase";
import { getTryOnVisualization, checkGenderCompatibility } from "@/services/tryon";
import ItemCard from "@/components/ui/ItemCard";
import type { WardrobeItem, OutfitContext, UserProfile, OutfitVisualization } from "@/types/wardrobe";

const OCCASIONS = [
  { value: "casual", label: "Casual" },
  { value: "formal", label: "Formal" },
  { value: "business", label: "Business" },
  { value: "party", label: "Party" },
  { value: "date", label: "Date" },
  { value: "sporty", label: "Sport" },
];

const WEATHER_OPTIONS = [
  { value: "hot", label: "Hot", icon: Sun },
  { value: "warm", label: "Warm", icon: Sun },
  { value: "moderate", label: "Mild", icon: Cloud },
  { value: "cool", label: "Cool", icon: Cloud },
  { value: "cold", label: "Cold", icon: Snowflake },
  { value: "rainy", label: "Rain", icon: CloudRain },
];

export default function OOTDScreen() {
  const router = useRouter();
  const { items, isLoading: itemsLoading, error: itemsError, refreshItems } = useWardrobe();
  const { generateOutfitSuggestion, isLoading, error, currentOutfit } =
    useOutfitGeneration(items);
  const { saveOutfit, isSaving, outfits } = useOutfitHistory();

  const [occasion, setOccasion] = useState<string>("casual");
  const [weather, setWeather] = useState<string>("moderate");
  const [isSaved, setIsSaved] = useState(false);

  // Try-On state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isGeneratingTryOn, setIsGeneratingTryOn] = useState(false);
  const [tryOnVisualization, setTryOnVisualization] = useState<OutfitVisualization | null>(null);
  const [tryOnError, setTryOnError] = useState<string | null>(null);

  // Refresh wardrobe items when screen comes into focus (sync with closet/upload)
  useFocusEffect(
    useCallback(() => {
      refreshItems();
    }, [refreshItems])
  );

  // Load profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const userProfile = await getUserProfile();
        setProfile(userProfile);
      } catch (err) {
        console.error("Error loading profile:", err);
      }
    };
    loadProfile();
  }, []);

  const handleGenerate = async () => {
    setIsSaved(false);
    setTryOnVisualization(null);
    setTryOnError(null);
    const context: OutfitContext = {
      occasion,
      weather,
    };
    await generateOutfitSuggestion(context);
  };

  const handleSaveOutfit = async () => {
    if (!currentOutfit || isSaved) return;

    const saved = await saveOutfit({
      itemIds: currentOutfit.itemIds,
      occasion,
      weather,
      suggestion: currentOutfit.suggestion,
    });

    if (saved) {
      setIsSaved(true);
      Alert.alert("Saved", "Outfit saved to your history.");
    } else {
      Alert.alert("Error", "Failed to save outfit. Please try again.");
    }
  };

  const outfitItems: WardrobeItem[] = currentOutfit
    ? items.filter((item) => currentOutfit.itemIds.includes(item.id))
    : [];

  const handleTryOn = useCallback(async () => {
    if (!profile?.personalModelUrl) {
      Alert.alert(
        "Personal Model Required",
        "Please create your personal model in Settings first.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Go to Settings", onPress: () => router.push("/settings") },
        ]
      );
      return;
    }

    if (outfitItems.length === 0) {
      Alert.alert("No Outfit", "Generate an outfit first.");
      return;
    }

    // Check gender compatibility
    const compatibility = checkGenderCompatibility(profile.gender, outfitItems);
    if (!compatibility.isCompatible) {
      const incompatibleNames = compatibility.incompatibleItems
        .map(i => `${i.color} ${i.subcategory}`)
        .join(", ");
      Alert.alert(
        "Clothing Mismatch",
        `Some items may not fit well: ${incompatibleNames}. Continue anyway?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Continue", onPress: () => generateTryOn(Boolean(tryOnVisualization)) },
        ]
      );
      return;
    }

    generateTryOn(Boolean(tryOnVisualization));
  }, [profile, outfitItems, router, tryOnVisualization]);

  const generateTryOn = async (forceRegenerate: boolean = false) => {
    if (!profile?.personalModelUrl) return;

    setIsGeneratingTryOn(true);
    setTryOnError(null);

    try {
      // If we already have a visualization and force is true, regenerate
      const shouldForce = forceRegenerate || Boolean(tryOnVisualization);
      const visualization = await getTryOnVisualization(
        profile.personalModelUrl,
        outfitItems,
        shouldForce
      );
      setTryOnVisualization(visualization);
    } catch (err) {
      console.error("Error generating try-on:", err);
      setTryOnError("Failed to generate try-on. Please try again.");
    } finally {
      setIsGeneratingTryOn(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-cream-100" edges={["bottom"]}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-5 pt-2 pb-4 flex-row items-center justify-between">
          <View>
            <Text className="text-xs tracking-widest text-charcoal-muted uppercase">
              Style Assistant
            </Text>
          </View>
          {/* History Button */}
          <Pressable
            onPress={() => router.push("/history")}
            className="flex-row items-center gap-2 py-2 px-3 border border-cream-300 active:opacity-70"
          >
            <Clock size={14} color="#6B6B6B" strokeWidth={1.5} />
            <Text className="text-charcoal-muted text-xs tracking-wide uppercase">
              History
              {outfits.length > 0 && ` (${outfits.length})`}
            </Text>
          </Pressable>
        </View>

        {/* Context Selection */}
        <View className="px-5 py-4 bg-white border-y border-cream-200">
          {/* Occasion Selection */}
          <Text className="text-xs tracking-widest text-charcoal-muted uppercase mb-3">
            Occasion
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-6">
            {OCCASIONS.map((occ) => (
              <Pressable
                key={occ.value}
                onPress={() => setOccasion(occ.value)}
                className={`px-4 py-2 border ${
                  occasion === occ.value
                    ? "bg-charcoal border-charcoal"
                    : "bg-white border-cream-300"
                }`}
              >
                <Text
                  className={`text-xs tracking-wide uppercase ${
                    occasion === occ.value ? "text-white" : "text-charcoal"
                  }`}
                >
                  {occ.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Weather Selection */}
          <Text className="text-xs tracking-widest text-charcoal-muted uppercase mb-3">
            Weather
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {WEATHER_OPTIONS.map((w) => {
              const Icon = w.icon;
              return (
                <Pressable
                  key={w.value}
                  onPress={() => setWeather(w.value)}
                  className={`px-4 py-2 border flex-row items-center gap-2 ${
                    weather === w.value
                      ? "bg-charcoal border-charcoal"
                      : "bg-white border-cream-300"
                  }`}
                >
                  <Icon
                    size={14}
                    color={weather === w.value ? "#FFFFFF" : "#1A1A1A"}
                    strokeWidth={1.5}
                  />
                  <Text
                    className={`text-xs tracking-wide uppercase ${
                      weather === w.value ? "text-white" : "text-charcoal"
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
            disabled={isLoading || items.length < 2}
            className={`mt-6 py-4 flex-row items-center justify-center gap-2 ${
              isLoading || items.length < 2
                ? "bg-cream-200"
                : "bg-gold active:opacity-80"
            }`}
          >
            {isLoading ? (
              <>
                <ActivityIndicator color="#1A1A1A" size="small" />
                <Text className="text-charcoal text-xs tracking-widest uppercase">
                  Generating...
                </Text>
              </>
            ) : (
              <>
                <Sparkles size={16} color="#1A1A1A" strokeWidth={1.5} />
                <Text className="text-charcoal text-xs tracking-widest uppercase">
                  Generate Look
                </Text>
              </>
            )}
          </Pressable>

          {items.length < 2 && (
            <Text className="text-xs text-charcoal-muted mt-3 text-center">
              Add at least 2 items to your closet first
            </Text>
          )}
        </View>

        {/* Error Messages */}
        {(itemsError || error) && (
          <View className="mx-5 mt-4 p-4 border border-charcoal/20 bg-white">
            <Text className="text-charcoal text-sm">
              {itemsError || error}
            </Text>
          </View>
        )}

        {/* Loading State */}
        {itemsLoading && (
          <View className="flex-1 justify-center items-center py-12">
            <ActivityIndicator size="small" color="#1A1A1A" />
            <Text className="text-charcoal-muted text-xs tracking-wide uppercase mt-4">
              Loading closet...
            </Text>
          </View>
        )}

        {/* Outfit Suggestion */}
        {currentOutfit && outfitItems.length > 0 && (
          <View className="px-5 py-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xs tracking-widest text-charcoal-muted uppercase">
                Your Look
              </Text>
              {/* Save Button */}
              <Pressable
                onPress={handleSaveOutfit}
                disabled={isSaving || isSaved}
                className={`flex-row items-center gap-2 px-3 py-2 border ${
                  isSaved
                    ? "border-gold bg-gold/10"
                    : "border-cream-300 bg-white"
                }`}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#1A1A1A" />
                ) : isSaved ? (
                  <Check size={14} color="#8B7355" strokeWidth={1.5} />
                ) : (
                  <Bookmark size={14} color="#1A1A1A" strokeWidth={1.5} />
                )}
                <Text
                  className={`text-xs tracking-wide uppercase ${
                    isSaved ? "text-gold-dark" : "text-charcoal"
                  }`}
                >
                  {isSaved ? "Saved" : isSaving ? "Saving" : "Save"}
                </Text>
              </Pressable>
            </View>

            {/* AI Suggestion */}
            <View className="bg-cream-50 border border-cream-200 p-4 mb-4">
              <Text className="text-charcoal text-sm leading-6 italic">
                "{currentOutfit.suggestion}"
              </Text>
              {currentOutfit.stylistNote && (
                <View className="mt-3 pt-3 border-t border-cream-200">
                  <Text className="text-[10px] tracking-widest text-gold-dark uppercase mb-1">
                    Stylist Tip
                  </Text>
                  <Text className="text-charcoal-muted text-xs leading-5">
                    {currentOutfit.stylistNote}
                  </Text>
                </View>
              )}
            </View>

            {/* Outfit Items Grid */}
            <View className="flex-row flex-wrap justify-between gap-3 mb-6">
              {outfitItems.map((item) => (
                <View key={item.id} className="w-[48%]">
                  <ItemCard item={item} />
                </View>
              ))}
            </View>

            {/* Virtual Try-On Section */}
            <View className="border-t border-cream-200 pt-6">
              <View className="flex-row items-center gap-2 mb-4">
                <User size={16} color="#C4A77D" strokeWidth={1.5} />
                <Text className="text-xs tracking-widest text-charcoal-muted uppercase">
                  Virtual Try-On
                </Text>
              </View>

              {/* Try-On Visualization */}
              {tryOnVisualization && (
                <View className="mb-4">
                  <View
                    className="bg-cream-200 overflow-hidden"
                    style={{ width: "100%", aspectRatio: 3/4, borderRadius: 4 }}
                  >
                    <Image
                      source={{ uri: tryOnVisualization.visualizationUrl }}
                      contentFit="cover"
                      style={{ width: "100%", height: "100%" }}
                    />
                  </View>
                  <Text className="text-xs text-charcoal-muted text-center mt-2">
                    Virtual try-on preview
                  </Text>
                </View>
              )}

              {/* Try-On Error */}
              {tryOnError && (
                <View className="flex-row items-center gap-2 p-3 bg-cream-50 border border-charcoal/10 mb-4">
                  <AlertCircle size={16} color="#6B6B6B" strokeWidth={1.5} />
                  <Text className="text-charcoal-muted text-sm flex-1">{tryOnError}</Text>
                </View>
              )}

              {/* Try It On Button */}
              <Pressable
                onPress={handleTryOn}
                disabled={isGeneratingTryOn}
                className={`py-4 flex-row items-center justify-center gap-2 ${
                  isGeneratingTryOn ? "bg-cream-200" : "bg-charcoal active:opacity-80"
                }`}
              >
                {isGeneratingTryOn ? (
                  <>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text className="text-white text-xs tracking-widest uppercase">
                      Generating Try-On...
                    </Text>
                  </>
                ) : (
                  <>
                    <User size={16} color="#FFFFFF" strokeWidth={1.5} />
                    <Text className="text-white text-xs tracking-widest uppercase">
                      {tryOnVisualization ? "Regenerate Try-On" : "Try It On"}
                    </Text>
                  </>
                )}
              </Pressable>

              {!profile?.personalModelUrl && (
                <Text className="text-xs text-charcoal-muted mt-3 text-center">
                  Create your personal model in Settings to use Try-On
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Empty State */}
        {!itemsLoading && items.length === 0 && (
          <View className="flex-1 justify-center items-center py-16 px-8">
            <Sparkles size={32} color="#6B6B6B" strokeWidth={1} />
            <Text className="text-charcoal text-center mt-6 mb-2">
              Your closet is empty
            </Text>
            <Text className="text-charcoal-muted text-sm text-center">
              Add items to generate outfit suggestions
            </Text>
          </View>
        )}

        {/* Bottom spacing for tab bar */}
        <View className="h-24" />
      </ScrollView>
    </SafeAreaView>
  );
}

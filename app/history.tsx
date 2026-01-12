import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
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
  User,
  X,
} from "lucide-react-native";
import { useOutfitHistory, populateOutfitItems } from "@/hooks/useOutfitHistory";
import { useWardrobe } from "@/hooks/useWardrobe";
import { getUserProfile } from "@/services/supabase";
import { getTryOnVisualization, checkGenderCompatibility } from "@/services/tryon";
import type { Outfit, WardrobeItem, UserProfile, OutfitVisualization } from "@/types/wardrobe";

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
  onVisualize: () => void;
  isDeleting: boolean;
  hasPersonalModel: boolean;
}

function OutfitCard({ outfit, items, onDelete, onVisualize, isDeleting, hasPersonalModel }: OutfitCardProps) {
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
              style={{ width: "100%", height: "100%" }}
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

        {/* Action Buttons */}
        <View className="flex-row items-center justify-between pt-3 border-t border-cream-200">
          <Text className="text-xs text-charcoal-muted">
            {formatDate(outfit.createdAt)}
          </Text>

          <View className="flex-row items-center gap-2">
            {/* Visualize Button */}
            {hasPersonalModel && items.length > 0 && (
              <Pressable
                onPress={onVisualize}
                className="flex-row items-center gap-1 px-3 py-2 border border-charcoal/20 active:opacity-50"
              >
                <User size={14} color="#1A1A1A" strokeWidth={1.5} />
                <Text className="text-xs tracking-wide uppercase text-charcoal">
                  Try On
                </Text>
              </Pressable>
            )}

            {/* Delete Button */}
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

  // Try-On state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isGeneratingTryOn, setIsGeneratingTryOn] = useState(false);
  const [tryOnVisualization, setTryOnVisualization] = useState<OutfitVisualization | null>(null);
  const [showTryOnModal, setShowTryOnModal] = useState(false);
  const [tryOnError, setTryOnError] = useState<string | null>(null);
  const [currentTryOnItems, setCurrentTryOnItems] = useState<WardrobeItem[]>([]);

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

  const populatedOutfits = useMemo(() => {
    return outfits.map((outfit) => populateOutfitItems(outfit, wardrobeItems));
  }, [outfits, wardrobeItems]);

  const handleDeleteOutfit = async (outfitId: string) => {
    const success = await deleteOutfit(outfitId);
    if (!success) {
      Alert.alert("Error", "Failed to delete outfit. Please try again.");
    }
  };

  const handleVisualize = useCallback(async (outfit: Outfit, items: WardrobeItem[]) => {
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

    // Check gender compatibility
    const compatibility = checkGenderCompatibility(profile.gender, items);
    if (!compatibility.isCompatible) {
      const incompatibleNames = compatibility.incompatibleItems
        .map(i => `${i.color} ${i.subcategory}`)
        .join(", ");
      Alert.alert(
        "Clothing Mismatch",
        `Some items may not fit well: ${incompatibleNames}. Continue anyway?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Continue", onPress: () => generateVisualization(items) },
        ]
      );
      return;
    }

    generateVisualization(items, false);
  }, [profile, router]);

  const generateVisualization = async (items: WardrobeItem[], forceRegenerate: boolean = false) => {
    if (!profile?.personalModelUrl) return;

    setCurrentTryOnItems(items);
    setIsGeneratingTryOn(true);
    setTryOnError(null);
    setShowTryOnModal(true);

    try {
      const visualization = await getTryOnVisualization(
        profile.personalModelUrl,
        items,
        forceRegenerate
      );
      setTryOnVisualization(visualization);
    } catch (err) {
      console.error("Error generating try-on:", err);
      setTryOnError("Failed to generate try-on. Please try again.");
    } finally {
      setIsGeneratingTryOn(false);
    }
  };

  const handleRegenerate = () => {
    if (currentTryOnItems.length > 0 && !isGeneratingTryOn) {
      setTryOnVisualization(null);
      generateVisualization(currentTryOnItems, true);
    }
  };

  const closeTryOnModal = () => {
    setShowTryOnModal(false);
    setTryOnVisualization(null);
    setTryOnError(null);
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
              onVisualize={() => handleVisualize(outfit, outfit.items || [])}
              isDeleting={isDeleting}
              hasPersonalModel={!!profile?.personalModelUrl}
            />
          ))}

          <View className="h-8" />
        </ScrollView>
      )}

      {/* Try-On Modal */}
      <Modal
        visible={showTryOnModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeTryOnModal}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-cream-100 rounded-t-3xl" style={{ maxHeight: "85%" }}>
            {/* Modal Header */}
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-cream-200">
              <Text className="text-charcoal text-base tracking-wide">
                Virtual Try-On
              </Text>
              <Pressable onPress={closeTryOnModal} className="p-2 active:opacity-50">
                <X size={20} color="#1A1A1A" strokeWidth={1.5} />
              </Pressable>
            </View>

            {/* Modal Content */}
            <ScrollView className="p-5">
              {isGeneratingTryOn ? (
                <View className="items-center py-12">
                  <ActivityIndicator size="large" color="#1A1A1A" />
                  <Text className="text-charcoal-muted text-sm mt-4 text-center">
                    Generating your virtual try-on...
                  </Text>
                  <Text className="text-charcoal-muted/60 text-xs mt-2 text-center">
                    This may take a moment
                  </Text>
                </View>
              ) : tryOnError ? (
                <View className="items-center py-12">
                  <Text className="text-charcoal text-sm text-center mb-4">{tryOnError}</Text>
                  <Pressable
                    onPress={closeTryOnModal}
                    className="bg-charcoal px-6 py-3"
                  >
                    <Text className="text-white text-xs tracking-widest uppercase">
                      Close
                    </Text>
                  </Pressable>
                </View>
              ) : tryOnVisualization ? (
                <View className="items-center">
                  <View
                    className="bg-cream-200 overflow-hidden"
                    style={{ width: "100%", aspectRatio: 3/4, borderRadius: 8 }}
                  >
                    <Image
                      source={{ uri: tryOnVisualization.visualizationUrl }}
                      contentFit="cover"
                      style={{ width: "100%", height: "100%" }}
                    />
                  </View>
                  <Text className="text-xs text-charcoal-muted text-center mt-4">
                    Virtual try-on preview
                  </Text>
                  <View className="flex-row gap-3 mt-6">
                    <Pressable
                      onPress={handleRegenerate}
                      className="flex-1 border border-charcoal px-6 py-4 active:opacity-80"
                    >
                      <Text className="text-charcoal text-xs tracking-widest uppercase text-center">
                        Regenerate
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={closeTryOnModal}
                      className="flex-1 bg-charcoal px-6 py-4 active:opacity-80"
                    >
                      <Text className="text-white text-xs tracking-widest uppercase text-center">
                        Done
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}

              <View className="h-8" />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

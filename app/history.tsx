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
  Eye,
  RefreshCw,
  Sparkles,
} from "lucide-react-native";
import { useOutfitHistory, populateOutfitItems } from "@/hooks/useOutfitHistory";
import { useWardrobe } from "@/hooks/useWardrobe";
import { getUserProfile, getVisualizationByItemIds } from "@/services/supabase";
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
  visualization: OutfitVisualization | null;
  onDelete: () => void;
  onGenerateTryOn: () => void;
  onRegenerateTryOn: () => void;
  onSeeItems: () => void;
  isDeleting: boolean;
  isGenerating: boolean;
  hasPersonalModel: boolean;
}

function OutfitCard({
  outfit,
  items,
  visualization,
  onDelete,
  onGenerateTryOn,
  onRegenerateTryOn,
  onSeeItems,
  isDeleting,
  isGenerating,
  hasPersonalModel,
}: OutfitCardProps) {
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

  const hasVisualization = !!visualization?.visualizationUrl;

  return (
    <View className="bg-white border border-cream-200 mb-4 overflow-hidden">
      {/* Primary Display - Try-On or Item Grid Fallback */}
      {hasVisualization ? (
        // Full-width try-on image
        <View style={{ width: "100%", aspectRatio: 3 / 4 }} className="bg-cream-100">
          <Image
            source={{ uri: visualization.visualizationUrl }}
            contentFit="cover"
            style={{ width: "100%", height: "100%" }}
          />
        </View>
      ) : (
        // Fallback: Item thumbnails grid
        <View className="flex-row">
          {items.slice(0, 4).map((item) => (
            <View key={item.id} className="flex-1 aspect-square bg-cream-100">
              <Image
                source={{ uri: item.isolatedImageUrl || item.imageUrl }}
                contentFit="cover"
                style={{ width: "100%", height: "100%" }}
              />
            </View>
          ))}
          {items.length < 4 &&
            Array(Math.max(0, 4 - items.length))
              .fill(0)
              .map((_, index) => (
                <View
                  key={`placeholder-${index}`}
                  className="flex-1 aspect-square bg-cream-200 items-center justify-center"
                >
                  <Shirt size={16} color="#6B6B6B" strokeWidth={1} />
                </View>
              ))}
        </View>
      )}

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
          <View className="border border-charcoal/10 px-2 py-1">
            <Text className="text-[10px] tracking-wide uppercase text-charcoal-muted">
              {items.length} items
            </Text>
          </View>
        </View>

        {/* Suggestion Text */}
        {outfit.geminiSuggestion && (
          <Text
            className="text-charcoal text-sm leading-5 italic mb-4"
            numberOfLines={2}
          >
            "{outfit.geminiSuggestion}"
          </Text>
        )}

        {/* Action Buttons */}
        <View className="flex-row gap-2 mb-3">
          {/* See Items Button */}
          <Pressable
            onPress={onSeeItems}
            className="flex-1 flex-row items-center justify-center gap-2 py-3 border border-charcoal/20 active:opacity-50"
          >
            <Eye size={14} color="#1A1A1A" strokeWidth={1.5} />
            <Text className="text-xs tracking-wide uppercase text-charcoal">
              See Items ({items.length})
            </Text>
          </Pressable>

          {/* Generate/Regenerate Try-On Button */}
          {hasPersonalModel && (
            <Pressable
              onPress={hasVisualization ? onRegenerateTryOn : onGenerateTryOn}
              disabled={isGenerating}
              className={`flex-1 flex-row items-center justify-center gap-2 py-3 ${
                hasVisualization
                  ? "border border-charcoal/20"
                  : "bg-charcoal"
              } active:opacity-50`}
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color={hasVisualization ? "#1A1A1A" : "#FFFFFF"} />
              ) : hasVisualization ? (
                <>
                  <RefreshCw size={14} color="#1A1A1A" strokeWidth={1.5} />
                  <Text className="text-xs tracking-wide uppercase text-charcoal">
                    Regenerate
                  </Text>
                </>
              ) : (
                <>
                  <Sparkles size={14} color="#FFFFFF" strokeWidth={1.5} />
                  <Text className="text-xs tracking-wide uppercase text-white">
                    Generate Try-On
                  </Text>
                </>
              )}
            </Pressable>
          )}
        </View>

        {/* Bottom Row: Date and Delete */}
        <View className="flex-row items-center justify-between pt-3 border-t border-cream-200">
          <Text className="text-xs text-charcoal-muted">
            {formatDate(outfit.createdAt)}
          </Text>

          <Pressable
            onPress={handleDelete}
            disabled={isDeleting}
            className="p-2 -mr-2 active:opacity-50"
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

  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Visualization cache state - map of outfit ID to visualization
  const [visualizations, setVisualizations] = useState<Record<string, OutfitVisualization | null>>({});
  const [loadingVisualizations, setLoadingVisualizations] = useState(true);

  // Try-On generation state
  const [generatingOutfitId, setGeneratingOutfitId] = useState<string | null>(null);

  // Items modal state
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [selectedOutfitItems, setSelectedOutfitItems] = useState<WardrobeItem[]>([]);

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

  // Fetch visualizations for all outfits
  useEffect(() => {
    const fetchVisualizations = async () => {
      if (populatedOutfits.length === 0) {
        setLoadingVisualizations(false);
        return;
      }

      setLoadingVisualizations(true);
      const vizMap: Record<string, OutfitVisualization | null> = {};

      await Promise.all(
        populatedOutfits.map(async (outfit) => {
          try {
            const viz = await getVisualizationByItemIds(outfit.itemIds);
            vizMap[outfit.id] = viz;
          } catch (err) {
            console.error(`Error fetching visualization for outfit ${outfit.id}:`, err);
            vizMap[outfit.id] = null;
          }
        })
      );

      setVisualizations(vizMap);
      setLoadingVisualizations(false);
    };

    fetchVisualizations();
  }, [populatedOutfits]);

  const handleDeleteOutfit = async (outfitId: string) => {
    const success = await deleteOutfit(outfitId);
    if (!success) {
      Alert.alert("Error", "Failed to delete outfit. Please try again.");
    }
  };

  const handleGenerateTryOn = useCallback(
    async (outfit: Outfit, items: WardrobeItem[], forceRegenerate: boolean = false) => {
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
      if (!compatibility.isCompatible && !forceRegenerate) {
        const incompatibleNames = compatibility.incompatibleItems
          .map((i) => `${i.color} ${i.subcategory}`)
          .join(", ");
        Alert.alert(
          "Clothing Mismatch",
          `Some items may not fit well: ${incompatibleNames}. Continue anyway?`,
          [
            { text: "Cancel", style: "cancel" },
            { text: "Continue", onPress: () => handleGenerateTryOn(outfit, items, true) },
          ]
        );
        return;
      }

      setGeneratingOutfitId(outfit.id);

      try {
        const visualization = await getTryOnVisualization(
          profile.personalModelUrl,
          items,
          forceRegenerate
        );
        // Update the visualization cache
        setVisualizations((prev) => ({
          ...prev,
          [outfit.id]: visualization,
        }));
      } catch (err) {
        console.error("Error generating try-on:", err);
        Alert.alert("Error", "Failed to generate try-on. Please try again.");
      } finally {
        setGeneratingOutfitId(null);
      }
    },
    [profile, router]
  );

  const handleSeeItems = (items: WardrobeItem[]) => {
    setSelectedOutfitItems(items);
    setShowItemsModal(true);
  };

  const closeItemsModal = () => {
    setShowItemsModal(false);
    setSelectedOutfitItems([]);
  };

  const navigateToItem = (itemId: string) => {
    closeItemsModal();
    router.push(`/item/${itemId}`);
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
      {isLoading || itemsLoading || loadingVisualizations ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="small" color="#1A1A1A" />
          <Text className="text-charcoal-muted text-xs tracking-wide uppercase mt-4">
            Loading...
          </Text>
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center px-8">
          <Text className="text-charcoal text-center mb-4">{error}</Text>
          <Pressable onPress={refreshOutfits} className="bg-charcoal px-6 py-3">
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
              visualization={visualizations[outfit.id] || null}
              onDelete={() => handleDeleteOutfit(outfit.id)}
              onGenerateTryOn={() => handleGenerateTryOn(outfit, outfit.items || [])}
              onRegenerateTryOn={() => handleGenerateTryOn(outfit, outfit.items || [], true)}
              onSeeItems={() => handleSeeItems(outfit.items || [])}
              isDeleting={isDeleting}
              isGenerating={generatingOutfitId === outfit.id}
              hasPersonalModel={!!profile?.personalModelUrl}
            />
          ))}

          <View className="h-8" />
        </ScrollView>
      )}

      {/* Items Modal */}
      <Modal
        visible={showItemsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeItemsModal}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-cream-100 rounded-t-3xl" style={{ maxHeight: "70%" }}>
            {/* Modal Header */}
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-cream-200">
              <Text className="text-charcoal text-base tracking-wide">
                Outfit Items ({selectedOutfitItems.length})
              </Text>
              <Pressable onPress={closeItemsModal} className="p-2 active:opacity-50">
                <X size={20} color="#1A1A1A" strokeWidth={1.5} />
              </Pressable>
            </View>

            {/* Items Grid */}
            <ScrollView className="p-5">
              <View className="flex-row flex-wrap gap-3">
                {selectedOutfitItems.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => navigateToItem(item.id)}
                    className="bg-white border border-cream-200 overflow-hidden active:opacity-70"
                    style={{ width: "47%" }}
                  >
                    <View className="aspect-[3/4] bg-cream-100">
                      <Image
                        source={{ uri: item.isolatedImageUrl || item.imageUrl }}
                        contentFit="cover"
                        style={{ width: "100%", height: "100%" }}
                      />
                    </View>
                    <View className="p-2">
                      <Text className="text-[10px] tracking-widest text-charcoal-muted uppercase">
                        {item.category}
                      </Text>
                      <Text className="text-sm text-charcoal" numberOfLines={1}>
                        {item.subcategory}
                      </Text>
                      <Text className="text-xs text-charcoal-muted">{item.color}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>

              <View className="h-8" />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

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
import { ChevronLeft, Trash2, Check } from "lucide-react-native";
import { useWardrobe } from "@/hooks/useWardrobe";
import { updateItemGender } from "@/services/supabase";
import type { Gender } from "@/types/wardrobe";

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "unisex", label: "Unisex" },
];

export default function ItemDetailScreen() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const router = useRouter();
  const { items, deleteItem, refreshItems, isLoading: isLoadingWardrobe } = useWardrobe();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false); // Track intentional deletion
  const [isSavingGender, setIsSavingGender] = useState(false);
  const [selectedGender, setSelectedGender] = useState<Gender | null>(null);

  const item = items.find((i) => i.id === itemId);

  // Initialize selected gender from item
  useEffect(() => {
    if (item?.gender) {
      setSelectedGender(item.gender);
    }
  }, [item?.gender]);

  // Only show "Item Not Found" if not loading, item doesn't exist, AND we didn't just delete it
  useEffect(() => {
    if (!isLoadingWardrobe && !item && !isDeleting && !isDeleted) {
      Alert.alert("Item Not Found", "This item could not be found.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    }
  }, [item, isLoadingWardrobe, isDeleting, isDeleted, router]);

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
            setIsDeleted(true); // Mark as intentionally deleted
            try {
              await deleteItem(item.id);
              // Navigate back immediately on success - no alert needed
              router.back();
            } catch (error) {
              setIsDeleted(false); // Reset if deletion failed
              console.error("Delete error:", error);
              Alert.alert("Error", "Failed to remove item. Please try again.");
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleGenderChange = async (gender: Gender) => {
    if (!item || isSavingGender) return;

    const previousGender = selectedGender;
    setSelectedGender(gender);
    setIsSavingGender(true);

    try {
      await updateItemGender(item.id, gender);
      await refreshItems();
    } catch (error) {
      console.error("Error updating gender:", error);
      setSelectedGender(previousGender);
      Alert.alert("Error", "Failed to update gender. Please try again.");
    } finally {
      setIsSavingGender(false);
    }
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
              style={{ width: '100%', height: '100%' }}
              onError={(e) => console.log('Item detail image error:', e, item.isolatedImageUrl)}
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

          {/* Gender Selection */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-xs tracking-widest text-charcoal-muted uppercase">
                Fit Type
              </Text>
              {isSavingGender && (
                <ActivityIndicator size="small" color="#C4A77D" />
              )}
            </View>
            <View className="flex-row gap-2">
              {GENDER_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => handleGenderChange(option.value)}
                  disabled={isSavingGender}
                  className={`flex-1 py-3 flex-row items-center justify-center gap-2 border ${
                    selectedGender === option.value
                      ? "bg-charcoal border-charcoal"
                      : "bg-white border-cream-300"
                  } active:opacity-80`}
                >
                  {selectedGender === option.value && (
                    <Check size={14} color="#FFFFFF" strokeWidth={2} />
                  )}
                  <Text
                    className={`text-xs tracking-wide uppercase ${
                      selectedGender === option.value
                        ? "text-white"
                        : "text-charcoal"
                    }`}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text className="text-[10px] text-charcoal-muted mt-2">
              Helps match clothing to your profile for virtual try-on
            </Text>
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

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import {
  Camera,
  Image as ImageIcon,
  X,
  Check,
  Sparkles,
  CheckSquare,
  Square,
  ChevronRight,
} from "lucide-react-native";
import { useUploadItem, type DetectedItem } from "@/hooks/useUploadItem";
import { useWardrobe } from "@/hooks/useWardrobe";
import { Image } from "expo-image";

const UPLOAD_STEPS = [
  { key: "generating-images", label: "Generating" },
  { key: "uploading-images", label: "Uploading" },
  { key: "saving", label: "Saving" },
  { key: "complete", label: "Complete" },
];

// Category colors for visual distinction
const CATEGORY_COLORS: Record<string, string> = {
  Top: "#8B5CF6",
  Bottom: "#3B82F6",
  Shoes: "#10B981",
  Outerwear: "#F59E0B",
  Accessories: "#EC4899",
};

export default function UploadScreen() {
  const {
    analyzeImage,
    processSelectedItems,
    detectedItems,
    toggleItemSelection,
    selectAllItems,
    deselectAllItems,
    isLoading,
    isAnalyzing,
    isProcessing,
    currentStep,
    progress,
    error,
    resetError,
    resetState,
  } = useUploadItem();
  const { refreshItems } = useWardrobe();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [itemsCreated, setItemsCreated] = useState(0);

  const requestPermissions = async () => {
    const { status: cameraStatus } =
      await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== "granted" || mediaStatus !== "granted") {
      Alert.alert(
        "Permissions Required",
        "Camera and photo library permissions are required to upload items."
      );
      return false;
    }
    return true;
  };

  const pickImage = async (source: "camera" | "library") => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      let result: ImagePicker.ImagePickerResult;

      if (source === "camera") {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          allowsEditing: false, // No cropping - allow full outfit photos
          quality: 0.7,
          exif: false,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: false, // No cropping - allow full outfit photos
          quality: 0.7,
          exif: false,
        });
      }

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        setUploadSuccess(false);
        setItemsCreated(0);
        resetError();

        // Immediately analyze the image
        await analyzeImage(imageUri);
      }
    } catch (err) {
      console.error("Error picking image:", err);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const handleProcessItems = async () => {
    if (!selectedImage) return;

    const selectedCount = detectedItems.filter((i) => i.selected).length;
    if (selectedCount === 0) {
      Alert.alert("No Items Selected", "Please select at least one item to add.");
      return;
    }

    setUploadSuccess(false);
    setItemsCreated(0);
    resetError();

    const items = await processSelectedItems(selectedImage);

    if (items.length > 0) {
      setUploadSuccess(true);
      setItemsCreated(items.length);
      setSelectedImage(null);
      await refreshItems();

      const message =
        items.length === 1
          ? "1 item has been added to your closet."
          : `${items.length} items have been added to your closet.`;
      Alert.alert("Added", message);
    }
  };

  const clearSelection = () => {
    setSelectedImage(null);
    setUploadSuccess(false);
    setItemsCreated(0);
    resetState();
  };

  const getCurrentStepIndex = () => {
    return UPLOAD_STEPS.findIndex((s) => s.key === currentStep);
  };

  const selectedCount = detectedItems.filter((i) => i.selected).length;
  const allSelected = detectedItems.length > 0 && selectedCount === detectedItems.length;

  // Render individual detected item card
  const renderDetectedItem = (item: DetectedItem) => {
    const categoryColor = CATEGORY_COLORS[item.category] || "#6B6B6B";

    return (
      <Pressable
        key={item.id}
        onPress={() => toggleItemSelection(item.id)}
        className={`border p-3 mb-2 flex-row items-center ${
          item.selected
            ? "border-gold bg-gold/5"
            : "border-cream-300 bg-white"
        }`}
      >
        {/* Checkbox */}
        <View className="mr-3">
          {item.selected ? (
            <CheckSquare size={20} color="#C4A77D" strokeWidth={1.5} />
          ) : (
            <Square size={20} color="#6B6B6B" strokeWidth={1.5} />
          )}
        </View>

        {/* Category indicator */}
        <View
          style={{ backgroundColor: categoryColor }}
          className="w-1 h-10 mr-3 rounded-full"
        />

        {/* Item details */}
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-charcoal font-medium text-sm">
              {item.color} {item.subcategory}
            </Text>
          </View>
          <Text className="text-charcoal-muted text-xs mt-0.5">
            {item.category} · {item.material}
          </Text>
          {item.gender && item.gender !== "unisex" && (
            <Text className="text-charcoal-muted/70 text-[10px] uppercase tracking-wide mt-1">
              {item.gender}
            </Text>
          )}
        </View>

        {/* Attributes */}
        {item.attributes && item.attributes.length > 0 && (
          <View className="flex-row gap-1 flex-wrap max-w-[80px]">
            {item.attributes.slice(0, 2).map((attr, idx) => (
              <View key={idx} className="bg-cream-100 px-1.5 py-0.5 rounded">
                <Text className="text-[9px] text-charcoal-muted capitalize">
                  {attr}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-cream-100" edges={["bottom"]}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Minimal Header */}
        <View className="px-5 pt-2 pb-6">
          <Text className="text-xs tracking-widest text-charcoal-muted uppercase mb-2">
            Add to closet
          </Text>
          <Text className="text-charcoal text-sm leading-5">
            Capture your full outfit — choose which items to add
          </Text>
        </View>

        {/* Image Selection / Analysis */}
        <View className="px-5">
          {!selectedImage ? (
            <View className="border border-cream-300 bg-white p-8 items-center">
              <Sparkles size={32} color="#6B6B6B" strokeWidth={1} />
              <Text className="text-charcoal-muted text-xs tracking-wide uppercase mt-6 mb-2">
                Multi-item detection
              </Text>
              <Text className="text-charcoal-muted/70 text-xs text-center mb-8">
                Take a photo of your full outfit and we'll identify each piece
              </Text>

              <View className="flex-row gap-3 w-full">
                <Pressable
                  onPress={() => pickImage("camera")}
                  className="flex-1 bg-charcoal py-4 flex-row items-center justify-center gap-2 active:opacity-80"
                >
                  <Camera size={18} color="#FFFFFF" strokeWidth={1.5} />
                  <Text className="text-white text-xs tracking-widest uppercase">
                    Camera
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => pickImage("library")}
                  className="flex-1 border border-charcoal py-4 flex-row items-center justify-center gap-2 active:opacity-80"
                >
                  <ImageIcon size={18} color="#1A1A1A" strokeWidth={1.5} />
                  <Text className="text-charcoal text-xs tracking-widest uppercase">
                    Library
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View className="bg-white">
              {/* Image Preview */}
              <View className="relative" style={{ width: "100%", aspectRatio: 4 / 3 }}>
                <Image
                  source={{ uri: selectedImage }}
                  contentFit="contain"
                  style={{ width: "100%", height: "100%", backgroundColor: "#F5F3F0" }}
                />
                <Pressable
                  onPress={clearSelection}
                  className="absolute top-4 right-4 bg-white/90 p-2 active:opacity-80"
                >
                  <X size={20} color="#1A1A1A" strokeWidth={1.5} />
                </Pressable>
              </View>

              {/* Analyzing State */}
              {isAnalyzing && (
                <View className="p-6 items-center border-t border-cream-200">
                  <ActivityIndicator size="small" color="#C4A77D" />
                  <Text className="text-charcoal-muted text-xs tracking-wide uppercase mt-3">
                    Detecting clothing items...
                  </Text>
                </View>
              )}

              {/* Item Selection */}
              {!isAnalyzing && detectedItems.length > 0 && !isProcessing && (
                <View className="p-4 border-t border-cream-200">
                  {/* Selection Header */}
                  <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-xs tracking-widest text-charcoal-muted uppercase">
                      {detectedItems.length} item{detectedItems.length !== 1 ? "s" : ""} detected
                    </Text>
                    <Pressable
                      onPress={allSelected ? deselectAllItems : selectAllItems}
                      className="flex-row items-center gap-1.5"
                    >
                      {allSelected ? (
                        <CheckSquare size={14} color="#C4A77D" strokeWidth={1.5} />
                      ) : (
                        <Square size={14} color="#6B6B6B" strokeWidth={1.5} />
                      )}
                      <Text className="text-xs text-charcoal-muted">
                        {allSelected ? "Deselect all" : "Select all"}
                      </Text>
                    </Pressable>
                  </View>

                  {/* Item List */}
                  <View className="mb-4">
                    {detectedItems.map(renderDetectedItem)}
                  </View>

                  {/* Add Selected Button */}
                  <Pressable
                    onPress={handleProcessItems}
                    disabled={selectedCount === 0}
                    className={`py-4 flex-row items-center justify-center gap-2 ${
                      selectedCount === 0
                        ? "bg-cream-200"
                        : "bg-charcoal active:opacity-80"
                    }`}
                  >
                    <Sparkles
                      size={16}
                      color={selectedCount === 0 ? "#6B6B6B" : "#FFFFFF"}
                      strokeWidth={1.5}
                    />
                    <Text
                      className={`text-xs tracking-widest uppercase ${
                        selectedCount === 0 ? "text-charcoal-muted" : "text-white"
                      }`}
                    >
                      {selectedCount === 0
                        ? "Select items to add"
                        : `Add ${selectedCount} item${selectedCount !== 1 ? "s" : ""}`}
                    </Text>
                    {selectedCount > 0 && (
                      <ChevronRight size={14} color="#FFFFFF" strokeWidth={1.5} />
                    )}
                  </Pressable>
                </View>
              )}

              {/* Processing Progress */}
              {isProcessing && (
                <View className="p-4 border-t border-cream-200">
                  {/* Item Progress */}
                  <View className="mb-4">
                    <Text className="text-xs tracking-wide text-charcoal-muted text-center mb-2">
                      Generating image {progress.currentItem} of {progress.totalItems}
                    </Text>
                    <View className="h-1.5 bg-cream-200 rounded-full overflow-hidden">
                      <View
                        className="h-full bg-gold rounded-full"
                        style={{
                          width: `${(progress.currentItem / progress.totalItems) * 100}%`,
                        }}
                      />
                    </View>
                  </View>

                  {/* Step indicators */}
                  <View className="flex-row justify-between">
                    {UPLOAD_STEPS.map((step, index) => {
                      const currentIndex = getCurrentStepIndex();
                      const isActive = currentStep === step.key;
                      const isComplete = currentIndex > index;

                      return (
                        <View key={step.key} className="items-center flex-1">
                          <View
                            className={`w-6 h-6 rounded-full items-center justify-center mb-2 ${
                              isActive
                                ? "bg-gold"
                                : isComplete
                                  ? "bg-charcoal"
                                  : "bg-cream-200"
                            }`}
                          >
                            {isComplete ? (
                              <Check size={12} color="#FFFFFF" />
                            ) : (
                              <Text
                                className={`text-xs ${
                                  isActive ? "text-white" : "text-charcoal-muted"
                                }`}
                              >
                                {index + 1}
                              </Text>
                            )}
                          </View>
                          <Text
                            className={`text-[9px] tracking-wide uppercase ${
                              isActive
                                ? "text-gold-dark"
                                : isComplete
                                  ? "text-charcoal"
                                  : "text-charcoal-muted"
                            }`}
                          >
                            {step.label}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* No Items Detected */}
              {!isAnalyzing && !isProcessing && detectedItems.length === 0 && !error && (
                <View className="p-6 items-center border-t border-cream-200">
                  <Text className="text-charcoal-muted text-sm text-center">
                    No clothing items detected. Try a different photo.
                  </Text>
                  <Pressable
                    onPress={clearSelection}
                    className="mt-4 py-2 px-4 border border-charcoal"
                  >
                    <Text className="text-charcoal text-xs tracking-widest uppercase">
                      Try Another Photo
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}

          {/* Error Message */}
          {error && (
            <View className="mt-4 p-4 border border-charcoal/20 bg-white">
              <Text className="text-charcoal text-sm mb-3">{error}</Text>
              <Pressable onPress={clearSelection} className="py-2">
                <Text className="text-gold-dark text-xs tracking-widest uppercase text-center">
                  Try Another Photo
                </Text>
              </Pressable>
            </View>
          )}

          {/* Success Message */}
          {uploadSuccess && (
            <View className="mt-4 p-4 border border-gold/30 bg-gold/5">
              <Text className="text-charcoal text-sm text-center">
                {itemsCreated === 1
                  ? "1 item added successfully"
                  : `${itemsCreated} items added successfully`}
              </Text>
            </View>
          )}

          {/* How it works */}
          <View className="mt-8 mb-8">
            <Text className="text-xs tracking-widest text-charcoal-muted uppercase mb-4">
              How it works
            </Text>
            <View className="gap-3">
              <View className="flex-row items-center gap-3">
                <Text className="text-charcoal-muted text-xs">01</Text>
                <Text className="text-charcoal text-sm">
                  AI detects all clothing items
                </Text>
              </View>
              <View className="flex-row items-center gap-3">
                <Text className="text-charcoal-muted text-xs">02</Text>
                <Text className="text-charcoal text-sm">
                  Select which items you want to add
                </Text>
              </View>
              <View className="flex-row items-center gap-3">
                <Text className="text-charcoal-muted text-xs">03</Text>
                <Text className="text-charcoal text-sm">
                  Clean product images are generated
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

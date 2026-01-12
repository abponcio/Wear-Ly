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
import { Camera, Image as ImageIcon, X, Check } from "lucide-react-native";
import { useUploadItem } from "@/hooks/useUploadItem";
import { useWardrobe } from "@/hooks/useWardrobe";
import { Image } from "expo-image";

const UPLOAD_STEPS = [
  { key: "analyzing", label: "Analyzing" },
  { key: "removing-background", label: "Processing" },
  { key: "uploading-images", label: "Uploading" },
  { key: "saving", label: "Saving" },
  { key: "complete", label: "Complete" },
];

export default function UploadScreen() {
  const { uploadItem, isLoading, currentStep, error, resetError } =
    useUploadItem();
  const { refreshItems } = useWardrobe();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

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
          allowsEditing: true,
          aspect: [3, 4], // Portrait aspect ratio for clothing
          quality: 0.7,
          exif: false,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [3, 4], // Portrait aspect ratio for clothing
          quality: 0.7,
          exif: false,
        });
      }

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        setUploadSuccess(false);
        resetError();
      }
    } catch (err) {
      console.error("Error picking image:", err);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const handleUpload = async () => {
    if (!selectedImage) {
      Alert.alert("No Image", "Please select an image first.");
      return;
    }

    setUploadSuccess(false);
    resetError();

    const item = await uploadItem(selectedImage);

    if (item) {
      setUploadSuccess(true);
      setSelectedImage(null);
      await refreshItems();
      Alert.alert("Added", "Item has been added to your closet.");
    }
  };

  const clearSelection = () => {
    setSelectedImage(null);
    setUploadSuccess(false);
    resetError();
  };

  const getCurrentStepIndex = () => {
    return UPLOAD_STEPS.findIndex((s) => s.key === currentStep);
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
            Photograph your item for AI analysis
          </Text>
        </View>

        {/* Image Selection */}
        <View className="px-5">
          {!selectedImage ? (
            <View className="border border-cream-300 bg-white p-8 items-center">
              <ImageIcon size={32} color="#6B6B6B" strokeWidth={1} />
              <Text className="text-charcoal-muted text-xs tracking-wide uppercase mt-6 mb-8">
                No image selected
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
              <View className="relative" style={{ width: '100%', aspectRatio: 1 }}>
                <Image
                  source={{ uri: selectedImage }}
                  contentFit="contain"
                  style={{ width: '100%', height: '100%', backgroundColor: '#F5F3F0' }}
                />
                <Pressable
                  onPress={clearSelection}
                  className="absolute top-4 right-4 bg-white/90 p-2 active:opacity-80"
                >
                  <X size={20} color="#1A1A1A" strokeWidth={1.5} />
                </Pressable>
              </View>

              {/* Upload Button */}
              <Pressable
                onPress={handleUpload}
                disabled={isLoading}
                className={`py-4 flex-row items-center justify-center gap-2 ${
                  isLoading ? "bg-cream-200" : "bg-charcoal active:opacity-80"
                }`}
              >
                {isLoading ? (
                  <>
                    <ActivityIndicator color="#1A1A1A" size="small" />
                    <Text className="text-charcoal text-xs tracking-widest uppercase">
                      Processing...
                    </Text>
                  </>
                ) : (
                  <Text className="text-white text-xs tracking-widest uppercase">
                    Add to Closet
                  </Text>
                )}
              </Pressable>

              {/* Progress Steps */}
              {isLoading && currentStep !== "idle" && (
                <View className="p-4 border-t border-cream-200">
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
            </View>
          )}

          {/* Error Message */}
          {error && (
            <View className="mt-4 p-4 border border-charcoal/20 bg-white">
              <Text className="text-charcoal text-sm mb-3">{error}</Text>
              <Pressable
                onPress={() => selectedImage && handleUpload()}
                className="py-2"
              >
                <Text className="text-gold-dark text-xs tracking-widest uppercase text-center">
                  Try Again
                </Text>
              </Pressable>
            </View>
          )}

          {/* Success Message */}
          {uploadSuccess && (
            <View className="mt-4 p-4 border border-gold/30 bg-gold/5">
              <Text className="text-charcoal text-sm text-center">
                Item added successfully
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
                <Text className="text-charcoal text-sm">AI analyzes your item</Text>
              </View>
              <View className="flex-row items-center gap-3">
                <Text className="text-charcoal-muted text-xs">02</Text>
                <Text className="text-charcoal text-sm">
                  Background is removed
                </Text>
              </View>
              <View className="flex-row items-center gap-3">
                <Text className="text-charcoal-muted text-xs">03</Text>
                <Text className="text-charcoal text-sm">
                  Added to your closet
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

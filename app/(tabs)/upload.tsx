import React, { useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Camera, Image as ImageIcon, Upload, X } from "lucide-react-native";
import { useUploadItem } from "@/hooks/useUploadItem";
import { useWardrobe } from "@/hooks/useWardrobe";
import { Image } from "expo-image";

export default function UploadScreen() {
  const { uploadItem, isLoading, error, resetError } = useUploadItem();
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
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
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
      // Refresh wardrobe items
      await refreshItems();
      Alert.alert("Success", "Item uploaded successfully!");
    }
  };

  const clearSelection = () => {
    setSelectedImage(null);
    setUploadSuccess(false);
    resetError();
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="bg-white px-4 py-4 border-b border-gray-200">
          <View className="flex-row items-center gap-2 mb-2">
            <Upload size={24} color="#6366F1" />
            <Text className="text-2xl font-bold text-gray-900">Upload Item</Text>
          </View>
          <Text className="text-sm text-gray-500">
            Add a new item to your wardrobe with AI-powered analysis
          </Text>
        </View>

        {/* Image Selection */}
        <View className="px-4 py-4">
          {!selectedImage ? (
            <View className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8 items-center">
              <ImageIcon size={48} color="#9CA3AF" />
              <Text className="text-gray-600 font-medium mt-4 mb-2">
                No image selected
              </Text>
              <Text className="text-gray-500 text-sm text-center mb-4">
                Choose an image to analyze and add to your wardrobe
              </Text>

              <View className="flex-row gap-3 w-full">
                <Pressable
                  onPress={() => pickImage("camera")}
                  className="flex-1 bg-indigo-600 py-3 rounded-lg flex-row items-center justify-center gap-2 active:bg-indigo-700"
                >
                  <Camera size={20} color="#FFFFFF" />
                  <Text className="text-white font-semibold">Camera</Text>
                </Pressable>

                <Pressable
                  onPress={() => pickImage("library")}
                  className="flex-1 bg-gray-700 py-3 rounded-lg flex-row items-center justify-center gap-2 active:bg-gray-800"
                >
                  <ImageIcon size={20} color="#FFFFFF" />
                  <Text className="text-white font-semibold">Gallery</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View className="bg-white rounded-lg p-4">
              <View className="relative">
                <Image
                  source={{ uri: selectedImage }}
                  contentFit="cover"
                  className="w-full aspect-square rounded-lg"
                />
                <Pressable
                  onPress={clearSelection}
                  className="absolute top-2 right-2 bg-black/50 rounded-full p-2"
                >
                  <X size={20} color="#FFFFFF" />
                </Pressable>
              </View>

              {/* Upload Button */}
              <Pressable
                onPress={handleUpload}
                disabled={isLoading}
                className={`mt-4 py-3 rounded-lg flex-row items-center justify-center gap-2 ${
                  isLoading
                    ? "bg-gray-300"
                    : "bg-indigo-600 active:bg-indigo-700"
                }`}
              >
                {isLoading ? (
                  <>
                    <ActivityIndicator color="#FFFFFF" />
                    <Text className="text-white font-semibold">
                      Processing...
                    </Text>
                  </>
                ) : (
                  <>
                    <Upload size={20} color="#FFFFFF" />
                    <Text className="text-white font-semibold text-base">
                      Upload & Analyze
                    </Text>
                  </>
                )}
              </Pressable>

              {isLoading && (
                <Text className="text-gray-500 text-xs text-center mt-2">
                  Analyzing image, removing background, and uploading...
                </Text>
              )}
            </View>
          )}

          {/* Error Message */}
          {error && (
            <View className="bg-red-50 border border-red-200 mt-4 p-3 rounded-lg">
              <Text className="text-red-700 text-sm">{error}</Text>
            </View>
          )}

          {/* Success Message */}
          {uploadSuccess && (
            <View className="bg-green-50 border border-green-200 mt-4 p-3 rounded-lg">
              <Text className="text-green-700 text-sm">
                Item uploaded successfully! Check your wardrobe to see it.
              </Text>
            </View>
          )}

          {/* Info Section */}
          <View className="bg-blue-50 border border-blue-200 mt-4 p-4 rounded-lg">
            <Text className="text-blue-900 font-semibold mb-2">
              How it works:
            </Text>
            <View className="gap-1">
              <Text className="text-blue-800 text-sm">
                1. AI analyzes your clothing item
              </Text>
              <Text className="text-blue-800 text-sm">
                2. Background is automatically removed
              </Text>
              <Text className="text-blue-800 text-sm">
                3. Item is added to your wardrobe
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

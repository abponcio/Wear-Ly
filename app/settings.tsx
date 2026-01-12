import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  ChevronLeft,
  Camera,
  User,
  LogOut,
  Check,
  Sparkles,
} from "lucide-react-native";
import { Image } from "expo-image";
import { supabase, getUserProfile, updateUserProfile, uploadPersonalModelImage } from "@/services/supabase";
import { generatePersonalModel } from "@/services/gemini";
import type { UserProfile, ProfileGender } from "@/types/wardrobe";

const GENDER_OPTIONS: { value: ProfileGender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "non-binary", label: "Non-binary" },
];

export default function SettingsScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingModel, setIsGeneratingModel] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedGender, setSelectedGender] = useState<ProfileGender | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const userProfile = await getUserProfile();
      setProfile(userProfile);
      setSelectedGender(userProfile?.gender || null);
    } catch (error) {
      console.error("Error loading profile:", error);
      Alert.alert("Error", "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleGenderChange = async (gender: ProfileGender) => {
    setSelectedGender(gender);
    setIsSaving(true);
    try {
      await updateUserProfile({ gender });
      setProfile(prev => prev ? { ...prev, gender } : null);
    } catch (error) {
      console.error("Error updating gender:", error);
      Alert.alert("Error", "Failed to update gender preference");
      setSelectedGender(profile?.gender || null);
    } finally {
      setIsSaving(false);
    }
  };

  const pickAndGenerateModel = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Photo library access is needed to select a photo.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      setIsGeneratingModel(true);
      const userPhotoUri = result.assets[0].uri;

      // Generate personal model image
      console.log("[Settings] Generating personal model...");
      const generatedModelUri = await generatePersonalModel(userPhotoUri);

      // Upload to Supabase storage
      console.log("[Settings] Uploading personal model...");
      const personalModelUrl = await uploadPersonalModelImage(generatedModelUri);

      // Update profile with new URL
      console.log("[Settings] Updating profile...");
      await updateUserProfile({ personal_model_url: personalModelUrl });

      // Refresh profile
      await loadProfile();

      Alert.alert("Success", "Your personal model has been created!");
    } catch (error) {
      console.error("Error generating personal model:", error);
      Alert.alert("Error", "Failed to generate personal model. Please try again.");
    } finally {
      setIsGeneratingModel(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            await supabase.auth.signOut();
            router.replace("/(auth)/signin");
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-cream-100 items-center justify-center">
        <ActivityIndicator size="large" color="#1A1A1A" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-cream-100" edges={["top", "bottom"]}>
      {/* Header */}
      <View className="flex-row items-center px-5 py-4 border-b border-cream-200">
        <Pressable
          onPress={() => router.back()}
          className="mr-4 active:opacity-60"
        >
          <ChevronLeft size={24} color="#1A1A1A" strokeWidth={1.5} />
        </Pressable>
        <Text className="text-charcoal text-lg tracking-wide">Settings</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Personal Model Section */}
        <View className="px-5 py-6 border-b border-cream-200">
          <View className="flex-row items-center gap-2 mb-2">
            <Sparkles size={16} color="#C4A77D" strokeWidth={1.5} />
            <Text className="text-xs tracking-widest text-charcoal-muted uppercase">
              Virtual Try-On Model
            </Text>
          </View>
          <Text className="text-charcoal text-sm mb-6">
            Upload your photo to create a personalized model for virtual try-on
          </Text>

          {/* Model Preview */}
          <View className="items-center mb-6">
            {profile?.personalModelUrl ? (
              <View className="relative">
                <View
                  className="bg-cream-200 overflow-hidden"
                  style={{ width: 200, height: 267, borderRadius: 4 }}
                >
                  <Image
                    source={{ uri: profile.personalModelUrl }}
                    contentFit="cover"
                    style={{ width: "100%", height: "100%" }}
                  />
                </View>
                <View className="absolute bottom-2 right-2 bg-charcoal/80 px-2 py-1 rounded">
                  <Text className="text-white text-[10px] tracking-wide uppercase">
                    Your Model
                  </Text>
                </View>
              </View>
            ) : (
              <View
                className="bg-cream-200 items-center justify-center"
                style={{ width: 200, height: 267, borderRadius: 4 }}
              >
                <User size={48} color="#6B6B6B" strokeWidth={1} />
                <Text className="text-charcoal-muted text-xs mt-3 text-center">
                  No model created yet
                </Text>
              </View>
            )}
          </View>

          {/* Generate Model Button */}
          <Pressable
            onPress={pickAndGenerateModel}
            disabled={isGeneratingModel}
            className={`py-4 flex-row items-center justify-center gap-2 ${
              isGeneratingModel ? "bg-cream-200" : "bg-charcoal active:opacity-80"
            }`}
          >
            {isGeneratingModel ? (
              <>
                <ActivityIndicator size="small" color="#1A1A1A" />
                <Text className="text-charcoal text-xs tracking-widest uppercase">
                  Generating Model...
                </Text>
              </>
            ) : (
              <>
                <Camera size={18} color="#FFFFFF" strokeWidth={1.5} />
                <Text className="text-white text-xs tracking-widest uppercase">
                  {profile?.personalModelUrl ? "Update Photo" : "Create Model"}
                </Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Gender Selection Section */}
        <View className="px-5 py-6 border-b border-cream-200">
          <Text className="text-xs tracking-widest text-charcoal-muted uppercase mb-2">
            Clothing Preference
          </Text>
          <Text className="text-charcoal text-sm mb-4">
            This helps us suggest appropriate clothing for you
          </Text>

          <View className="gap-2">
            {GENDER_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => handleGenderChange(option.value)}
                disabled={isSaving}
                className={`flex-row items-center justify-between py-4 px-4 border ${
                  selectedGender === option.value
                    ? "border-charcoal bg-cream-50"
                    : "border-cream-300 bg-white"
                } active:opacity-80`}
              >
                <Text className="text-charcoal text-sm">{option.label}</Text>
                {selectedGender === option.value && (
                  <Check size={18} color="#1A1A1A" strokeWidth={2} />
                )}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Sign Out Section */}
        <View className="px-5 py-6">
          <Pressable
            onPress={handleSignOut}
            className="py-4 flex-row items-center justify-center gap-2 border border-charcoal/30 active:opacity-80"
          >
            <LogOut size={18} color="#6B6B6B" strokeWidth={1.5} />
            <Text className="text-charcoal-muted text-xs tracking-widest uppercase">
              Sign Out
            </Text>
          </Pressable>
        </View>

        {/* How it works */}
        <View className="px-5 pb-8">
          <Text className="text-xs tracking-widest text-charcoal-muted uppercase mb-4">
            How Virtual Try-On Works
          </Text>
          <View className="gap-3">
            <View className="flex-row items-start gap-3">
              <Text className="text-charcoal-muted text-xs">01</Text>
              <Text className="text-charcoal text-sm flex-1">
                Upload your photo to create a personal model
              </Text>
            </View>
            <View className="flex-row items-start gap-3">
              <Text className="text-charcoal-muted text-xs">02</Text>
              <Text className="text-charcoal text-sm flex-1">
                AI transforms you into a studio-ready fashion model
              </Text>
            </View>
            <View className="flex-row items-start gap-3">
              <Text className="text-charcoal-muted text-xs">03</Text>
              <Text className="text-charcoal text-sm flex-1">
                Try on any outfit from your closet virtually
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

import React, { useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { Image } from "expo-image";
import { LogIn, Mail, Lock } from "lucide-react-native";
import { supabase } from "@/services/supabase";

export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        Alert.alert("Sign In Failed", error.message);
        return;
      }

      // Navigate to main app
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred");
      console.error("Sign in error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow justify-center px-6"
          keyboardShouldPersistTaps="handled"
        >
          <View className="items-center mb-8">
            {/* Logo */}
            <View className="mb-4">
              <Image
                source={require("@/assets/logo.png")}
                contentFit="contain"
                style={{ width: 120, height: 120 }}
                transition={200}
              />
            </View>
            <Text className="text-3xl font-bold text-gray-900 mt-2">
              Welcome Back
            </Text>
            <Text className="text-gray-500 text-center mt-2">
              Sign in to access your wardrobe
            </Text>
          </View>

          <View className="space-y-4">
            {/* Email Input */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Email
              </Text>
              <View className="flex-row items-center bg-white border border-gray-300 rounded-lg px-3 py-3">
                <Mail size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-3 text-gray-900"
                  placeholder="your@email.com"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />
              </View>
            </View>

            {/* Password Input */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Password
              </Text>
              <View className="flex-row items-center bg-white border border-gray-300 rounded-lg px-3 py-3">
                <Lock size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-3 text-gray-900"
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="password"
                />
              </View>
            </View>

            {/* Sign In Button */}
            <Pressable
              onPress={handleSignIn}
              disabled={isLoading}
              className={`py-3 rounded-lg flex-row items-center justify-center gap-2 mt-4 ${
                isLoading
                  ? "bg-gray-300"
                  : "bg-indigo-600 active:bg-indigo-700"
              }`}
            >
              {isLoading ? (
                <>
                  <ActivityIndicator color="#FFFFFF" />
                  <Text className="text-white font-semibold text-base">
                    Signing in...
                  </Text>
                </>
              ) : (
                <>
                  <LogIn size={20} color="#FFFFFF" />
                  <Text className="text-white font-semibold text-base">
                    Sign In
                  </Text>
                </>
              )}
            </Pressable>

            {/* Sign Up Link */}
            <View className="flex-row justify-center items-center mt-4">
              <Text className="text-gray-600">Don't have an account? </Text>
              <Link href="/(auth)/signup" asChild>
                <Pressable>
                  <Text className="text-indigo-600 font-semibold">
                    Sign Up
                  </Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

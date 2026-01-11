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
import { UserPlus, Mail, Lock } from "lucide-react-native";
import { supabase } from "@/services/supabase";

export default function SignUpScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        Alert.alert("Sign Up Failed", error.message);
        return;
      }

      Alert.alert(
        "Success",
        "Account created! Please check your email to verify your account.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/(auth)/signin"),
          },
        ]
      );
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred");
      console.error("Sign up error:", error);
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
            <UserPlus size={64} color="#6366F1" />
            <Text className="text-3xl font-bold text-gray-900 mt-4">
              Create Account
            </Text>
            <Text className="text-gray-500 text-center mt-2">
              Start building your AI-powered wardrobe
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
                  placeholder="At least 6 characters"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="password-new"
                />
              </View>
            </View>

            {/* Confirm Password Input */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </Text>
              <View className="flex-row items-center bg-white border border-gray-300 rounded-lg px-3 py-3">
                <Lock size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-3 text-gray-900"
                  placeholder="Confirm your password"
                  placeholderTextColor="#9CA3AF"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="password-new"
                />
              </View>
            </View>

            {/* Sign Up Button */}
            <Pressable
              onPress={handleSignUp}
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
                    Creating account...
                  </Text>
                </>
              ) : (
                <>
                  <UserPlus size={20} color="#FFFFFF" />
                  <Text className="text-white font-semibold text-base">
                    Sign Up
                  </Text>
                </>
              )}
            </Pressable>

            {/* Sign In Link */}
            <View className="flex-row justify-center items-center mt-4">
              <Text className="text-gray-600">Already have an account? </Text>
              <Link href="/(auth)/signin" asChild>
                <Pressable>
                  <Text className="text-indigo-600 font-semibold">
                    Sign In
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

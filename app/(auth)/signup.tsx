import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, useRouter } from "expo-router";
import { Image } from "expo-image";
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
        "Account Created",
        "Please check your email to verify your account.",
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
    <SafeAreaView className="flex-1 bg-cream-100">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow justify-center px-8"
          keyboardShouldPersistTaps="handled"
        >
          <View className="items-center mb-10">
            {/* Logo */}
            <View className="mb-6">
              <Image
                source={require("@/assets/logo.png")}
                contentFit="contain"
                style={{ width: 100, height: 100 }}
                transition={200}
              />
            </View>
            <Text className="text-2xl font-light text-charcoal tracking-wide">
              Create Account
            </Text>
            <Text className="text-charcoal-muted text-sm text-center mt-2">
              Build your AI-powered closet
            </Text>
          </View>

          <View className="gap-5">
            {/* Email Input */}
            <View>
              <Text className="text-xs tracking-widest text-charcoal-muted uppercase mb-2">
                Email
              </Text>
              <View className="bg-white border border-cream-300 px-4 py-4">
                <TextInput
                  className="text-charcoal text-base"
                  placeholder="your@email.com"
                  placeholderTextColor="#6B6B6B"
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
              <Text className="text-xs tracking-widest text-charcoal-muted uppercase mb-2">
                Password
              </Text>
              <View className="bg-white border border-cream-300 px-4 py-4">
                <TextInput
                  className="text-charcoal text-base"
                  placeholder="At least 6 characters"
                  placeholderTextColor="#6B6B6B"
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
              <Text className="text-xs tracking-widest text-charcoal-muted uppercase mb-2">
                Confirm Password
              </Text>
              <View className="bg-white border border-cream-300 px-4 py-4">
                <TextInput
                  className="text-charcoal text-base"
                  placeholder="Confirm your password"
                  placeholderTextColor="#6B6B6B"
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
              className={`py-4 flex-row items-center justify-center mt-4 ${
                isLoading ? "bg-cream-200" : "bg-charcoal active:opacity-80"
              }`}
            >
              {isLoading ? (
                <>
                  <ActivityIndicator color="#1A1A1A" size="small" />
                  <Text className="text-charcoal text-xs tracking-widest uppercase ml-2">
                    Creating...
                  </Text>
                </>
              ) : (
                <Text className="text-white text-xs tracking-widest uppercase">
                  Create Account
                </Text>
              )}
            </Pressable>

            {/* Sign In Link */}
            <View className="flex-row justify-center items-center mt-6">
              <Text className="text-charcoal-muted text-sm">
                Already have an account?{" "}
              </Text>
              <Link href="/(auth)/signin" asChild>
                <Pressable>
                  <Text className="text-gold-dark text-sm underline">
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

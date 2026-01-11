import { Tabs, useRouter } from "expo-router";
import { Pressable } from "react-native";
import { LogOut, Shirt, Upload, Sparkles } from "lucide-react-native";
import { supabase } from "@/services/supabase";

export default function TabLayout() {
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/(auth)/signin");
  };

  return (
    <Tabs
      screenOptions={{
        headerRight: () => (
          <Pressable onPress={handleSignOut} className="mr-4 p-2">
            <LogOut size={20} color="#6366F1" />
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Wardrobe",
          tabBarIcon: ({ color, size }) => (
            <Shirt size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="upload"
        options={{
          title: "Upload",
          tabBarIcon: ({ color, size }) => (
            <Upload size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ootd"
        options={{
          title: "OOTD",
          tabBarIcon: ({ color, size }) => (
            <Sparkles size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

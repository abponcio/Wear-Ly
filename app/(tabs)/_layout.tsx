import { Tabs, useRouter } from "expo-router";
import { Pressable } from "react-native";
import { LogOut } from "lucide-react-native";
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
        }}
      />
      <Tabs.Screen
        name="upload"
        options={{
          title: "Upload",
        }}
      />
      <Tabs.Screen
        name="ootd"
        options={{
          title: "OOTD",
        }}
      />
    </Tabs>
  );
}

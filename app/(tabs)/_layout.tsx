import { Tabs, useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { Settings, Shirt, Plus, Sparkles } from "lucide-react-native";

export default function TabLayout() {
  const router = useRouter();

  const handleOpenSettings = () => {
    router.push("/settings");
  };

  return (
    <Tabs
      screenOptions={{
        // Header styling - minimal Zara aesthetic
        headerStyle: {
          backgroundColor: "#FAF9F7",
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTitleStyle: {
          color: "#1A1A1A",
          fontSize: 16,
          fontWeight: "400",
          letterSpacing: 2,
          textTransform: "uppercase",
        },
        headerTintColor: "#1A1A1A",
        headerRight: () => (
          <Pressable
            onPress={handleOpenSettings}
            className="mr-4 p-2 active:opacity-50"
          >
            <Settings size={20} color="#1A1A1A" strokeWidth={1.5} />
          </Pressable>
        ),
        // Tab bar styling - glassmorphism
        tabBarStyle: {
          position: "absolute",
          backgroundColor: "rgba(255, 255, 255, 0.85)",
          borderTopWidth: 0,
          elevation: 0,
          height: 85,
          paddingBottom: 25,
          paddingTop: 10,
        },
        tabBarActiveTintColor: "#1A1A1A",
        tabBarInactiveTintColor: "#6B6B6B",
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "500",
          letterSpacing: 1.5,
          textTransform: "uppercase",
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Closet",
          tabBarIcon: ({ color, focused }) => (
            <Shirt
              size={22}
              color={color}
              strokeWidth={focused ? 1.8 : 1.2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="upload"
        options={{
          title: "Add",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                backgroundColor: focused ? "#1A1A1A" : "transparent",
                borderRadius: 20,
                padding: 8,
                borderWidth: focused ? 0 : 1,
                borderColor: "#1A1A1A",
              }}
            >
              <Plus
                size={18}
                color={focused ? "#FFFFFF" : color}
                strokeWidth={1.5}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="ootd"
        options={{
          title: "Style",
          tabBarIcon: ({ color, focused }) => (
            <Sparkles
              size={22}
              color={color}
              strokeWidth={focused ? 1.8 : 1.2}
            />
          ),
        }}
      />
    </Tabs>
  );
}

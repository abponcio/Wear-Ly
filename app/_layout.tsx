import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import "../global.css";
import { supabase } from "@/services/supabase";

export default function RootLayout() {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Check authentication state
    supabase.auth.getSession().then(({ data: { session } }) => {
      const inAuthGroup = segments[0] === "(auth)";
      const inTabsGroup = segments[0] === "(tabs)";

      if (!session && !inAuthGroup) {
        // Redirect to sign in if not authenticated
        router.replace("/(auth)/signin");
      } else if (session && inAuthGroup) {
        // Redirect to tabs if authenticated
        router.replace("/(tabs)");
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const inAuthGroup = segments[0] === "(auth)";
      const inTabsGroup = segments[0] === "(tabs)";

      if (!session && !inAuthGroup) {
        router.replace("/(auth)/signin");
      } else if (session && inAuthGroup) {
        router.replace("/(tabs)");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [segments, router]);

  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

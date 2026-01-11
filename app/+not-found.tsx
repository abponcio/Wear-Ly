import { Link, Stack } from 'expo-router';
import { View, Text } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops! Not Found' }} />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>This screen doesn't exist.</Text>
        <Link href="/">
          <Text>Go to home screen</Text>
        </Link>
      </View>
    </>
  );
}

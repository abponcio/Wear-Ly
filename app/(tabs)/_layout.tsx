import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Wardrobe',
        }}
      />
      <Tabs.Screen
        name="upload"
        options={{
          title: 'Upload',
        }}
      />
      <Tabs.Screen
        name="ootd"
        options={{
          title: 'OOTD',
        }}
      />
    </Tabs>
  );
}

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import {
  ArrowLeft,
  Trash2,
  Shirt,
  Palette,
  Tag,
  Calendar,
  Edit,
} from 'lucide-react-native';
import { useWardrobe } from '@/hooks/useWardrobe';
import type { WardrobeItem } from '@/types/wardrobe';

export default function ItemDetailScreen() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const router = useRouter();
  const { items, deleteItem, isLoading: isLoadingWardrobe } = useWardrobe();
  const [isDeleting, setIsDeleting] = useState(false);

  const item = items.find((i) => i.id === itemId);

  useEffect(() => {
    if (!isLoadingWardrobe && !item) {
      Alert.alert('Item Not Found', 'This item could not be found.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  }, [item, isLoadingWardrobe, router]);

  const handleDelete = () => {
    if (!item) return;

    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item from your wardrobe? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteItem(item.id);
              Alert.alert('Success', 'Item deleted successfully.', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (error) {
              Alert.alert(
                'Error',
                'Failed to delete item. Please try again.',
                [{ text: 'OK' }]
              );
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (isLoadingWardrobe) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#6366F1" />
          <Text className="text-gray-500 mt-4">Loading item...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!item) {
    return null; // Alert will handle navigation
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-200 flex-row items-center justify-between">
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center"
        >
          <ArrowLeft size={24} color="#374151" />
        </Pressable>
        <Text className="text-lg font-semibold text-gray-900">Item Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView className="flex-1">
        {/* Image Section */}
        <View className="bg-white mb-2">
          <View className="w-full aspect-square bg-gray-100">
            <Image
              source={{ uri: item.isolatedImageUrl || item.imageUrl }}
              contentFit="contain"
              transition={200}
              className="w-full h-full"
            />
          </View>
        </View>

        {/* Details Section */}
        <View className="bg-white px-4 py-4 mb-2">
          {/* Category & Subcategory */}
          <View className="mb-4">
            <View className="flex-row items-center mb-2">
              <Shirt size={18} color="#6B7280" />
              <Text className="text-xs font-semibold text-gray-600 uppercase tracking-wide ml-2">
                {item.category}
              </Text>
            </View>
            <Text className="text-2xl font-bold text-gray-900 mb-1">
              {item.subcategory}
            </Text>
          </View>

          {/* Color & Material */}
          <View className="flex-row flex-wrap gap-3 mb-4">
            <View className="flex-row items-center bg-blue-50 px-3 py-2 rounded-lg">
              <Palette size={16} color="#3B82F6" />
              <Text className="text-sm text-blue-700 font-medium ml-2">
                {item.color}
              </Text>
            </View>
            <View className="flex-row items-center bg-purple-50 px-3 py-2 rounded-lg">
              <Tag size={16} color="#9333EA" />
              <Text className="text-sm text-purple-700 font-medium ml-2">
                {item.material}
              </Text>
            </View>
          </View>

          {/* Attributes */}
          {item.attributes && item.attributes.length > 0 && (
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Attributes
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {item.attributes.map((attr, index) => (
                  <View
                    key={index}
                    className="bg-gray-100 px-3 py-1.5 rounded-full"
                  >
                    <Text className="text-sm text-gray-700">{attr}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Date Added */}
          <View className="flex-row items-center pt-4 border-t border-gray-200">
            <Calendar size={16} color="#6B7280" />
            <Text className="text-xs text-gray-500 ml-2">
              Added {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="px-4 pb-4 gap-3">
          {/* Delete Button */}
          <Pressable
            onPress={handleDelete}
            disabled={isDeleting}
            className={`flex-row items-center justify-center py-3 rounded-lg border-2 ${
              isDeleting
                ? 'bg-gray-100 border-gray-300'
                : 'bg-white border-red-500 active:bg-red-50'
            }`}
          >
            {isDeleting ? (
              <ActivityIndicator color="#EF4444" />
            ) : (
              <>
                <Trash2 size={20} color="#EF4444" />
                <Text className="text-red-600 font-semibold ml-2">
                  Delete Item
                </Text>
              </>
            )}
          </Pressable>

          {/* Edit Button (Future) */}
          <Pressable
            onPress={() => {
              Alert.alert('Coming Soon', 'Edit functionality will be available soon.');
            }}
            className="flex-row items-center justify-center py-3 rounded-lg bg-white border-2 border-gray-300 active:bg-gray-50"
          >
            <Edit size={20} color="#6B7280" />
            <Text className="text-gray-700 font-semibold ml-2">Edit Item</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

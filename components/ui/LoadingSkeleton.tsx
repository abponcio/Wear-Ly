import React from 'react';
import { View, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 16;
const CARD_PADDING = 16;
const NUM_COLUMNS = 2;
const CARD_WIDTH = (width - CARD_PADDING * 2 - CARD_MARGIN) / NUM_COLUMNS;

interface LoadingSkeletonProps {
  count?: number;
}

export default function LoadingSkeleton({ count = 6 }: LoadingSkeletonProps) {
  return (
    <View className="flex-row flex-wrap justify-between px-4">
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          style={{ width: CARD_WIDTH }}
          className="mb-4 bg-white rounded-lg shadow-md overflow-hidden"
        >
          {/* Image Skeleton */}
          <View className="w-full aspect-square bg-gray-200 animate-pulse" />

          {/* Content Skeleton */}
          <View className="p-3">
            {/* Category Badge */}
            <View className="h-3 w-16 bg-gray-200 rounded-full mb-2 animate-pulse" />

            {/* Subcategory */}
            <View className="h-4 w-24 bg-gray-200 rounded mb-2 animate-pulse" />

            {/* Color & Material Tags */}
            <View className="flex-row gap-2 mb-2">
              <View className="h-5 w-16 bg-gray-200 rounded-full animate-pulse" />
              <View className="h-5 w-20 bg-gray-200 rounded-full animate-pulse" />
            </View>

            {/* Attributes */}
            <View className="flex-row gap-1">
              <View className="h-4 w-12 bg-gray-200 rounded-full animate-pulse" />
              <View className="h-4 w-14 bg-gray-200 rounded-full animate-pulse" />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

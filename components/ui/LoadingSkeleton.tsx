import React from "react";
import { View, Dimensions } from "react-native";

const { width } = Dimensions.get("window");
const CARD_GAP = 12;
const CARD_PADDING = 20;
const NUM_COLUMNS = 2;
const CARD_WIDTH = (width - CARD_PADDING * 2 - CARD_GAP) / NUM_COLUMNS;

interface LoadingSkeletonProps {
  count?: number;
}

export default function LoadingSkeleton({ count = 6 }: LoadingSkeletonProps) {
  return (
    <View
      className="flex-row flex-wrap justify-between"
      style={{ paddingHorizontal: CARD_PADDING }}
    >
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          style={{ width: CARD_WIDTH, marginBottom: CARD_GAP }}
          className="bg-white border border-cream-200 overflow-hidden"
        >
          {/* Image Skeleton */}
          <View className="w-full aspect-[3/4] bg-cream-200" />

          {/* Content Skeleton */}
          <View className="p-3">
            {/* Category */}
            <View className="h-2 w-12 bg-cream-200 mb-2" />

            {/* Subcategory */}
            <View className="h-3 w-20 bg-cream-200 mb-2" />

            {/* Color */}
            <View className="h-2 w-10 bg-cream-200" />
          </View>
        </View>
      ))}
    </View>
  );
}

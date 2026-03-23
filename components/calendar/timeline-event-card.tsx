import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { Pressable, Text, View } from "react-native";

import { Image } from "@/components/ui/image";
import { NETWORK_CONFIG } from "@/constants/networks";
import type { ScheduledPost } from "@/types";

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

type TimelineEventCardProps = {
  post: ScheduledPost;
  isSelected: boolean;
  onPress: () => void;
};

export const TimelineEventCard = memo(function TimelineEventCard({ post, isSelected, onPress }: TimelineEventCardProps) {
  const network = NETWORK_CONFIG[post.network];
  const previewText = stripHtml(post.content || post.title);

  return (
    <Pressable onPress={onPress} className="relative">
      {/* Card content — no border styling here so backgrounds always render */}
      <View className="h-[72px] overflow-hidden rounded-lg">
        <View className="h-6 items-center justify-center bg-slot-bg-header px-2">
          <Text
            className="font-jakarta text-caption font-medium leading-[15px] text-white"
            numberOfLines={1}
          >
            {post.category}
          </Text>
        </View>

        <View className="flex-1 flex-row items-center gap-2 bg-slot-bg-post p-2">
          <View className="relative">
            <Image
              source={{ uri: post.authorAvatar }}
              className="w-5 h-5 rounded"
              contentFit="cover"
            />
            <View
              className="absolute bottom-[-2px] right-[-2px] h-[10px] w-[10px] items-center justify-center rounded-[1.25px]"
              style={{ backgroundColor: network.bg }}
            >
              <Ionicons name={network.icon} size={7} color="#FFFFFF" />
            </View>
          </View>

          <View className="flex-1 justify-center">
            <Text
              className="font-jakarta text-body-4 font-medium text-text-primary"
              numberOfLines={1}
            >
              {previewText}
            </Text>
          </View>
        </View>
      </View>

      {/* Selection border overlay — absolutely positioned so it never touches overflow:hidden */}
      {isSelected && (
        <View
          pointerEvents="none"
          className="absolute inset-0 rounded-[8px] border-2 border-slot-stroke-active"
        />
      )}
    </Pressable>
  );
});

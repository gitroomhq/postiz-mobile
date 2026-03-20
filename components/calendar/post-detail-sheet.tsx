import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { BottomSheetWrapper } from "@/components/ui/bottom-sheet-wrapper";
import { Image } from "@/components/ui/image";
import { NETWORK_CONFIG } from "@/constants/networks";
import { formatPostDateTime } from "@/utils/calendar";
import type { ScheduledPost } from "@/types";

type PostDetailSheetProps = {
  isVisible: boolean;
  post: ScheduledPost | null;
  onClose: () => void;
  onEdit: (post: ScheduledPost) => void;
  onDuplicate: (post: ScheduledPost) => void;
  onDelete: (post: ScheduledPost) => void;
  onChangeDateTime: (post: ScheduledPost) => void;
};

export function PostDetailSheet({
  isVisible,
  post,
  onClose,
  onEdit,
  onDuplicate,
  onDelete,
  onChangeDateTime,
}: PostDetailSheetProps) {
  const network = post ? NETWORK_CONFIG[post.network] : null;

  return (
    <BottomSheetWrapper isVisible={isVisible} onClose={onClose}>
      {post && network ? (
        <>
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="font-jakarta text-h3 font-semibold text-text-primary">
              Post
            </Text>
            <Pressable
              className="h-8 w-8 items-center justify-center"
              onPress={() => onDelete(post)}
            >
              <Ionicons name="trash-outline" size={20} color="#FF3F3F" />
            </Pressable>
          </View>

          <Pressable
            className="mb-5 flex-row items-center justify-between"
            onPress={() => onChangeDateTime(post)}
          >
            <View className="flex-row items-center gap-2">
              <View className="h-6 w-6 items-center justify-center">
                <Ionicons name="calendar-outline" size={18} className="text-icon-primary" />
              </View>
              <Text className="font-jakarta text-h4 font-semibold text-text-primary">
                {formatPostDateTime(post.scheduledAt)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} className="text-icon-primary" />
          </Pressable>

          <View className="mb-8 flex-row items-center gap-3">
            <View className="relative">
              <Image
                source={{ uri: post.authorAvatar }}
                className="w-10 h-10 rounded-lg"
                contentFit="cover"
              />
              <View
                className="absolute bottom-[-3px] right-[-3px] h-4 w-4 items-center justify-center rounded-[4px]"
                style={{ backgroundColor: network.bg }}
              >
                <Ionicons name={network.icon} size={10} color="#FFFFFF" />
              </View>
            </View>
            <Text className="font-jakarta text-h4 font-semibold text-text-primary">
              {post.authorName}
            </Text>
          </View>

          <View className="flex-row gap-2">
            <Pressable
              className="h-11 flex-1 flex-row items-center justify-center gap-2 rounded-[8px] bg-buttons-tertiary-bg"
              onPress={() => onDuplicate(post)}
            >
              <Ionicons name="copy-outline" size={16} color="#FFFFFF" />
              <Text className="font-jakarta text-button font-semibold text-text-primary">
                Duplicate
              </Text>
            </Pressable>
            <Pressable
              className="h-11 flex-1 flex-row items-center justify-center gap-2 rounded-[8px] bg-buttons-primary-bg"
              onPress={() => onEdit(post)}
            >
              <Ionicons name="pencil" size={16} color="#FFFFFF" />
              <Text className="font-jakarta text-button font-semibold text-white">
                Edit
              </Text>
            </Pressable>
          </View>
        </>
      ) : null}
    </BottomSheetWrapper>
  );
}

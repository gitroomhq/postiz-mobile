import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { format, parseISO } from "date-fns";

import { showToast } from "@/components/ui/toast";

const SAMPLE_CHANNELS = [
  { id: "1", avatar: "https://i.pravatar.cc/80?img=11", network: "instagram" },
  { id: "2", avatar: "https://i.pravatar.cc/80?img=12", network: "facebook" },
];

export default function CreatePostScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    dateTime?: string;
    postId?: string;
  }>();

  const isEditing = !!params.postId;
  const initialDate = params.dateTime
    ? parseISO(params.dateTime)
    : new Date();

  const [content, setContent] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(
    "https://picsum.photos/seed/newpost/400/300",
  );
  const [postType] = useState("Post");

  const dateLabel = format(initialDate, "MMM d, h:mm a")
    .replace(/ AM$/, " am")
    .replace(/ PM$/, " pm");

  const handleSave = () => {
    showToast(
      isEditing ? "Post updated" : "Post created",
      "success",
    );
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-background-primary" edges={["top"]}>
      <StatusBar style="light" />

      {/* Header */}
      <View className="h-[56px] flex-row items-center justify-between border-b border-separator-primary px-4">
        <Pressable
          className="h-10 w-10 items-center justify-center"
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </Pressable>

        <View className="flex-row items-center gap-2">
          <Ionicons name="calendar-outline" size={16} className="text-icon-primary" />
          <Text className="font-jakarta text-body-3 text-text-secondary">
            {dateLabel}
          </Text>
        </View>

        <Pressable className="rounded-[6px] border border-slot-stroke-default px-3 py-1.5">
          <Text className="font-jakarta text-body-3 font-medium text-text-primary">
            {postType} ▾
          </Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Channel selector */}
          <View className="mb-4 flex-row items-center gap-2">
            {SAMPLE_CHANNELS.map((ch) => (
              <View
                key={ch.id}
                className="h-9 w-9 overflow-hidden rounded-full border-2 border-buttons-primary-bg"
              >
                <Image
                  source={{ uri: ch.avatar }}
                  style={{ width: 32, height: 32 }}
                  contentFit="cover"
                />
              </View>
            ))}
            <Pressable className="h-9 w-9 items-center justify-center rounded-full border border-dashed border-text-secondary">
              <Ionicons name="add" size={18} className="text-icon-primary" />
            </Pressable>

            <View className="flex-1" />

            <Pressable className="h-8 w-8 items-center justify-center">
              <Ionicons name="settings-outline" size={20} className="text-icon-primary" />
            </Pressable>
          </View>

          {/* Content area */}
          <TextInput
            className="mb-4 min-h-[120px] font-jakarta text-body-1 text-text-primary"
            placeholder="What's on your mind?"
            placeholderTextColor="#454444"
            multiline
            textAlignVertical="top"
            value={content}
            onChangeText={setContent}
          />

          {/* Image attachment */}
          {imageUri ? (
            <View className="mb-4">
              <Image
                source={{ uri: imageUri }}
                style={{ width: "100%", height: 200, borderRadius: 12 }}
                contentFit="cover"
              />
              <Pressable
                className="absolute -right-2 -top-2 h-7 w-7 items-center justify-center rounded-full bg-text-critical"
                onPress={() => setImageUri(null)}
              >
                <Ionicons name="close" size={16} color="#FFFFFF" />
              </Pressable>
            </View>
          ) : null}
        </ScrollView>

        {/* Bottom toolbar */}
        <View className="border-t border-separator-primary bg-background-primary px-4 py-3">
          <View className="flex-row items-center gap-4">
            <Pressable className="h-10 w-10 items-center justify-center rounded-[8px] bg-main-sections-2">
              <Ionicons name="image-outline" size={20} className="text-icon-primary" />
            </Pressable>
            <Pressable className="h-10 w-10 items-center justify-center rounded-[8px] bg-main-sections-2">
              <Ionicons name="images-outline" size={20} className="text-icon-primary" />
            </Pressable>
            <Pressable className="h-10 w-10 items-center justify-center rounded-[8px] bg-main-sections-2">
              <Ionicons name="grid-outline" size={20} className="text-icon-primary" />
            </Pressable>
            <Pressable className="h-10 w-10 items-center justify-center rounded-[8px] bg-main-sections-2">
              <Text className="font-jakarta text-body-2 font-bold text-text-secondary">
                H
              </Text>
            </Pressable>
            <Pressable className="h-10 w-10 items-center justify-center rounded-[8px] bg-main-sections-2">
              <Text className="font-jakarta text-body-2 font-bold text-text-secondary">
                U
              </Text>
            </Pressable>

            <View className="flex-1" />

            <Pressable
              className="h-10 w-10 items-center justify-center rounded-full bg-buttons-secondary-bg"
              onPress={handleSave}
            >
              <Ionicons name="add" size={22} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

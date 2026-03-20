import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { Image } from "@/components/ui/image";
import { BottomSheetWrapper } from "@/components/ui/bottom-sheet-wrapper";

import type { MediaSheetState } from "./constants";

function EncodingIndicator() {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [rotation]);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View
      className="h-8 w-8"
      style={{ transform: [{ rotate: spin }] }}
    >
      <View className="absolute inset-0 rounded-full border-4 border-[#3A3939]" />
      <View className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#F6C744] border-l-[#F6C744]" />
    </Animated.View>
  );
}

function MediaTile({
  uri,
  selectedIndex,
  onPress,
}: {
  uri: string;
  selectedIndex: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      className="mb-3 w-[48.2%] aspect-square"
      onPress={onPress}
    >
      <View
        className={`h-full w-full overflow-hidden rounded-[8px] border-[3px] ${
          selectedIndex >= 0 ? "border-buttons-primary-bg" : "border-transparent"
        }`}
      >
        <Image source={{ uri }} className="h-full w-full" contentFit="cover" />
      </View>
      {selectedIndex >= 0 ? (
        <View className="absolute -bottom-2 -right-2 h-7 w-7 items-center justify-center rounded-full bg-buttons-primary-bg">
          <Text className="font-jakarta text-[13px] font-semibold text-white">
            {selectedIndex + 1}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function MediaLibrarySheet({
  isVisible,
  state,
  assets,
  selectedIds,
  onClose,
  onUpload,
  onToggleSelect,
  onDeleteSelected,
  onAddSelected,
}: {
  isVisible: boolean;
  state: MediaSheetState;
  assets: readonly { id: string; uri: string }[];
  selectedIds: string[];
  onClose: () => void;
  onUpload: () => void;
  onToggleSelect: (id: string) => void;
  onDeleteSelected: () => void;
  onAddSelected: () => void;
}) {
  const selectedCount = selectedIds.length;
  const { height: windowHeight } = useWindowDimensions();

  return (
    <BottomSheetWrapper
      isVisible={isVisible}
      onClose={onClose}
      showHandle={false}
      containerStyle={{
        backgroundColor: "#1A1919",
        paddingHorizontal: 0,
        paddingTop: 0,
        height: windowHeight * 0.95,
      }}
    >
      <View className="flex-1 bg-main-sections">
        <View className="flex-row items-center justify-between px-4 py-5">
          <Text className="font-jakarta text-h2 font-semibold text-text-primary">
            Media Library
          </Text>
          <Pressable
            className="h-8 w-8 items-center justify-center"
            onPress={onClose}
          >
            <Ionicons name="close" size={20} className="text-icon-primary" />
          </Pressable>
        </View>

        {state === "empty" ? (
          <View className="flex-1 items-center justify-center px-9 pb-10">
            <View className="mb-8 h-[140px] w-[180px] items-center justify-center">
              <View className="absolute h-[92px] w-[92px] rounded-[24px] border-2 border-main-accent-pink" />
              <View className="absolute left-6 top-[42px] h-14 w-14 rotate-[-16deg] items-center justify-center rounded-[18px] bg-main-sections-2">
                <Ionicons
                  name="images-outline"
                  size={26}
                  className="text-icon-secondary"
                />
              </View>
              <View className="absolute top-[58px] h-[72px] w-[72px] items-center justify-center rounded-[22px] bg-[#2C2B2B]">
                <Ionicons
                  name="image-outline"
                  size={34}
                  className="text-[#8D8B8B]"
                />
              </View>
            </View>

            <Text className="text-center font-jakarta text-h1 font-semibold text-text-primary">
              You don&apos;t have any assets yet
            </Text>
            <Text className="mt-2 text-center font-jakarta text-body-1 text-text-secondary">
              Click the button below to upload one.
            </Text>

            <Pressable
              className="mt-8 h-11 w-full items-center justify-center rounded-[8px] bg-buttons-primary-bg"
              onPress={onUpload}
            >
              <View className="flex-row items-center gap-2">
                <Ionicons name="add" size={18} className="text-white" />
                <Text className="font-jakarta text-button font-semibold text-white">
                  Upload
                </Text>
              </View>
            </Pressable>
          </View>
        ) : (
          <>
            <View className="px-4 pb-4">
              <Text className="font-jakarta text-body-1 font-semibold text-text-primary">
                Select or upload pictures (maximum 5 at a time).
              </Text>
            </View>

            {state === "loading" ? (
              <View className="flex-row items-center justify-center gap-3 pb-6">
                <EncodingIndicator />
                <Text className="font-jakarta text-h4 font-semibold text-text-primary">
                  Encoding...
                </Text>
              </View>
            ) : selectedCount > 0 ? (
              <View className="flex-row items-center justify-center gap-2 pb-6">
                <Ionicons
                  name="trash-outline"
                  size={18}
                  className="text-text-critical"
                />
                <Pressable onPress={onDeleteSelected}>
                  <Text className="font-jakarta text-h4 font-semibold text-text-critical">
                    Delete Selected
                  </Text>
                </Pressable>
              </View>
            ) : null}

            <ScrollView
              className="flex-1"
              contentContainerClassName="px-4 pb-4"
              showsVerticalScrollIndicator={false}
            >
              <View className="flex-row flex-wrap justify-between">
                {assets.map((asset) => (
                  <MediaTile
                    key={asset.id}
                    uri={asset.uri}
                    selectedIndex={selectedIds.indexOf(asset.id)}
                    onPress={() => onToggleSelect(asset.id)}
                  />
                ))}
              </View>
            </ScrollView>

            <View className="gap-3 px-4 pb-3 pt-3">
              <Pressable
                className={`h-11 items-center justify-center rounded-[8px] ${
                  state === "loading"
                    ? "bg-buttons-disabled-bg"
                    : "bg-buttons-tertiary-bg"
                }`}
                disabled={state === "loading"}
                onPress={onUpload}
              >
                <View className="flex-row items-center gap-2">
                  <Ionicons
                    name="add"
                    size={18}
                    className={
                      state === "loading"
                        ? "text-buttons-disabled-text"
                        : "text-white"
                    }
                  />
                  <Text
                    className={`font-jakarta text-button font-semibold ${
                      state === "loading"
                        ? "text-buttons-disabled-text"
                        : "text-white"
                    }`}
                  >
                    Upload
                  </Text>
                </View>
              </Pressable>

              <Pressable
                className={`h-11 items-center justify-center rounded-[8px] ${
                  selectedCount > 0 && state !== "loading"
                    ? "bg-buttons-primary-bg"
                    : "bg-buttons-disabled-bg"
                }`}
                disabled={selectedCount === 0 || state === "loading"}
                onPress={onAddSelected}
              >
                <Text
                  className={`font-jakarta text-button font-semibold ${
                    selectedCount > 0 && state !== "loading"
                      ? "text-white"
                      : "text-buttons-disabled-text"
                  }`}
                >
                  Add Selected Media
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </View>
    </BottomSheetWrapper>
  );
}

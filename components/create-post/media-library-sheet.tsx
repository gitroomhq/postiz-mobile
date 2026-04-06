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
import Svg, { Path } from "react-native-svg";

import { Image } from "@/components/ui/image";
import { BottomSheetWrapper } from "@/components/ui/bottom-sheet-wrapper";
import { SvgIcon } from "@/components/ui/svg-icon";

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

function EmptyMediaGalleryGlyph() {
  return (
    <Svg width={35} height={35} viewBox="0 0 34.787 34.787" fill="none">
      <Path
        d="M31.9171 24.3799L27.3803 13.7698C26.5541 11.8276 25.322 10.726 23.9161 10.6535C22.5246 10.581 21.1766 11.5522 20.1475 13.4075L17.3935 18.3501C16.8137 19.3937 15.9875 20.017 15.0889 20.0895C14.1757 20.1765 13.2625 19.6981 12.5233 18.756L12.2044 18.3501C11.1753 17.0601 9.8998 16.4369 8.59528 16.5673C7.29077 16.6978 6.17469 17.5964 5.43547 19.0604L2.9279 24.061C2.02924 25.8728 2.11621 27.9745 3.17431 29.6849C4.23242 31.3953 6.07323 32.4244 8.08797 32.4244H26.5831C28.5253 32.4244 30.3371 31.4532 31.4097 29.8298C32.5113 28.2064 32.6853 26.1627 31.9171 24.3799Z"
        fill="rgba(255,255,255,0.4)"
      />
      <Path
        d="M10.1027 12.1465C12.8085 12.1465 15.0019 9.95302 15.0019 7.24729C15.0019 4.54155 12.8085 2.34812 10.1027 2.34812C7.39698 2.34812 5.20355 4.54155 5.20355 7.24729C5.20355 9.95302 7.39698 12.1465 10.1027 12.1465Z"
        fill="rgba(255,255,255,0.4)"
      />
    </Svg>
  );
}

function EmptyMediaImageGlyph() {
  return (
    <Svg width={53} height={53} viewBox="0 0 52.7732 52.7732" fill="none">
      <Path
        d="M5.67483 41.8013L5.63085 41.8453C5.03716 40.548 4.66335 39.0747 4.50942 37.4475C4.66335 39.0527 5.08113 40.504 5.67483 41.8013Z"
        fill="rgba(255,255,255,0.4)"
      />
      <Path
        d="M19.7923 22.8241C22.6826 22.8241 25.0257 20.4811 25.0257 17.5908C25.0257 14.7005 22.6826 12.3574 19.7923 12.3574C16.902 12.3574 14.559 14.7005 14.559 17.5908C14.559 20.4811 16.902 22.8241 19.7923 22.8241Z"
        fill="rgba(255,255,255,0.4)"
      />
      <Path
        d="M35.602 4.3983H17.1754C9.17148 4.3983 4.39991 9.16987 4.39991 17.1738V35.6004C4.39991 37.9972 4.8177 40.0861 5.63128 41.8453C7.52232 46.0231 11.5683 48.3759 17.1754 48.3759H35.602C43.606 48.3759 48.3775 43.6044 48.3775 35.6004V30.565V17.1738C48.3775 9.16987 43.606 4.3983 35.602 4.3983ZM44.7934 27.4866C43.0782 26.0133 40.3076 26.0133 38.5925 27.4866L29.4452 35.3366C27.73 36.8098 24.9594 36.8098 23.2443 35.3366L22.4967 34.7209C20.9355 33.3576 18.4508 33.2256 16.6917 34.413L8.46784 39.9322C7.98409 38.7008 7.69823 37.2716 7.69823 35.6004V17.1738C7.69823 10.973 10.9746 7.69662 17.1754 7.69662H35.602C41.8029 7.69662 45.0792 10.973 45.0792 17.1738V27.7284L44.7934 27.4866Z"
        fill="rgba(255,255,255,0.4)"
      />
    </Svg>
  );
}

function EmptyMediaHighlight() {
  return (
    <Svg width={158} height={159} viewBox="0 0 158.009 158.741" fill="none">
      <Path
        d="M67.92 68.2711C61.8194 68.2711 72.2216 -6.81047 46.2112 1.66735C21.4813 9.72781 56.0606 68.2711 50.25 68.2711C44.4394 68.2711 3.8274 64.9001 1.12367 83.2569C-1.8959 103.758 51.3058 92.2828 52.8908 94.9125C54.4759 97.5423 32.002 128.679 46.2112 138.205C60.9317 148.074 79.7283 111.563 82.9492 111.563C86.17 111.563 102.817 171.375 116.347 154.856C127.344 141.431 101.131 111.563 106.328 111.563C111.525 111.563 150.299 114.598 156.425 94.9125C163.913 70.8549 96.9989 88.034 92.9686 83.2569C88.9384 78.4798 125.222 40.1334 106.328 29.9739C87.6723 19.9427 74.0206 68.2711 67.92 68.2711Z"
        stroke="#FC69FF"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function EmptyMediaIllustration() {
  return (
    <View className="mb-[30px] h-[175px] w-[223px]">
      <View className="absolute left-[60px] top-px">
        <EmptyMediaHighlight />
      </View>

      <View
        className="absolute left-[26px] top-[57px] h-[58px] w-[58px] items-center justify-center rounded-[15px] bg-[#232222]"
        style={{ transform: [{ rotate: "-16deg" }] }}
      >
        <EmptyMediaGalleryGlyph />
      </View>

      <View className="absolute left-[75px] top-[82px] h-[77px] w-[77px] items-center justify-center rounded-[21px] bg-input-stroke-default">
        <EmptyMediaImageGlyph />
      </View>
    </View>
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
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const uploadButtonWidth = Math.min(windowWidth - 32, 300);
  const sheetHeight = Math.min(windowHeight - 56, windowHeight * 0.93);

  return (
    <BottomSheetWrapper
      isVisible={isVisible}
      onClose={onClose}
      showHandle={false}
      containerStyle={{
        backgroundColor: "#1A1919",
        paddingHorizontal: 0,
        paddingTop: 0,
        height: sheetHeight,
      }}
    >
      <View className="flex-1 bg-main-sections">
        <View className="h-[60px] flex-row items-center justify-between px-4 py-3">
          <Text className="font-jakarta text-h2 font-semibold text-text-primary">
            Media Library
          </Text>
          <Pressable
            className="h-8 w-8 items-center justify-center"
            onPress={onClose}
            hitSlop={8}
          >
            <Ionicons name="close" size={20} className="text-icon-primary" />
          </Pressable>
        </View>

        {state === "empty" ? (
          <View className="flex-1 px-4 pb-4 pt-4">
            <View className="flex-1 items-center justify-center" style={{ paddingBottom: 70 }}>
              <EmptyMediaIllustration />

              <View className="items-center">
                <Text className="w-[187px] text-center font-jakarta text-h1 font-semibold leading-[34px] text-text-primary">
                  {"You don't have\nany assets yet"}
                </Text>
                <Text className="mt-1 text-center font-jakarta text-body-1 text-text-secondary">
                  Click the button below to upload one.
                </Text>
              </View>

              <Pressable
                className="mt-8 h-11 items-center justify-center rounded-[8px] bg-buttons-primary-bg"
                style={{ width: uploadButtonWidth }}
                onPress={onUpload}
              >
                <View className="flex-row items-center gap-2">
                  <SvgIcon
                    source={require("@/assets/icons/create-post/plus.svg")}
                    size={18}
                  />
                  <Text className="font-jakarta text-button font-semibold text-white">
                    Upload
                  </Text>
                </View>
              </Pressable>
            </View>
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

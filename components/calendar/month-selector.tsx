import { Image as ExpoImage, type ImageProps } from "expo-image";
import type { FC } from "react";
import { Pressable, Text } from "react-native";

import { formatMonthName } from "@/utils/calendar";

const Image = ExpoImage as unknown as FC<ImageProps>;

type MonthSelectorProps = {
  currentMonth: Date;
  isOpen: boolean;
  onToggle: () => void;
};

export function MonthSelector({
  currentMonth,
  isOpen,
  onToggle,
}: MonthSelectorProps) {
  return (
    <Pressable
      className="h-11 flex-row items-center gap-[2px] rounded-[8px]"
      style={{ minWidth: 130 }}
      onPress={onToggle}
    >
      <Text className="pb-[2px] font-jakarta text-h2 font-semibold text-text-primary">
        {formatMonthName(currentMonth)}
      </Text>
      <Image
        source={
          isOpen
            ? require("@/assets/icons/month-chevron-closed.svg")
            : require("@/assets/icons/month-chevron-open.svg")
        }
        style={{ width: 20, height: 20 }}
        contentFit="contain"
      />
    </Pressable>
  );
}

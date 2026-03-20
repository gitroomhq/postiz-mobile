import { Pressable, Text } from "react-native";

import { Image } from "@/components/ui/image";
import { formatMonthName } from "@/utils/calendar";

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
      className="h-11 flex-row items-center gap-[2px] rounded-[8px] min-w-[130px]"
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
        className="w-5 h-5"
        contentFit="contain"
      />
    </Pressable>
  );
}

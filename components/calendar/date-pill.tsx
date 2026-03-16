import { Text, View } from "react-native";
import { formatSelectedDate } from "@/utils/calendar";

type DatePillProps = {
  selectedDate: Date;
  hasPosts: boolean;
};

export function DatePill({ selectedDate, hasPosts }: DatePillProps) {
  return (
    <View className="px-4 pb-2 pt-1">
      <View className="ml-[52px] h-7 items-center justify-center rounded-[8px] bg-slot-day-bg">
        <Text
          className={`font-jakarta text-body-4 font-medium ${hasPosts ? "text-main-accent-pink" : "text-text-secondary"}`}
        >
          {formatSelectedDate(selectedDate)}
        </Text>
      </View>
    </View>
  );
}

import { Pressable, Text, View } from "react-native";

import type { CalendarDay } from "@/types";

const WEEKDAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

type CalendarGridProps = {
  days: CalendarDay[];
  onDayPress: (date: Date) => void;
};

export function CalendarGrid({ days, onDayPress }: CalendarGridProps) {
  const weeks = Array.from({ length: Math.ceil(days.length / 7) }, (_, index) =>
    days.slice(index * 7, index * 7 + 7),
  );

  return (
    <View className="w-full gap-2">
      <View className="flex-row items-center justify-between">
        {WEEKDAY_LABELS.map((label) => (
          <View
            key={label}
            className="h-10 w-10 items-center justify-center p-[10px]"
          >
            <Text className="font-jakarta text-body-2 font-semibold text-text-secondary">
              {label}
            </Text>
          </View>
        ))}
      </View>

      <View className="gap-2">
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} className="flex-row items-center justify-between">
            {week.map((day, dayIndex) => {
              const dayNum = day.date.getDate();

              const textColor = day.isSelected
                ? "text-main-bg"
                : !day.isCurrentMonth
                  ? "text-text-tertiary"
                  : day.isToday || day.hasEvents
                    ? "text-main-accent-pink"
                    : "text-text-secondary";

              return (
                <Pressable
                  key={`${weekIndex}-${dayIndex}`}
                  className={`h-10 w-10 items-center justify-center rounded-[8px] px-1 pb-[4px] pt-[2px] ${
                    day.isSelected ? "bg-white" : "bg-transparent"
                  }`}
                  onPress={() => onDayPress(day.date)}
                >
                  <Text
                    className={`font-jakarta text-body-1 ${
                      day.isSelected || day.isToday || day.hasEvents
                        ? "font-semibold"
                        : "font-normal"
                    } ${textColor}`}
                  >
                    {dayNum}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

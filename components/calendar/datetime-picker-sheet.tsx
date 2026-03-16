import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { format, set } from "date-fns";

import { BottomSheetWrapper } from "@/components/ui/bottom-sheet-wrapper";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import {
  addMonths,
  formatMonthName,
  getCalendarDays,
  subMonths,
} from "@/utils/calendar";

type DateTimePickerSheetProps = {
  isVisible: boolean;
  initialDate: Date;
  onSave: (date: Date) => void;
  onClose: () => void;
};

type TimeStepperProps = {
  value: string;
  onChange: (value: string) => void;
  min: number;
  max: number;
  padTo?: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function TimeStepper({
  value,
  onChange,
  min,
  max,
  padTo,
}: TimeStepperProps) {
  const step = (delta: number) => {
    const nextValue = clamp((parseInt(value, 10) || min) + delta, min, max);
    onChange(padTo ? String(nextValue).padStart(padTo, "0") : String(nextValue));
  };

  return (
    <View className="w-[74px] items-center gap-1">
      <Pressable
        className="h-5 w-5 items-center justify-center"
        onPress={() => step(1)}
      >
        <Ionicons name="chevron-up" size={16} className="text-icon-primary" />
      </Pressable>
      <TextInput
        className="h-[52px] w-full rounded-[10px] border border-input-stroke-default bg-input-bg text-center font-jakarta text-body-2 text-text-primary"
        keyboardType="number-pad"
        maxLength={padTo ?? 2}
        value={value}
        onChangeText={onChange}
      />
      <Pressable
        className="h-5 w-5 items-center justify-center"
        onPress={() => step(-1)}
      >
        <Ionicons name="chevron-down" size={16} className="text-icon-primary" />
      </Pressable>
    </View>
  );
}

export function DateTimePickerSheet({
  isVisible,
  initialDate,
  onSave,
  onClose,
}: DateTimePickerSheetProps) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [currentMonth, setCurrentMonth] = useState(initialDate);
  const [hour, setHour] = useState(
    String(
      initialDate.getHours() > 12
        ? initialDate.getHours() - 12
        : initialDate.getHours() || 12,
    ),
  );
  const [minute, setMinute] = useState(
    String(initialDate.getMinutes()).padStart(2, "0"),
  );
  const [ampm, setAmpm] = useState<"am" | "pm">(
    initialDate.getHours() >= 12 ? "pm" : "am",
  );

  const emptyPostsMap = new Map();
  const days = getCalendarDays(currentMonth, selectedDate, emptyPostsMap);

  const handleSave = () => {
    let h = clamp(parseInt(hour, 10) || 12, 1, 12);
    const m = clamp(parseInt(minute, 10) || 0, 0, 59);
    if (ampm === "pm" && h !== 12) h += 12;
    if (ampm === "am" && h === 12) h = 0;

    const newDate = set(selectedDate, {
      hours: h,
      minutes: m,
      seconds: 0,
    });

    onSave(newDate);
  };

  return (
    <BottomSheetWrapper isVisible={isVisible} onClose={onClose}>
      <View className="mb-5 flex-row items-center justify-between">
        <Text className="font-jakarta text-h3 font-semibold text-text-primary">
          Change Date or Time
        </Text>
        <Pressable
          className="h-8 w-8 items-center justify-center"
          onPress={onClose}
        >
          <Ionicons name="close" size={20} className="text-icon-primary" />
        </Pressable>
      </View>

      <View className="mb-4 flex-row items-center gap-4">
        <Text className="font-jakarta text-h4 font-semibold text-text-primary">
          Date
        </Text>
        <View className="flex-1 rounded-[10px] border border-input-stroke-default bg-input-bg px-3 py-[14px]">
          <Text className="font-jakarta text-h4 text-text-primary">
            {format(selectedDate, "EEE, d MMMM")}
          </Text>
        </View>
      </View>

      <View className="mb-5 rounded-[12px] bg-main-sections-2 p-4">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="font-jakarta text-h4 font-semibold text-text-primary">
            {formatMonthName(currentMonth)}, {currentMonth.getFullYear()}
          </Text>
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="h-8 w-8 items-center justify-center"
            >
              <Ionicons name="chevron-back" size={18} className="text-icon-primary" />
            </Pressable>
            <Pressable
              onPress={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="h-8 w-8 items-center justify-center"
            >
              <Ionicons name="chevron-forward" size={18} className="text-icon-primary" />
            </Pressable>
          </View>
        </View>

        <CalendarGrid
          days={days}
          onDayPress={(date) => {
            setSelectedDate(date);
            setCurrentMonth(date);
          }}
        />
      </View>

      <View className="mb-6 flex-row items-center justify-between">
        <Text className="font-jakarta text-h4 font-semibold text-text-primary">
          Time
        </Text>

        <View className="flex-row items-center gap-3">
          <View className="flex-row items-center gap-1">
            <TimeStepper
              value={hour}
              onChange={(value) => setHour(value.replace(/[^0-9]/g, ""))}
              min={1}
              max={12}
            />
            <Text className="font-jakarta text-body-2 font-semibold text-text-primary">
              :
            </Text>
            <TimeStepper
              value={minute}
              onChange={(value) =>
                setMinute(value.replace(/[^0-9]/g, "").slice(0, 2))
              }
              min={0}
              max={59}
              padTo={2}
            />
          </View>

          <View className="h-[52px] flex-row rounded-[8px] border border-tab-stroke-default bg-tab-bg-default p-1">
            <Pressable
              className={`h-[44px] w-[44px] items-center justify-center rounded-[6px] ${
                ampm === "am" ? "bg-white" : "bg-transparent"
              }`}
              onPress={() => setAmpm("am")}
            >
              <Text
                className={`font-jakarta text-body-2 ${
                  ampm === "am" ? "text-main-bg" : "text-text-secondary"
                }`}
              >
                am
              </Text>
            </Pressable>
            <Pressable
              className={`h-[44px] w-[44px] items-center justify-center rounded-[6px] ${
                ampm === "pm" ? "bg-white" : "bg-transparent"
              }`}
              onPress={() => setAmpm("pm")}
            >
              <Text
                className={`font-jakarta text-body-2 ${
                  ampm === "pm" ? "text-main-bg" : "text-text-secondary"
                }`}
              >
                pm
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      <Pressable
        className="h-11 items-center justify-center rounded-[8px] bg-buttons-primary-bg"
        onPress={handleSave}
      >
        <Text className="font-jakarta text-button font-semibold text-white">
          Save
        </Text>
      </Pressable>
    </BottomSheetWrapper>
  );
}

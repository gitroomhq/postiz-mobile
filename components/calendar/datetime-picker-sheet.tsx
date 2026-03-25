import { useEffect, useRef, useState } from "react";
import { Keyboard, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { set } from "date-fns";

import { BottomSheetWrapper } from "@/components/ui/bottom-sheet-wrapper";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import {
  addMonths,
  format,
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

type TimeFieldProps = {
  value: string;
  onChangeText: (text: string) => void;
  onBlur: () => void;
  onFocus?: () => void;
  onStep: (delta: number) => void;
  accessibilityLabel: string;
  inputRef: React.RefObject<TextInput | null>;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getInitialTimeState(date: Date) {
  const hours24 = date.getHours();
  const hours12 = hours24 % 12 || 12;

  return {
    hour: String(hours12),
    minute: String(date.getMinutes()).padStart(2, "0"),
    ampm: (hours24 >= 12 ? "pm" : "am") as "am" | "pm",
  };
}

function normalizeValue(value: string, field: "hour" | "minute") {
  if (!value) {
    return field === "minute" ? "00" : "12";
  }

  const parsed = parseInt(value, 10);

  if (Number.isNaN(parsed)) {
    return field === "minute" ? "00" : "12";
  }

  const normalized =
    field === "hour" ? clamp(parsed, 1, 12) : clamp(parsed, 0, 59);

  return field === "minute"
    ? String(normalized).padStart(2, "0")
    : String(normalized);
}

function TimeField({
  value,
  onChangeText,
  onBlur,
  onFocus,
  onStep,
  accessibilityLabel,
  inputRef,
}: TimeFieldProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className="w-[74px] items-center gap-1">
      <Pressable
        className="h-5 w-5 items-center justify-center"
        accessibilityLabel={`${accessibilityLabel} increment`}
        onPress={() => onStep(1)}
      >
        <Ionicons name="chevron-up" size={14} className="text-text-secondary" />
      </Pressable>

      <TextInput
        ref={inputRef}
        className={`h-[52px] w-full rounded-[10px] border text-center font-jakarta text-body-1 text-text-primary ${
          isFocused
            ? "border-input-stroke-active bg-main-sections"
            : "border-input-stroke-default bg-input-bg"
        }`}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => {
          setIsFocused(true);
          onFocus?.();
        }}
        onBlur={() => {
          setIsFocused(false);
          onBlur();
        }}
        keyboardType="number-pad"
        keyboardAppearance="dark"
        maxLength={2}
        selectTextOnFocus
        accessibilityLabel={accessibilityLabel}
        cursorColor="#FFFFFF"
      />

      <Pressable
        className="h-5 w-5 items-center justify-center"
        accessibilityLabel={`${accessibilityLabel} decrement`}
        onPress={() => onStep(-1)}
      >
        <Ionicons name="chevron-down" size={14} className="text-text-secondary" />
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
  const initialTime = getInitialTimeState(initialDate);
  const [hour, setHour] = useState(initialTime.hour);
  const [minute, setMinute] = useState(initialTime.minute);
  const [ampm, setAmpm] = useState<"am" | "pm">(initialTime.ampm);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const hourRef = useRef<TextInput>(null);
  const minuteRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 300);
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const scrollToTime = () => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 300);
  };

  const emptyPostsMap = new Map();
  const days = getCalendarDays(currentMonth, selectedDate, emptyPostsMap);

  useEffect(() => {
    if (!isVisible) return;

    const nextTime = getInitialTimeState(initialDate);
    setSelectedDate(initialDate);
    setCurrentMonth(initialDate);
    setHour(nextTime.hour);
    setMinute(nextTime.minute);
    setAmpm(nextTime.ampm);
  }, [initialDate, isVisible]);

  const stepField = (field: "hour" | "minute", delta: number) => {
    const currentValue =
      field === "hour"
        ? parseInt(normalizeValue(hour, "hour"), 10)
        : parseInt(normalizeValue(minute, "minute"), 10);

    let nextValue: number;
    if (field === "hour") {
      // Wrap 1-12: going below 1 wraps to 12, going above 12 wraps to 1
      nextValue = ((currentValue - 1 + delta + 12) % 12) + 1;
    } else {
      // Wrap 0-59: going below 0 wraps to 59, going above 59 wraps to 0
      nextValue = (currentValue + delta + 60) % 60;
    }

    if (field === "hour") {
      setHour(String(nextValue));
    } else {
      setMinute(String(nextValue).padStart(2, "0"));
    }
  };

  const handleHourChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, "");
    if (digits.length > 2) return;

    const parsed = parseInt(digits, 10);
    if (digits.length > 0 && !Number.isNaN(parsed) && parsed > 12) {
      setHour(digits.slice(-1));
      return;
    }

    setHour(digits);

    if (digits.length === 2) {
      minuteRef.current?.focus();
    }
  };

  const handleMinuteChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, "");
    if (digits.length > 2) return;

    const parsed = parseInt(digits, 10);
    if (digits.length > 0 && !Number.isNaN(parsed) && parsed > 59) {
      setMinute(digits.slice(-1));
      return;
    }

    setMinute(digits);

    if (digits.length === 2) {
      Keyboard.dismiss();
    }
  };

  const handleHourBlur = () => {
    setHour(normalizeValue(hour, "hour"));
  };

  const handleMinuteBlur = () => {
    setMinute(normalizeValue(minute, "minute"));
  };

  const handleClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  const handleSave = () => {
    Keyboard.dismiss();

    let h = parseInt(normalizeValue(hour, "hour"), 10);
    const m = parseInt(normalizeValue(minute, "minute"), 10);
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
    <BottomSheetWrapper
      isVisible={isVisible}
      onClose={handleClose}
      showHandle={false}
      fullHeight
      containerStyle={{
        backgroundColor: "#1A1919",
        paddingHorizontal: 0,
        paddingTop: 0,
      }}
    >
      <View className="mb-8 flex-row items-center justify-between px-4 pt-5">
        <Text className="font-jakarta text-h1 font-semibold text-text-primary">
          Change Date or Time
        </Text>
        <Pressable
          className="h-5 w-5 items-center justify-center"
          onPress={handleClose}
        >
          <Ionicons name="close" size={20} color="#A3A3A3" />
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        className="flex-1 px-4"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={{ marginBottom: keyboardHeight }}
      >
        <View className="mb-3 flex-row items-center gap-4">
          <Text className="w-14 font-jakarta text-h4 font-semibold text-text-primary">
            Date
          </Text>
          <View className="h-[52px] flex-1 justify-center rounded-[10px] border border-input-stroke-default bg-input-bg px-4">
            <Text className="font-jakarta text-body-1 text-text-primary">
              {format(selectedDate, "EEE, d MMMM")}
            </Text>
          </View>
        </View>

        <View className="mb-8 rounded-[12px] bg-main-sections-2 px-4 pb-4 pt-3">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="font-jakarta text-h3 font-semibold text-text-primary">
              {formatMonthName(currentMonth)}, {currentMonth.getFullYear()}
            </Text>
            <View className="flex-row gap-2">
              <Pressable
                className="h-8 w-8 items-center justify-center"
                onPress={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <Ionicons name="chevron-back" size={18} className="text-text-secondary" />
              </Pressable>
              <Pressable
                className="h-8 w-8 items-center justify-center"
                onPress={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <Ionicons name="chevron-forward" size={18} className="text-text-secondary" />
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

        <View className="mb-8 flex-row items-center justify-between">
          <Text className="font-jakarta text-h4 font-semibold text-text-primary">
            Time
          </Text>

          <View className="flex-row items-center gap-3">
            <View className="flex-row items-center gap-1">
              <TimeField
                value={hour}
                onChangeText={handleHourChange}
                onBlur={handleHourBlur}
                onFocus={scrollToTime}
                inputRef={hourRef}
                accessibilityLabel="Hour field"
                onStep={(delta) => stepField("hour", delta)}
              />
              <Text className="font-jakarta text-body-2 font-semibold text-text-primary">
                :
              </Text>
              <TimeField
                value={minute}
                onChangeText={handleMinuteChange}
                onBlur={handleMinuteBlur}
                onFocus={scrollToTime}
                inputRef={minuteRef}
                accessibilityLabel="Minute field"
                onStep={(delta) => stepField("minute", delta)}
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

        <View className="pb-[34px] pt-6">
          <Pressable
            className="h-11 items-center justify-center rounded-[8px] bg-buttons-primary-bg"
            onPress={handleSave}
          >
            <Text className="font-jakarta text-button font-semibold text-white">
              Save
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </BottomSheetWrapper>
  );
}

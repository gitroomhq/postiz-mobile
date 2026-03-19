import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { set } from "date-fns";
import { LinearGradient } from "expo-linear-gradient";

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

type ActiveField = "hour" | "minute";

type TimeFieldProps = {
  value: string;
  isActive: boolean;
  onPress: () => void;
  onStep: (delta: number) => void;
  accessibilityLabel: string;
};

const NUMBER_PAD_ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
];

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

function normalizeDraft(value: string, field: ActiveField) {
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
  isActive,
  onPress,
  onStep,
  accessibilityLabel,
}: TimeFieldProps) {
  return (
    <View className="w-[74px] items-center gap-1">
      <Pressable
        className="h-5 w-5 items-center justify-center"
        accessibilityLabel={`${accessibilityLabel} increment`}
        onPress={() => onStep(1)}
      >
        <Ionicons name="chevron-up" size={16} className="text-icon-primary" />
      </Pressable>

      <Pressable
        className={`h-[52px] w-full items-center justify-center rounded-[10px] border ${
          isActive
            ? "border-input-stroke-active bg-main-sections"
            : "border-input-stroke-default bg-input-bg"
        }`}
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
      >
        <Text className="font-jakarta text-body-2 text-text-primary">
          {value}
          {isActive ? "|" : ""}
        </Text>
      </Pressable>

      <Pressable
        className="h-5 w-5 items-center justify-center"
        accessibilityLabel={`${accessibilityLabel} decrement`}
        onPress={() => onStep(-1)}
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
  const [activeField, setActiveField] = useState<ActiveField>("minute");
  const [replaceOnNextDigit, setReplaceOnNextDigit] = useState(true);
  const initialTime = getInitialTimeState(initialDate);
  const [hour, setHour] = useState(initialTime.hour);
  const [minute, setMinute] = useState(initialTime.minute);
  const [ampm, setAmpm] = useState<"am" | "pm">(initialTime.ampm);

  const emptyPostsMap = new Map();
  const days = getCalendarDays(currentMonth, selectedDate, emptyPostsMap);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    const nextTime = getInitialTimeState(initialDate);
    setSelectedDate(initialDate);
    setCurrentMonth(initialDate);
    setHour(nextTime.hour);
    setMinute(nextTime.minute);
    setAmpm(nextTime.ampm);
    setActiveField("minute");
    setReplaceOnNextDigit(true);
  }, [initialDate, isVisible]);

  const updateField = (field: ActiveField, nextValue: string) => {
    if (field === "hour") {
      setHour(nextValue);
      return;
    }

    setMinute(nextValue);
  };

  const stepField = (field: ActiveField, delta: number) => {
    const currentValue =
      field === "hour"
        ? parseInt(normalizeDraft(hour, "hour"), 10)
        : parseInt(normalizeDraft(minute, "minute"), 10);
    const nextValue =
      field === "hour"
        ? clamp(currentValue + delta, 1, 12)
        : clamp(currentValue + delta, 0, 59);

    updateField(
      field,
      field === "minute" ? String(nextValue).padStart(2, "0") : String(nextValue),
    );
    setActiveField(field);
    setReplaceOnNextDigit(false);
  };

  const handleFieldPress = (field: ActiveField) => {
    setActiveField(field);
    setReplaceOnNextDigit(true);
  };

  const handleDigitPress = (digit: string) => {
    const currentValue = activeField === "hour" ? hour : minute;
    const candidate = replaceOnNextDigit
      ? digit
      : `${currentValue}${digit}`.slice(-2);

    const parsed = parseInt(candidate, 10);
    let nextValue = candidate;

    if (!Number.isNaN(parsed)) {
      if (activeField === "hour" && parsed > 12) {
        nextValue = digit;
      }

      if (activeField === "minute" && parsed > 59) {
        nextValue = digit;
      }
    }

    updateField(activeField, nextValue);
    setReplaceOnNextDigit(false);
  };

  const handleBackspace = () => {
    const currentValue = activeField === "hour" ? hour : minute;
    const nextValue = currentValue.slice(0, -1);

    updateField(activeField, nextValue);
    setReplaceOnNextDigit(false);
  };

  const handleSave = () => {
    let h = parseInt(normalizeDraft(hour, "hour"), 10);
    const m = parseInt(normalizeDraft(minute, "minute"), 10);
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
      onClose={onClose}
      showHandle={false}
      containerStyle={{
        backgroundColor: "#1A1919",
        paddingHorizontal: 0,
        paddingTop: 0,
      }}
    >
      <View className="px-4 pb-4 pt-6">
        <View className="mb-6 flex-row items-center justify-between">
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

        <View className="mb-8 rounded-[12px] bg-main-sections-2 px-4 pb-4 pt-3">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="font-jakarta text-h4 font-semibold text-text-primary">
              {formatMonthName(currentMonth)}, {currentMonth.getFullYear()}
            </Text>
            <View className="flex-row gap-2">
              <Pressable
                className="h-8 w-8 items-center justify-center"
                onPress={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <Ionicons name="chevron-back" size={18} className="text-icon-primary" />
              </Pressable>
              <Pressable
                className="h-8 w-8 items-center justify-center"
                onPress={() => setCurrentMonth(addMonths(currentMonth, 1))}
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

        <View className="mb-8 flex-row items-center justify-between">
          <Text className="font-jakarta text-h4 font-semibold text-text-primary">
            Time
          </Text>

          <View className="flex-row items-center gap-3">
            <View className="flex-row items-center gap-1">
              <TimeField
                value={hour || ""}
                isActive={activeField === "hour"}
                accessibilityLabel="Hour field"
                onPress={() => handleFieldPress("hour")}
                onStep={(delta) => stepField("hour", delta)}
              />
              <Text className="font-jakarta text-body-2 font-semibold text-text-primary">
                :
              </Text>
              <TimeField
                value={minute || ""}
                isActive={activeField === "minute"}
                accessibilityLabel="Minute field"
                onPress={() => handleFieldPress("minute")}
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

        <Pressable
          className="h-11 items-center justify-center rounded-[8px] bg-buttons-primary-bg"
          onPress={handleSave}
        >
          <Text className="font-jakarta text-button font-semibold text-white">
            Save
          </Text>
        </Pressable>
      </View>

      <View className="border-t border-white/10 px-4 pb-2 pt-4">
        <View className="overflow-hidden rounded-t-[26px] rounded-b-[24px] bg-[#2B2B2E]">
          <LinearGradient
            colors={["rgba(255,255,255,0.04)", "rgba(255,255,255,0.02)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="px-2 pb-2 pt-1"
          >
            <View className="gap-[6px]">
              {NUMBER_PAD_ROWS.map((row) => (
                <View key={row.join("")} className="flex-row gap-[6px]">
                  {row.map((digit) => (
                    <Pressable
                      key={digit}
                      className="h-[46px] flex-1 items-center justify-center rounded-[12px] bg-white/15"
                      onPress={() => handleDigitPress(digit)}
                    >
                      <Text className="font-jakarta text-[28px] leading-[30px] text-white">
                        {digit}
                      </Text>
                      {digit !== "1" ? (
                        <Text className="font-jakarta text-[10px] uppercase tracking-[2px] text-white/75">
                          {{
                            "2": "ABC",
                            "3": "DEF",
                            "4": "GHI",
                            "5": "JKL",
                            "6": "MNO",
                            "7": "PQRS",
                            "8": "TUV",
                            "9": "WXYZ",
                          }[digit] ?? " "}
                        </Text>
                      ) : (
                        <Text className="font-jakarta text-[10px] text-transparent">
                          .
                        </Text>
                      )}
                    </Pressable>
                  ))}
                </View>
              ))}

              <View className="flex-row gap-[6px]">
                <Pressable className="h-[46px] flex-1 items-center justify-center rounded-[12px] bg-transparent">
                  <Text className="font-jakarta text-[18px] font-medium text-white">
                    + * #
                  </Text>
                </Pressable>

                <Pressable
                  className="h-[46px] flex-1 items-center justify-center rounded-[12px] bg-white/15"
                  onPress={() => handleDigitPress("0")}
                >
                  <Text className="font-jakarta text-[28px] leading-[30px] text-white">
                    0
                  </Text>
                  <Text className="font-jakarta text-[10px] text-transparent">
                    .
                  </Text>
                </Pressable>

                <Pressable
                  className="h-[46px] flex-1 items-center justify-center rounded-[12px] bg-transparent"
                  onPress={handleBackspace}
                >
                  <Ionicons name="backspace-outline" size={24} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>

            <LinearGradient
              colors={["rgba(97,43,211,0.75)", "rgba(97,43,211,0)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="mt-2 h-10 rounded-full"
            />
          </LinearGradient>
        </View>
      </View>
    </BottomSheetWrapper>
  );
}

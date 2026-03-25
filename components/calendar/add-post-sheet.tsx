import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";

import { BottomSheetWrapper } from "@/components/ui/bottom-sheet-wrapper";
import { isDatePassed, set } from "@/utils/calendar";

type AddPostSheetProps = {
  isVisible: boolean;
  selectedDate: Date;
  selectedHour: number;
  onClose: () => void;
  onCreatePost: (dateTime: Date) => void;
  onChangeDateTime: () => void;
};

export function AddPostSheet({
  isVisible,
  selectedDate,
  selectedHour,
  onClose,
  onCreatePost,
  onChangeDateTime,
}: AddPostSheetProps) {
  const dateTime = set(selectedDate, {
    hours: selectedHour,
    minutes: 0,
    seconds: 0,
  });
  const passed = isDatePassed(dateTime);

  return (
    <BottomSheetWrapper isVisible={isVisible} onClose={onClose}>
      <Text className="mb-5 font-jakarta text-h3 font-semibold text-text-primary">
        Add Post
      </Text>

      <Pressable
        className="mb-5 flex-row items-center justify-between"
        disabled={passed}
        onPress={onChangeDateTime}
      >
        <View className="flex-row items-center gap-2">
          <View className="h-6 w-6 items-center justify-center">
            <Ionicons name="calendar-outline" size={18} className={passed ? "text-[#5A5A5A]" : "text-icon-primary"} />
          </View>
          <Text className={`font-jakarta text-h4 font-semibold ${passed ? "text-buttons-disabled-text" : "text-text-primary"}`}>
            {format(dateTime, "MMMM d, yyyy h:mm a")
              .replace(/ AM$/, " am")
              .replace(/ PM$/, " pm")}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} className={passed ? "text-[#5A5A5A]" : "text-icon-primary"} />
      </Pressable>

      {passed ? (
        <Text className="mb-6 text-[15px] leading-[21px] tracking-[-0.25px] text-text-secondary">
          The date has passed.
        </Text>
      ) : null}

      <View className="pb-2 pt-[10px]">
        <Pressable
          className={`h-11 flex-row items-center justify-center gap-2 rounded-[8px] ${
          passed ? "bg-buttons-disabled-bg" : "bg-buttons-primary-bg"
          }`}
          disabled={passed}
          onPress={() => onCreatePost(dateTime)}
        >
          <Ionicons
            name="add"
            size={20}
            color={passed ? "#9E9E9E" : "#FFFFFF"}
          />
          <Text
            className={`font-jakarta text-button font-semibold ${
              passed ? "text-buttons-disabled-text" : "text-white"
            }`}
          >
            Create Post
          </Text>
        </Pressable>
      </View>
    </BottomSheetWrapper>
  );
}

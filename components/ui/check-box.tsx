import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "react-native";

export function CheckBox({
  checked,
  onPress,
}: {
  checked: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      className={`h-5 w-5 items-center justify-center rounded-[6px] border ${
        checked
          ? "border-main-accent-purple bg-main-accent-purple"
          : "border-[#3F3E3E] bg-background-primary"
      }`}
      onPress={onPress}
    >
      {checked ? <Ionicons name="checkmark" size={14} className="text-white" /> : null}
    </Pressable>
  );
}

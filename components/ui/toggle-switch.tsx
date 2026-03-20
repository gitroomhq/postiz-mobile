import { Pressable, View } from "react-native";

export function ToggleSwitch({
  value,
  onPress,
}: {
  value: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      className={`h-5 w-9 rounded-full px-[2px] ${value ? "bg-main-accent-purple" : "bg-[#3C3C3C]"}`}
      onPress={onPress}
    >
      <View
        className={`mt-[2px] h-4 w-4 rounded-full bg-white ${value ? "ml-4" : "ml-0"}`}
      />
    </Pressable>
  );
}

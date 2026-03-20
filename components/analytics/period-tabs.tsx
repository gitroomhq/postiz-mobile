import { Pressable, Text, View } from "react-native";

const TABS = ["Day", "Week", "Month", "Year"];

export function PeriodTabs({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (tab: string) => void;
}) {
  return (
    <View className="w-full flex-row items-center gap-[3px] rounded-[8px] border border-tab-stroke-default bg-tab-bg-default p-1">
      {TABS.map((tab) => {
        const active = tab === selected;
        return (
          <Pressable
            key={tab}
            className={`h-[34px] flex-1 items-center justify-center rounded-[6px] ${
              active ? "bg-tab-bg-active" : ""
            }`}
            onPress={() => onSelect(tab)}
          >
            <Text
              className={`font-jakarta text-[14px] ${
                active
                  ? "font-semibold text-tab-text-active"
                  : "font-normal text-tab-text-default"
              }`}
            >
              {tab}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

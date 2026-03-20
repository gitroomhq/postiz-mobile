import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import {
  Modal as RNModal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

export function DropUpSelect({
  value,
  options,
  onSelect,
}: {
  value: string;
  options: readonly string[];
  onSelect: (option: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<View>(null);
  const [pos, setPos] = useState({ x: 0, y: 0, w: 0 });

  const handleOpen = () => {
    triggerRef.current?.measureInWindow((x, y, width) => {
      setPos({ x, y, w: width });
      setOpen(true);
    });
  };

  return (
    <View>
      <View ref={triggerRef}>
        <Pressable
          className="h-[52px] flex-row items-center justify-between rounded-[10px] border border-input-stroke-default bg-background-primary px-4"
          onPress={() => (open ? setOpen(false) : handleOpen())}
        >
          <Text className="font-jakarta text-body-1 text-text-primary">
            {value}
          </Text>
          <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} className="text-icon-muted" />
        </Pressable>
      </View>

      <RNModal
        visible={open}
        transparent
        animationType="none"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          className="flex-1"
          onPress={() => setOpen(false)}
        >
          <View
            className="absolute max-h-[128px] rounded-xl bg-[#242323] p-2"
            style={{
              left: pos.x,
              top: pos.y - 128 - 8,
              width: pos.w,
              elevation: 10,
            }}
            onStartShouldSetResponder={() => true}
          >
            <ScrollView bounces={false} nestedScrollEnabled showsVerticalScrollIndicator>
              {options.map((option) => (
                <Pressable
                  key={option}
                  className={`rounded-[8px] px-3 py-[10px] ${option === value ? "bg-channel-active-bg" : ""}`}
                  onPress={() => {
                    onSelect(option);
                    setOpen(false);
                  }}
                >
                  <Text className="font-jakarta text-body-1 font-semibold text-text-primary">
                    {option}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </RNModal>
    </View>
  );
}

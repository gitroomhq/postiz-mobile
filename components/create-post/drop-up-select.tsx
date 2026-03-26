import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import { Modal, Platform, Pressable, StatusBar, Text, View } from "react-native";

const ITEM_HEIGHT = 44;

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

  const dropdownHeight = options.length * ITEM_HEIGHT + 16;

  const handleOpen = () => {
    triggerRef.current?.measureInWindow((x, y, width) => {
      const statusBarOffset = Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0;
      setPos({ x, y: y + statusBarOffset - dropdownHeight - 4, w: width });
      setOpen(true);
    });
  };

  const handleClose = () => setOpen(false);

  return (
    <View>
      <View ref={triggerRef}>
        <Pressable
          className="h-[52px] flex-row items-center justify-between rounded-[10px] border border-input-stroke-default bg-background-primary px-4"
          onPress={() => (open ? handleClose() : handleOpen())}
        >
          <Text className="font-jakarta text-body-1 text-text-primary">
            {value}
          </Text>
          <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} className="text-icon-muted" />
        </Pressable>
      </View>

      <Modal
        visible={open}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={handleClose}
      >
        <Pressable
          className="flex-1 bg-transparent"
          onPress={handleClose}
        >
          <View
            className="absolute rounded-xl bg-main-menu-bg p-2"
            style={{
              left: pos.x,
              top: pos.y,
              width: pos.w,
            }}
          >
            {options.map((option) => (
              <Pressable
                key={option}
                className={`rounded-[8px] px-3 py-[10px] ${option === value ? "bg-channel-active-bg" : ""}`}
                onPress={() => {
                  onSelect(option);
                  handleClose();
                }}
              >
                <Text className="font-jakarta text-body-1 font-semibold text-text-primary">
                  {option}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

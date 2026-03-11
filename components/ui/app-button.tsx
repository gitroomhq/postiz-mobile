import type { ReactNode } from "react";
import { Pressable, Text } from "react-native";
import type { PressableProps } from "react-native";

type AppButtonVariant = "primary" | "disabled" | "text";

type AppButtonProps = {
  label: string;
  variant?: AppButtonVariant;
  fullWidth?: boolean;
  rightSlot?: ReactNode;
} & PressableProps;

export function AppButton({
  label,
  variant = "primary",
  fullWidth = true,
  disabled,
  rightSlot,
  ...pressableProps
}: AppButtonProps) {
  const isDisabled = disabled || variant === "disabled";
  const baseClassName = "min-h-[44px] flex-row items-center justify-center rounded-[8px]";
  const widthClassName = fullWidth ? "w-full" : "";

  const variantClassName =
    variant === "text"
      ? "bg-transparent px-4"
      : variant === "disabled"
        ? "bg-buttons-disabled-bg pl-5 pr-4 pt-3 pb-[14px]"
        : "bg-buttons-primary-bg pl-5 pr-4 pt-3 pb-[14px]";

  const textClassName =
    variant === "disabled"
      ? "text-buttons-disabled-text"
      : "text-buttons-primary-text";

  return (
    <Pressable
      disabled={isDisabled}
      className={`${baseClassName} ${widthClassName} ${variantClassName}`.trim()}
      {...pressableProps}
    >
      <Text className={`font-jakarta text-[15px] font-semibold ${textClassName}`}>
        {label}
      </Text>
      {rightSlot}
    </Pressable>
  );
}

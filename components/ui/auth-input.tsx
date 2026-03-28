import { forwardRef, useCallback, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Text, TextInput, View } from "react-native";
import type { TextInputProps } from "react-native";

type AuthInputProps = {
  label: string;
  hint?: string;
  error?: boolean;
  rightSlot?: ReactNode;
} & TextInputProps;

export const AuthInput = forwardRef<TextInput, AuthInputProps>(
  function AuthInput(
    {
      label,
      hint,
      error = false,
      rightSlot,
      secureTextEntry,
      onFocus,
      onBlur,
      ...textInputProps
    },
    ref
  ) {
    const internalRef = useRef<TextInput>(null);
    const [focused, setFocused] = useState(false);

    const setRef = useCallback(
      (node: TextInput | null) => {
        internalRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as React.RefObject<TextInput | null>).current = node;
      },
      [ref]
    );

    const handleFocus: TextInputProps["onFocus"] = (e) => {
      setFocused(true);
      onFocus?.(e);
    };

    const handleBlur: TextInputProps["onBlur"] = (e) => {
      setFocused(false);
      onBlur?.(e);
    };

    const borderClassName = error
      ? "border-text-critical"
      : focused
      ? "border-input-stroke-active"
      : "border-input-stroke-default";

    return (
      <View className="gap-2">
        <Text className="font-jakarta text-[14px] font-semibold leading-[14px] text-text-primary">
          {label}
        </Text>
        <View
          className={`h-[52px] flex-row items-center gap-2 overflow-hidden rounded-[10px] border bg-input-bg py-1 pl-4 pr-3 ${borderClassName}`}
        >
          <TextInput
            ref={setRef}
            className="flex-1 self-stretch font-jakarta text-[14px] text-text-primary"
            placeholderTextColor="#A3A3A3"
            secureTextEntry={secureTextEntry}
            autoCorrect={false}
            autoCapitalize="none"
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...textInputProps}
          />
          {rightSlot}
        </View>
        {hint ? (
          <Text className="font-jakarta text-xs font-medium leading-3 text-text-critical">
            {hint}
          </Text>
        ) : null}
      </View>
    );
  }
);

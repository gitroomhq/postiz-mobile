import { forwardRef, useCallback, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Platform, Pressable, Text, TextInput, View } from "react-native";
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

    const handlePressField = () => {
      internalRef.current?.focus();
    };
    const shouldUseIosSecureWorkaround =
      Platform.OS === "ios" && !!secureTextEntry;
    const value =
      typeof textInputProps.value === "string" ? textInputProps.value : "";

    const borderClass = error
      ? "border-[#F87171]"
      : focused
      ? "border-[#7C3AED]"
      : "border-[#3A3838]";

    return (
      <View className="gap-2">
        <Text className="font-jakarta text-[14px] font-semibold leading-[14px] text-text-primary">
          {label}
        </Text>
        <Pressable
          onPress={handlePressField}
          className={`h-[52px] flex-row items-center gap-2 overflow-hidden rounded-[10px] border bg-[#1E1D1D] py-1 pl-4 pr-3 ${borderClass}`}
        >
          <View className="relative flex-1 self-stretch justify-center">
            <TextInput
              ref={setRef}
              className={`flex-1 text-text-primary ${secureTextEntry ? "text-[14px]" : "font-jakarta text-body-1"} ${shouldUseIosSecureWorkaround ? "text-transparent" : ""}`}
              placeholderTextColor="#A3A3A3"
              secureTextEntry={shouldUseIosSecureWorkaround ? false : secureTextEntry}
              autoCorrect={false}
              autoCapitalize="none"
              onFocus={handleFocus}
              onBlur={handleBlur}
              rejectResponderTermination={false}
              selectionColor="#7C3AED"
              {...textInputProps}
            />
            {shouldUseIosSecureWorkaround ? (
              <View pointerEvents="none" className="absolute inset-0 justify-center">
                <Text
                  numberOfLines={1}
                  className="text-text-primary text-[14px]"
                  style={{ includeFontPadding: false }}
                >
                  {"•".repeat(value.length)}
                </Text>
              </View>
            ) : null}
          </View>
          {rightSlot}
        </Pressable>
        {hint ? (
          <Text className="font-jakarta text-xs font-medium leading-3 text-text-critical">
            {hint}
          </Text>
        ) : null}
      </View>
    );
  }
);

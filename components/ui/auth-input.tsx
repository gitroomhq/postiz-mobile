import { forwardRef, useCallback, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
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

    const borderClassName = error
      ? styles.borderError
      : focused
      ? styles.borderFocused
      : styles.borderDefault;
    const inputStyle = secureTextEntry
      ? styles.inputSecure
      : styles.input;

    return (
      <View style={styles.wrapper}>
        <Text className="font-jakarta text-[14px] font-semibold leading-[14px] text-text-primary">
          {label}
        </Text>
        <Pressable
          onPress={handlePressField}
          style={[styles.field, borderClassName]}
        >
          <View style={styles.inputContainer}>
            <TextInput
              ref={setRef}
              style={[
                inputStyle,
                shouldUseIosSecureWorkaround ? styles.inputHiddenText : null,
              ]}
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
              <View pointerEvents="none" style={styles.maskOverlay}>
                <Text numberOfLines={1} style={styles.maskText}>
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

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  field: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    overflow: "hidden",
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: "#1E1D1D",
    paddingVertical: 4,
    paddingLeft: 16,
    paddingRight: 12,
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "PlusJakartaSans",
  },
  inputSecure: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
  },
  inputContainer: {
    position: "relative",
    flex: 1,
    alignSelf: "stretch",
    justifyContent: "center",
  },
  inputHiddenText: {
    color: "transparent",
  },
  maskOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  maskText: {
    color: "#FFFFFF",
    fontSize: 14,
    includeFontPadding: false,
  },
  borderDefault: {
    borderColor: "#3A3838",
  },
  borderFocused: {
    borderColor: "#7C3AED",
  },
  borderError: {
    borderColor: "#F87171",
  },
});

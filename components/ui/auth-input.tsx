import type { ReactNode } from 'react';
import { Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';

type AuthInputProps = {
  label: string;
  hint?: string;
  focused?: boolean;
  error?: boolean;
  rightSlot?: ReactNode;
} & TextInputProps;

export function AuthInput({
  label,
  hint,
  focused = false,
  error = false,
  rightSlot,
  ...textInputProps
}: AuthInputProps) {
  const borderClassName = error
    ? 'border-text-critical'
    : focused
      ? 'border-input-stroke-active'
      : 'border-input-stroke-default';

  return (
    <View className="gap-2">
      <Text className="font-jakarta text-sm font-semibold text-text-primary">
        {label}
      </Text>
      <View
        className={`h-[52px] flex-row items-center gap-2 rounded-[10px] border bg-input-bg pl-4 pr-3 ${borderClassName}`}>
        <TextInput
          className="flex-1 font-jakarta text-sm text-text-primary placeholder:text-text-secondary"
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

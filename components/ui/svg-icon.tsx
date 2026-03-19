import { Image as ExpoImage, type ImageProps } from "expo-image";
import type { FC } from "react";
import { View } from "react-native";

const Image = ExpoImage as unknown as FC<ImageProps>;

type SvgIconProps = {
  source: any;
  size: number;
  tintColor?: string;
  opacity?: number;
  rotation?: string;
};

export function SvgIcon({ source, size, tintColor, opacity, rotation }: SvgIconProps) {
  return (
    <View
      style={{
        width: size,
        height: size,
        opacity,
        transform: rotation ? [{ rotate: rotation }] : undefined,
      }}
    >
      <Image
        source={source}
        style={{ width: size, height: size }}
        contentFit="contain"
        tintColor={tintColor}
      />
    </View>
  );
}

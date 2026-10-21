import { Image as ExpoImage, type ImageProps } from "expo-image";
import type { FC } from "react";

// expo-image's Image is a class component — cast to FC so React 19 JSX types accept it
export const Image = ExpoImage as unknown as FC<ImageProps>;

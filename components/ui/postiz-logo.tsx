import { Image } from "expo-image";
import { View } from "react-native";

type PostizLogoProps = {
  width?: number;
  height?: number;
};

export function PostizLogo({ width = 84, height = 27.359 }: PostizLogoProps) {
  return (
    <View style={{ width, height }}>
      <View style={{ position: "absolute", inset: 0, right: "70.6%" }}>
        <Image
          source={require("@/assets/icons/login/postiz-mark.svg")}
          style={{ width: width * 0.294048, height }}
          contentFit="contain"
        />
      </View>

      <View
        style={{
          position: "absolute",
          top: "1.61%",
          bottom: "10.76%",
          left: "37.32%",
          right: 0,
        }}
      >
        <Image
          source={require("@/assets/icons/login/postiz-wordmark.svg")}
          style={{ width: width * 0.626786, height: height * 0.87649 }}
          contentFit="contain"
        />
      </View>
    </View>
  );
}

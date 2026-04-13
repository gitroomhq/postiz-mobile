import { memo, useCallback, useRef, useState, type ReactNode } from "react";
import { useWindowDimensions, View, type LayoutChangeEvent } from "react-native";
import Carousel from "react-native-reanimated-carousel";

type DaySwiperProps = {
  onChangeDate: (direction: number) => void;
  enabled?: boolean;
  /** Receives absolute day offset from initial date (0 = today, -1 = yesterday, etc) */
  renderPage: (dayOffset: number) => ReactNode;
};

const TOTAL_ITEMS = 10001;
const CENTER_INDEX = 5000;
const DATA = new Array(TOTAL_ITEMS).fill(0);

export const DaySwiper = memo(function DaySwiper({
  onChangeDate,
  enabled = true,
  renderPage,
}: DaySwiperProps) {
  const { width: screenWidth } = useWindowDimensions();
  const [height, setHeight] = useState(0);
  const currentIndex = useRef(CENTER_INDEX);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    setHeight(e.nativeEvent.layout.height);
  }, []);

  const handleSnapToItem = useCallback(
    (index: number) => {
      const diff = index - currentIndex.current;
      if (diff !== 0) {
        currentIndex.current = index;
        onChangeDate(diff);
      }
    },
    [onChangeDate],
  );

  const renderItem = useCallback(
    ({ index }: { index: number }) => {
      const dayOffset = index - CENTER_INDEX;
      return (
        <View style={{ flex: 1, width: screenWidth }}>
          {renderPage(dayOffset)}
        </View>
      );
    },
    [renderPage, screenWidth],
  );

  return (
    <View style={{ flex: 1 }} onLayout={handleLayout}>
      {height > 0 && (
        <Carousel
          width={screenWidth}
          height={height}
          data={DATA}
          defaultIndex={CENTER_INDEX}
          renderItem={renderItem}
          onSnapToItem={handleSnapToItem}
          enabled={enabled}
          loop={false}
          windowSize={5}
          overscrollEnabled
        />
      )}
    </View>
  );
});

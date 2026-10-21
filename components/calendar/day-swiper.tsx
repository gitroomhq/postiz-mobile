import {
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useWindowDimensions, View, type LayoutChangeEvent } from "react-native";
import Carousel, { type ICarouselInstance } from "react-native-reanimated-carousel";

export type DaySwiperHandle = {
  /**
   * Programmatically jump the carousel to a day offset (0 = the day the
   * swiper was mounted on, ±N = days from there). Used when the user
   * picks a date from the month calendar — without this the swiper
   * stayed on its previous page and the change felt broken.
   */
  goToOffset: (dayOffset: number, animated?: boolean) => void;
};

type DaySwiperProps = {
  onChangeDate: (direction: number) => void;
  enabled?: boolean;
  /** Receives absolute day offset from initial date (0 = today, -1 = yesterday, etc) */
  renderPage: (dayOffset: number) => ReactNode;
};

const TOTAL_ITEMS = 10001;
const CENTER_INDEX = 5000;
const DATA = new Array(TOTAL_ITEMS).fill(0);

export const DaySwiper = memo(
  forwardRef<DaySwiperHandle, DaySwiperProps>(function DaySwiper(
    { onChangeDate, enabled = true, renderPage },
    ref,
  ) {
    const { width: screenWidth } = useWindowDimensions();
    const [height, setHeight] = useState(0);
    const currentIndex = useRef(CENTER_INDEX);
    const carouselRef = useRef<ICarouselInstance>(null);

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

    useImperativeHandle(
      ref,
      () => ({
        goToOffset: (dayOffset, animated = true) => {
          const targetIndex = CENTER_INDEX + dayOffset;
          const diff = targetIndex - currentIndex.current;
          if (diff === 0) return;
          // Update our internal cursor BEFORE asking the carousel to
          // scroll, otherwise onSnapToItem will fire and double-call
          // onChangeDate (the parent already drove the new selectedDate
          // before calling goToOffset).
          currentIndex.current = targetIndex;
          carouselRef.current?.scrollTo({ count: diff, animated });
        },
      }),
      [],
    );

    return (
      <View style={{ flex: 1 }} onLayout={handleLayout}>
        {height > 0 && (
          <Carousel
            ref={carouselRef}
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
  }),
);

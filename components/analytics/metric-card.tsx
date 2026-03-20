import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Text, View } from "react-native";
import { LineChart as GiftedLineChart } from "react-native-gifted-charts";

import type { ChartSpec } from "@/types";

export function MetricCard({
  title,
  dotColor,
  trend,
  value,
  chart,
}: {
  title: string;
  dotColor: string;
  trend: string;
  value: string;
  chart: ChartSpec;
}) {
  const [chartWidth, setChartWidth] = useState(0);
  const spacing =
    chart.data.length > 1 ? chartWidth / (chart.data.length - 1) : 0;

  return (
    <View className="h-[199.641px] w-full rounded-[12px] bg-main-bg p-[12.82px]">
      <View className="mb-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-1">
          <View
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: dotColor }}
          />
          <Text className="font-jakarta text-[15px] font-semibold text-text-primary">
            {title}
          </Text>
        </View>

        <View className="flex-row items-center gap-1">
          <Ionicons name="caret-up" size={12} color="#00EB75" />
          <Text className="font-jakarta text-[12px] font-medium text-text-success">
            {trend}
          </Text>
        </View>
      </View>

      <View
        className="h-[100px] w-full overflow-hidden"
        onLayout={(event) => setChartWidth(event.nativeEvent.layout.width)}
      >
        {chartWidth > 0 ? (
          <GiftedLineChart
            data={chart.data}
            color={chart.color}
            thickness={1.6}
            curved
            hideDataPoints
            animateOnDataChange={false}
            disableScroll
            adjustToWidth
            spacing={spacing}
            initialSpacing={0}
            endSpacing={0}
            yAxisThickness={0}
            xAxisThickness={0}
            hideYAxisText
            hideRules
            width={chartWidth}
            height={80}
            maxValue={70}
            noOfSections={4}
            yAxisLabelWidth={0}
          />
        ) : null}
      </View>

      <Text className="mt-3 font-jakarta text-h1 font-semibold text-text-primary">
        {value}
      </Text>
    </View>
  );
}

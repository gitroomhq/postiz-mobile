import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { LineChart as GiftedLineChart } from "react-native-gifted-charts";
import { SafeAreaView } from "react-native-safe-area-context";

import { MainTabNavbar } from "@/components/ui/main-tab-navbar";

const ICON_PRIMARY = "#A3A3A3";
const WHITE = "#FFFFFF";

type ChannelNetwork =
  | "facebook"
  | "instagram"
  | "linkedin"
  | "tiktok"
  | "youtube";

type Channel = {
  id: string;
  name: string;
  network: ChannelNetwork;
  avatar: string;
};

const CHANNELS: Channel[] = [
  {
    id: "1",
    name: "Hamilton Dan",
    network: "instagram",
    avatar: "https://i.pravatar.cc/64?img=11",
  },
  {
    id: "2",
    name: "Daniel Hamilton",
    network: "facebook",
    avatar: "https://i.pravatar.cc/64?img=12",
  },
  {
    id: "3",
    name: "Daniel Hamilton",
    network: "linkedin",
    avatar: "https://i.pravatar.cc/64?img=13",
  },
  {
    id: "4",
    name: "Hamilton Dan",
    network: "youtube",
    avatar: "https://i.pravatar.cc/64?img=14",
  },
  {
    id: "5",
    name: "Daniel Hamilton",
    network: "tiktok",
    avatar: "https://i.pravatar.cc/64?img=15",
  },
];

const NETWORK_CONFIG: Record<
  ChannelNetwork,
  { bg: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  facebook: { bg: "#1877F2", icon: "logo-facebook" },
  instagram: { bg: "#D62976", icon: "logo-instagram" },
  linkedin: { bg: "#0A66C2", icon: "logo-linkedin" },
  youtube: { bg: "#FF0000", icon: "logo-youtube" },
  tiktok: { bg: "#000000", icon: "logo-tiktok" },
};

type ChartSpec = {
  data: { value: number }[];
  color: string;
};

const CHART_FOLLOWERS: ChartSpec = {
  data: [
    { value: 14 },
    { value: 30 },
    { value: 20 },
    { value: 26 },
    { value: 43 },
    { value: 18 },
    { value: 24 },
    { value: 58 },
    { value: 64 },
    { value: 35 },
    { value: 48 },
    { value: 22 },
    { value: 44 },
  ],
  color: "#FC69FF",
};

const CHART_ENGAGEMENT: ChartSpec = {
  data: [
    { value: 46 },
    { value: 44 },
    { value: 55 },
    { value: 50 },
    { value: 33 },
    { value: 60 },
    { value: 57 },
    { value: 65 },
    { value: 43 },
    { value: 36 },
    { value: 41 },
    { value: 30 },
    { value: 18 },
  ],
  color: "#618DFF",
};

const CHART_IMPRESSIONS: ChartSpec = {
  data: [
    { value: 18 },
    { value: 23 },
    { value: 35 },
    { value: 30 },
    { value: 43 },
    { value: 50 },
    { value: 45 },
    { value: 66 },
    { value: 62 },
    { value: 58 },
    { value: 48 },
    { value: 40 },
    { value: 47 },
  ],
  color: "#7C3FFF",
};

function NotificationBell() {
  return (
    <View className="h-6 w-6 items-center justify-center">
      <Ionicons name="notifications-outline" size={22} color={ICON_PRIMARY} />
      <View className="absolute right-[2px] top-[2px] h-[6px] w-[6px] rounded-full bg-main-accent-pink" />
    </View>
  );
}

function ChannelAvatar({ channel }: { channel: Channel }) {
  const config = NETWORK_CONFIG[channel.network];
  return (
    <View className="relative">
      <Image
        source={{ uri: channel.avatar }}
        style={{ width: 32, height: 32, borderRadius: 6 }}
        resizeMode="cover"
      />
      <View
        className="absolute -bottom-1 -right-1 h-4 w-4 items-center justify-center rounded-[4px]"
        style={{ backgroundColor: config.bg }}
      >
        <Ionicons name={config.icon} size={10} color={WHITE} />
      </View>
    </View>
  );
}

function ChannelSelector({
  selected,
  onSelect,
}: {
  selected: Channel;
  onSelect: (channel: Channel) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View style={{ position: "relative", zIndex: 10 }}>
      <Pressable
        className="h-[52px] w-full flex-row items-center justify-between rounded-[10px] border border-input-stroke-default bg-input-bg px-3"
        onPress={() => setOpen(!open)}
      >
        <View className="flex-row items-center gap-3">
          <ChannelAvatar channel={selected} />
          <Text className="font-jakarta text-body-1 text-text-primary">
            {selected.name}
          </Text>
        </View>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={16}
          color={ICON_PRIMARY}
        />
      </Pressable>

      {open ? (
        <View
          className="rounded-[12px] bg-main-sections p-2"
          style={{
            position: "absolute",
            top: 56,
            left: 0,
            right: 0,
            zIndex: 20,
            elevation: 10,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
          }}
        >
          {CHANNELS.map((channel) => (
            <Pressable
              key={channel.id}
              className={`flex-row items-center gap-3 rounded-[8px] px-3 py-3 ${
                channel.id === selected.id ? "bg-channel-active-bg" : ""
              }`}
              onPress={() => {
                onSelect(channel);
                setOpen(false);
              }}
            >
              <ChannelAvatar channel={channel} />
              <Text className="flex-1 font-jakarta text-body-1 text-text-primary">
                {channel.name}
              </Text>
              {channel.id === selected.id ? (
                <Ionicons name="checkmark" size={18} color="#612BD3" />
              ) : null}
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function PeriodTabs({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (tab: string) => void;
}) {
  const tabs = ["Day", "Week", "Month", "Year"];

  return (
    <View className="w-full flex-row items-center gap-[3px] rounded-[8px] border border-tab-stroke-default bg-tab-bg-default p-1">
      {tabs.map((tab) => {
        const active = tab === selected;
        return (
          <Pressable
            key={tab}
            className={`h-[34px] flex-1 items-center justify-center rounded-[6px] ${
              active ? "bg-tab-bg-active" : ""
            }`}
            onPress={() => onSelect(tab)}
          >
            <Text
              className={`font-jakarta text-[14px] ${
                active
                  ? "font-semibold text-tab-text-active"
                  : "font-normal text-tab-text-default"
              }`}
            >
              {tab}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function MetricCard({
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

export default function AnalyticsScreen() {
  const router = useRouter();
  const [selectedChannel, setSelectedChannel] = useState(CHANNELS[0]);
  const [selectedPeriod, setSelectedPeriod] = useState("Month");

  return (
    <SafeAreaView className="flex-1 bg-main-sections" edges={["top"]}>
      <StatusBar style="light" />

      <View className="h-[60px] flex-row items-center justify-between px-4">
        <Text className="font-jakarta text-h2 font-semibold text-text-primary">
          Analytics
        </Text>
        <Pressable onPress={() => router.push("/(tabs)/notifications")}>
          <NotificationBell />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ gap: 24, paddingTop: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-2">
          <Text className="font-jakarta text-body-2 font-semibold text-text-primary">
            Channel
          </Text>
          <ChannelSelector
            selected={selectedChannel}
            onSelect={setSelectedChannel}
          />
        </View>

        <View className="gap-3">
          <PeriodTabs selected={selectedPeriod} onSelect={setSelectedPeriod} />

          <View className="gap-2">
            <MetricCard
              title="Page Followers"
              dotColor="#FC69FF"
              trend="5.0%"
              value="2926"
              chart={CHART_FOLLOWERS}
            />
            <MetricCard
              title="Posts Engagement"
              dotColor="#618DFF"
              trend="5.0%"
              value="2926"
              chart={CHART_ENGAGEMENT}
            />
            <MetricCard
              title="Posts Impressions"
              dotColor="#612BD3"
              trend="5.0%"
              value="2926"
              chart={CHART_IMPRESSIONS}
            />
          </View>
        </View>
      </ScrollView>

      <MainTabNavbar activeTab="analytics" />
    </SafeAreaView>
  );
}

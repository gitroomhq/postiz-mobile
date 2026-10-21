import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ChannelSelector } from "@/components/analytics/channel-selector";
import { MetricCard } from "@/components/analytics/metric-card";
import { PeriodTabs } from "@/components/analytics/period-tabs";
import { MainTabNavbar } from "@/components/ui/main-tab-navbar";
import { NotificationBellButton } from "@/components/ui/notification-bell-button";
import { CHART_ENGAGEMENT, CHART_FOLLOWERS, CHART_IMPRESSIONS } from "@/data/mock-charts";
import { useChannelsStore } from "@/store/channels-store";

export default function AnalyticsScreen() {
  const channels = useChannelsStore((state) => state.channels);
  const [selectedChannel, setSelectedChannel] = useState(channels[0] ?? null);
  const [selectedPeriod, setSelectedPeriod] = useState("Month");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-main-sections" edges={["top"]}>
      <StatusBar style="light" />

      <View className="h-[60px] flex-row items-center justify-between px-4">
        <Text className="font-jakarta text-h2 font-semibold text-text-primary">
          Analytics
        </Text>
        <NotificationBellButton />
      </View>

      {channels.length === 0 || !selectedChannel ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center font-jakarta text-h3 font-semibold text-text-primary">
            No Channels Connected
          </Text>
          <Text className="mt-2 text-center font-jakarta text-body-1 text-text-secondary">
            Connect a channel to see your analytics.
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ gap: 24, paddingTop: 16, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!dropdownOpen}
        >
          <View className="gap-2">
            <Text className="font-jakarta text-body-2 font-semibold text-text-primary">
              Channel
            </Text>
            <ChannelSelector
              selected={selectedChannel}
              onSelect={setSelectedChannel}
              onOpenChange={setDropdownOpen}
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
      )}

      <MainTabNavbar activeTab="analytics" />
    </SafeAreaView>
  );
}

import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { Pressable, Text, View } from "react-native";

import { Image } from "@/components/ui/image";
import { NETWORK_CONFIG } from "@/constants/networks";
import type { ScheduledPost } from "@/types";

function parseStyledSegments(html: string): { text: string; bold: boolean; underline: boolean }[] {
  if (!html) return [];

  let content = html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>\s*<p[^>]*>/gi, " ")
    .replace(/^<p[^>]*>/i, "")
    .replace(/<\/p>\s*$/i, "");

  const segments: { text: string; bold: boolean; underline: boolean }[] = [];
  let bold = false;
  let underline = false;
  const tagRe = /<(\/?)(strong|b|u)(?:\s[^>]*)?>/gi;
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = tagRe.exec(content)) !== null) {
    if (m.index > last) {
      const raw = content.slice(last, m.index).replace(/<[^>]*>/g, "");
      if (raw) segments.push({ text: raw, bold, underline });
    }
    const closing = m[1] === "/";
    const tag = m[2].toLowerCase();
    if (tag === "strong" || tag === "b") bold = !closing;
    else if (tag === "u") underline = !closing;
    last = m.index + m[0].length;
  }

  if (last < content.length) {
    const raw = content.slice(last).replace(/<[^>]*>/g, "");
    if (raw) segments.push({ text: raw, bold, underline });
  }

  return segments;
}

function StyledPreview({ html, style }: { html: string; style?: string }) {
  const segments = parseStyledSegments(html);
  const hasFormatting = segments.some((s) => s.bold || s.underline);

  if (!hasFormatting) {
    const plain = segments.map((s) => s.text).join("").trim();
    return (
      <Text className={`font-jakarta text-body-4 text-text-primary ${style ?? ""}`} numberOfLines={1}>
        {plain}
      </Text>
    );
  }

  return (
    <Text className={`font-jakarta text-body-4 text-text-primary ${style ?? ""}`} numberOfLines={1}>
      {segments.map((seg, i) => (
        <Text
          key={i}
          style={{
            fontWeight: seg.bold ? "700" : undefined,
            textDecorationLine: seg.underline ? "underline" : undefined,
          }}
        >
          {seg.text}
        </Text>
      ))}
    </Text>
  );
}

type TimelineEventCardProps = {
  post: ScheduledPost;
  isSelected: boolean;
  onPress: () => void;
};

export const TimelineEventCard = memo(function TimelineEventCard({ post, isSelected, onPress }: TimelineEventCardProps) {
  const network = NETWORK_CONFIG[post.network];
  const contentHtml = post.content || post.title;

  return (
    <Pressable onPress={onPress} className="relative">
      {/* Card content — no border styling here so backgrounds always render */}
      <View className={`${post.status === "draft" ? "h-[88px]" : "h-[72px]"} overflow-hidden rounded-lg`}>
        <View
          className="h-6 items-center justify-center px-2"
          style={{ backgroundColor: post.tagColor || "#3B64F6" }}
        >
          <Text
            className="font-jakarta text-caption font-medium leading-[15px] text-white"
            numberOfLines={1}
          >
            {post.tagLabel || post.category}
          </Text>
        </View>

        <View className="flex-1 flex-row items-center gap-2 bg-slot-bg-post p-2">
          <View className="relative">
            <Image
              source={{ uri: post.authorAvatar }}
              className="w-5 h-5 rounded"
              contentFit="cover"
            />
            <View
              className="absolute bottom-[-2px] right-[-2px] h-[10px] w-[10px] items-center justify-center rounded-[1px]"
              style={{ backgroundColor: network.bg }}
            >
              <Ionicons name={network.icon} size={7} color="#FFFFFF" />
            </View>
          </View>

          <View className="flex-1 justify-center">
            {post.status === "draft" ? (
              <>
                <Text className="font-jakarta text-body-4 font-bold text-text-primary" numberOfLines={1}>
                  Draft:
                </Text>
                <StyledPreview html={contentHtml} style="font-medium" />
              </>
            ) : (
              <StyledPreview html={contentHtml} style="font-medium" />
            )}
          </View>
        </View>
      </View>

      {/* Selection border overlay — absolutely positioned so it never touches overflow:hidden */}
      {isSelected && (
        <View
          pointerEvents="none"
          className="absolute inset-0 rounded-[8px] border-2 border-slot-stroke-active"
        />
      )}
    </Pressable>
  );
});

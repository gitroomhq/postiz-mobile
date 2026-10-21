import { BlurView } from "expo-blur";
import { Dimensions, Pressable, Text, View } from "react-native";
import Modal from "react-native-modal";

/**
 * Mirrors the web composer's republish-vs-update prompt
 * (manage.modal.tsx:201-244). Triggered when the user taps Schedule or
 * Post Now on a post that is already PUBLISHED, or QUEUE'd in the past
 * (i.e. the scheduled time has already elapsed). Two choices:
 *  - "Just update the post details" → caller forces type='update' so the
 *    backend skips startWorkflow and only updates fields in place.
 *  - "Republish the post" → caller keeps the literal action so the
 *    backend re-queues / re-publishes.
 *
 * Backdrop press / X = cancel, propagates as `null` to the caller's
 * Promise so the submit aborts cleanly.
 */
function CloseLargeIcon() {
  return (
    <View className="h-5 w-5 items-center justify-center">
      <View className="absolute h-[1.5px] w-3 rounded-full bg-[#A3A3A3] rotate-45" />
      <View className="absolute h-[1.5px] w-3 rounded-full bg-[#A3A3A3] -rotate-45" />
    </View>
  );
}

export type RepublishChoice = "update" | "republish";

type Props = {
  visible: boolean;
  onChoose: (choice: RepublishChoice) => void;
  onCancel: () => void;
  /** Override copy for the right-hand action — "Republish" in the composer,
   * "Reschedule" on the timeline drop (mirrors web `calendar.tsx:706`). */
  republishLabel?: string;
};

export function RepublishChoiceDialog({
  visible,
  onChoose,
  onCancel,
  republishLabel = "Republish the post",
}: Props) {
  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onCancel}
      onBackButtonPress={onCancel}
      animationIn="fadeIn"
      animationOut="fadeOut"
      animationInTiming={200}
      animationOutTiming={200}
      useNativeDriver
      useNativeDriverForBackdrop
      backdropOpacity={0}
      backdropTransitionOutTiming={200}
      statusBarTranslucent
      deviceHeight={Dimensions.get("screen").height}
      style={{ margin: 0 }}
    >
      <View className="flex-1 bg-[rgba(65,64,66,0.3)]">
        <BlurView
          intensity={20}
          tint="dark"
          blurMethod="dimezisBlurView"
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <Pressable
          className="flex-1 items-center justify-center"
          onPress={onCancel}
        >
          <Pressable
            className="mx-5 w-full max-w-[335px] rounded-[24px] bg-main-sections px-6 pb-6 pt-12"
            style={{
              shadowColor: "#000000",
              shadowOffset: { width: 0, height: 13 },
              shadowOpacity: 0.1,
              shadowRadius: 28,
              elevation: 24,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <Pressable
              className="absolute right-5 top-5 h-5 w-5 items-center justify-center"
              onPress={onCancel}
            >
              <CloseLargeIcon />
            </Pressable>

            <Text className="mb-2 text-center font-jakarta text-h1 font-semibold text-text-primary">
              What do you want to do?
            </Text>
            <Text className="mb-8 text-center font-jakarta text-body-1 text-text-secondary">
              This post was already published. What do you want to do?
            </Text>
            <View className="gap-3">
              <Pressable
                className="h-11 items-center justify-center rounded-[8px] border border-buttons-stroke-stroke"
                onPress={() => onChoose("update")}
              >
                <Text className="font-jakarta text-button font-semibold text-text-primary">
                  Just update the post details
                </Text>
              </Pressable>
              <Pressable
                className="h-11 items-center justify-center rounded-[8px] bg-buttons-primary-bg"
                onPress={() => onChoose("republish")}
              >
                <Text className="font-jakarta text-button font-semibold text-white">
                  {republishLabel}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </View>
    </Modal>
  );
}

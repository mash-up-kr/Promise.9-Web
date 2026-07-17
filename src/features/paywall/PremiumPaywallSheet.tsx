import { useRouter } from "expo-router";
import { Check, Sparkles, X } from "lucide-react-native";
import { Pressable, View } from "react-native";

import { Icon } from "@/components/ui/icon/Icon";
import { useSnackbar } from "@/components/ui/snackbar/SnackbarProvider";
import { Text } from "@/components/ui/text/Text";

const BENEFITS = [
  "무제한 링크 저장",
  "AI 요약·태그 무제한",
  "광고 없이 쾌적하게",
];

export interface PremiumPaywallSheetProps {
  // 시트를 닫고 원래 화면으로 돌아간다(에러 바운더리 리셋).
  onDismiss: () => void;
}

/**
 * 의도치 않은 상황에서 화면이 깨질 때 오류 대신 뜨는 "Pro 결제 유도" 바텀시트.
 * 진짜 결제를 유도하는 것처럼 보이지만, 결제를 누르면 이스터에그임을 슬쩍 알려준다.
 */
export function PremiumPaywallSheet({ onDismiss }: PremiumPaywallSheetProps) {
  const router = useRouter();
  const { show } = useSnackbar();

  const handleSubscribe = () => {
    show({ message: "🥚 이스터에그를 발견했어요! 결제는 장난이에요 :)" });
    onDismiss();
  };

  const handleGoHome = () => {
    router.replace("/");
    onDismiss();
  };

  return (
    <View className="flex-1 justify-end bg-[rgba(0,0,0,0.72)]">
      <Pressable
        accessibilityLabel="결제 안내 닫기"
        onPress={onDismiss}
        className="flex-1"
      />

      <View className="gap-6 rounded-t-[28px] bg-background-base px-6 pt-8 pb-10">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="닫기"
          onPress={onDismiss}
          hitSlop={8}
          className="absolute top-5 right-5"
        >
          <Icon iconNode={X} size={22} className="text-icon-normal" />
        </Pressable>

        <View className="items-center gap-3">
          <View className="size-16 items-center justify-center rounded-full bg-[rgba(96,165,250,0.16)]">
            <Icon iconNode={Sparkles} size={30} className="text-blue-400" />
          </View>
          <View className="items-center gap-1.5">
            <Text variant="heading-2" className="text-text-strong">
              Pro 전용 기능이에요
            </Text>
            <Text
              variant="body-2-normal"
              className="text-center text-text-assistive"
            >
              방금 그 동작은 Link-dingdong Pro에서만 쓸 수 있어요.{"\n"}
              지금 업그레이드하고 계속 이어가 보세요.
            </Text>
          </View>
        </View>

        <View className="gap-3">
          {BENEFITS.map((benefit) => (
            <View key={benefit} className="flex-row items-center gap-2.5">
              <Icon iconNode={Check} size={18} className="text-blue-400" />
              <Text variant="body-2-normal" className="text-text-neutral">
                {benefit}
              </Text>
            </View>
          ))}
        </View>

        <View className="items-center gap-0.5">
          <Text
            variant="caption-1"
            className="text-text-assistive line-through"
          >
            월 9,900원
          </Text>
          <Text variant="body-1" className="text-text-strong">
            첫 달 무료 · 이후 월 4,900원
          </Text>
        </View>

        <View className="gap-2">
          <Pressable
            accessibilityRole="button"
            onPress={handleSubscribe}
            className="h-14 items-center justify-center rounded-2xl bg-blue-500 active:opacity-90"
          >
            <Text variant="body-1" className="text-white">
              Pro 시작하기
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={handleGoHome}
            className="h-12 items-center justify-center rounded-2xl active:opacity-70"
          >
            <Text variant="body-2-normal" className="text-text-assistive">
              다음에 할게요
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

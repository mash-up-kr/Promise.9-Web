import { Image, Pressable, View } from "react-native";

import { useSheetDismiss } from "@/components/ui/bottom-sheet/useSheetDismiss";
import { Text } from "@/components/ui/text/Text";

import type { ShareSaveState } from "../share.reducer";
import { openHostApp } from "../shareHost";
import { SheetBody } from "./SheetBody";

// 시안(외부 공유 저장): 결과 4종은 같은 시트 구조에 그래픽·문구·CTA 만 다르다.
// 그래픽은 시트 배경(background-base)과 같은 색으로 flatten 된 통짜 PNG(@2x·@3x 밀도 선택).
const RESULT_GRAPHICS = {
  success: require("@/assets/images/share/result-success.png"),
  duplicate: require("@/assets/images/share/result-duplicate.png"),
  failed: require("@/assets/images/share/result-failed.png"),
  "retry-limit": require("@/assets/images/share/result-retry-limit.png"),
  "invalid-url": require("@/assets/images/share/result-failed.png"),
} as const;

const RESULT_CONTENT = {
  success: {
    title: "링크 저장을 완료했어요",
    subtitle: "저장한 링크는 AI 요약과 함께 확인할 수 있어요",
    cta: "링크 보러가기",
  },
  duplicate: {
    title: "이미 저장된 링크예요",
    subtitle: "이전에 저장한 링크를 확인해보세요",
    cta: "링크 보러가기",
  },
  failed: {
    title: "링크를 저장하지 못했어요",
    subtitle: "네트워크 연결을 확인한 뒤 다시 시도해주세요",
    cta: "다시 시도",
  },
  "retry-limit": {
    title: "링크를 저장하지 못했어요",
    subtitle: "잠시 후 다시 시도해주세요",
    cta: "닫기",
  },
  "invalid-url": {
    title: "저장할 수 없는 링크예요",
    subtitle: "올바른 주소인지 확인한 뒤 다시 공유해주세요",
    cta: "닫기",
  },
} as const;

// 인증 확인·토큰 워밍업 동안의 빈 시트 — 동적 사이징이 0 으로 접히지 않게 높이만 잡아 둔다.
export function CheckingSheet() {
  return (
    <SheetBody>
      <View className="h-60" />
    </SheetBody>
  );
}

export interface ResultSheetProps {
  state: Exclude<ShareSaveState, { phase: "editing" } | { phase: "saving" }>;
  onRetry: () => void;
}

export function ResultSheet({ state, onRetry }: ResultSheetProps) {
  const content = RESULT_CONTENT[state.phase];
  const dismiss = useSheetDismiss();

  const handleCta = () => {
    switch (state.phase) {
      case "success":
        openHostApp(`link/${state.linkId}`);
        return;
      case "duplicate":
        // 409 가 담아준 기존 링크 상세로 이동(서버 PR #109). 없으면(구버전) 홈 —
        // 빈 경로는 iOS 네이티브가 첫 세그먼트를 읽다 크래시하므로 "/" 로 보낸다.
        openHostApp(state.linkId != null ? `link/${state.linkId}` : "/");
        return;
      case "failed":
        onRetry();
        return;
      case "retry-limit":
      case "invalid-url":
        dismiss();
        return;
    }
  };

  return (
    <SheetBody>
      <View className="gap-6">
        <View className="items-center gap-2 py-6">
          <Image
            testID={`share-result-${state.phase}`}
            source={RESULT_GRAPHICS[state.phase]}
            className="size-40"
          />
          <Text variant="heading-2" className="text-text-strong">
            {content.title}
          </Text>
          <Text variant="body-2-reading" className="text-text-alternative">
            {content.subtitle}
          </Text>
        </View>
        {/* 시안 CTA — 높이 52·라벨 16/600 이라 ActionButton(medium=48/500) 과 값이 다르다. */}
        <Pressable
          className="h-13 items-center justify-center rounded-full bg-opacity-white-100"
          onPress={handleCta}
        >
          <Text variant="heading-3" className="text-text-inverse">
            {content.cta}
          </Text>
        </Pressable>
      </View>
    </SheetBody>
  );
}

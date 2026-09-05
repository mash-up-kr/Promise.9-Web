import { Image, Pressable, StyleSheet, View } from "react-native";

import type { ShareSaveState } from "../share.reducer";
import { openHostApp } from "../shareHost";
import { SheetText, sheetStyles } from "../sheet.primitives";

// 시안(외부 공유 저장): 결과 4종은 같은 시트 구조에 그래픽·문구·CTA 만 다르다.
// 그래픽은 시트 배경(#1a1a1a)과 같은 색으로 flatten 된 통짜 PNG(@2x·@3x 밀도 선택).
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

export function CheckingSheet() {
  return (
    <View style={[sheetStyles.container, sheetStyles.resultContainer]}>
      <View style={sheetStyles.handle} />
    </View>
  );
}

export interface ResultSheetProps {
  state: Exclude<ShareSaveState, { phase: "editing" } | { phase: "saving" }>;
  onRetry: () => void;
  onClose: () => void;
}

export function ResultSheet({ state, onRetry, onClose }: ResultSheetProps) {
  const content = RESULT_CONTENT[state.phase];

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
        onClose();
        return;
    }
  };

  return (
    <View style={[sheetStyles.container, sheetStyles.resultContainer]}>
      <View style={sheetStyles.handle} />
      <View style={sheetStyles.resultBody}>
        <Image
          testID={`share-result-${state.phase}`}
          source={RESULT_GRAPHICS[state.phase]}
          style={sheetStyles.resultImage}
        />
        <SheetText style={sheetStyles.resultTitle}>{content.title}</SheetText>
        <SheetText style={sheetStyles.resultSubtitle}>
          {content.subtitle}
        </SheetText>
      </View>
      <Pressable style={styles.ctaButton} onPress={handleCta}>
        <SheetText style={styles.ctaText}>{content.cta}</SheetText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  ctaButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    color: "#1a1a1a",
    fontSize: 16,
    fontWeight: "600",
  },
});

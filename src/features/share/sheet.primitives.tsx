import type { ComponentProps } from "react";
import { StyleSheet, Text } from "react-native";

// iOS 공유 익스텐션에서는 Fabric Dynamic Type 배율이 깨져 allowFontScaling(기본 true)인
// 텍스트의 fontSize 가 무효화된다 — 익스텐션 자체 텍스트 공용 래퍼로 우회한다
// (index.share.js 주석 참고, Android/메인 앱 경로는 no-op).
export function SheetText(props: ComponentProps<typeof Text>) {
  return (
    <Text
      allowFontScaling={globalThis.__promise9ShareExtension ? false : undefined}
      {...props}
    />
  );
}

// 결과·로그인 시트가 공유하는 틀 — 값은 ShareExtension 의 시트 스타일과 같다.
export const sheetStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#3d3d3d",
    marginTop: 8,
    marginBottom: 12,
  },
  resultContainer: {
    justifyContent: "flex-end",
  },
  resultBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  resultImage: {
    width: 160,
    height: 160,
  },
  resultTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  resultSubtitle: {
    color: "#a0a0a0",
    fontSize: 14,
  },
});

import { render, screen } from "@testing-library/react-native";
import { type Metrics, SafeAreaProvider } from "react-native-safe-area-context";

import { HomeSkeleton } from "./HomeSkeleton";

const metrics: Metrics = {
  frame: { x: 0, y: 0, width: 375, height: 812 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

describe("HomeSkeleton", () => {
  // 시안 정책: 콘텐츠가 가장 많은 상태(리마인드 + 키워드 포함 4섹션) 기준으로 그린다.
  test("네 섹션 자리를 모두 잡는다", async () => {
    await render(
      <SafeAreaProvider initialMetrics={metrics}>
        <HomeSkeleton />
      </SafeAreaProvider>,
    );

    expect(screen.getAllByTestId("home-skeleton-section")).toHaveLength(4);
  });

  // 흰색 5% 블록은 펄스(opacity 1→0.5)가 5%→2.5% 로 흔들려 보이지 않았다 — 저장 시트와 같은 불투명 기본 색을 쓴다.
  test("블록은 공용 스켈레톤 기본 색을 쓴다", async () => {
    await render(
      <SafeAreaProvider initialMetrics={metrics}>
        <HomeSkeleton />
      </SafeAreaProvider>,
    );

    const tree = JSON.stringify(screen.toJSON());
    expect(tree).toContain("bg-background-thumbnail");
    expect(tree).not.toContain("bg-opacity-white-05");
  });
});

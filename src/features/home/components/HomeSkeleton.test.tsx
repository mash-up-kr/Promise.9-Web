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
});

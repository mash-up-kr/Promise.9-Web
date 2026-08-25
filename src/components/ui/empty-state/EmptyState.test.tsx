import { render, screen } from "@testing-library/react-native";
import { View } from "react-native";

import { Text } from "@/components/ui/text/Text";

import { EmptyState, emptyStateActionStyles } from "./EmptyState";

describe("EmptyState", () => {
  test("일러스트·제목·설명·액션을 보여준다", async () => {
    await render(
      <EmptyState
        illustration={<View testID="illustration" />}
        title="아직 저장된 링크가 없어요"
        description="링크를 저장하고 한곳에서 모아보세요"
        action={<Text>새 폴더 만들기</Text>}
      />,
    );

    expect(screen.getByTestId("illustration")).toBeOnTheScreen();
    expect(screen.getByText("아직 저장된 링크가 없어요")).toBeOnTheScreen();
    expect(
      screen.getByText("링크를 저장하고 한곳에서 모아보세요"),
    ).toBeOnTheScreen();
    expect(screen.getByText("새 폴더 만들기")).toBeOnTheScreen();
  });

  test("설명과 액션은 없으면 그리지 않는다", async () => {
    await render(
      <EmptyState
        illustration={<View testID="illustration" />}
        title="아직 저장된 링크가 없어요"
      />,
    );

    expect(screen.getByText("아직 저장된 링크가 없어요")).toBeOnTheScreen();
    expect(screen.queryByTestId("empty-state-action")).not.toBeOnTheScreen();
  });
});

// jest 는 className 을 해석하지 않으므로 tv 매핑을 직접 단언한다(expo-pitfalls).
describe("emptyStateActionStyles", () => {
  // 시안: 화면 전체 빈 상태는 설명→액션 20, 섹션 안 빈 상태는 16.
  test("page 는 설명과 액션 사이를 20 으로 띄운다", () => {
    expect(emptyStateActionStyles({ size: "page" })).toContain("mt-5");
  });

  test("section 은 16 으로 띄운다", () => {
    expect(emptyStateActionStyles({ size: "section" })).toContain("mt-4");
  });
});

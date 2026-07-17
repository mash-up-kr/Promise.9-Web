import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import { Skeleton, SkeletonText, skeletonStyles } from "./Skeleton";

describe("skeletonStyles", () => {
  test("base 에 animate-pulse 와 토큰 배경이 있다", () => {
    const cls = skeletonStyles();
    expect(cls).toContain("animate-pulse");
    expect(cls).toContain("bg-background-thumbnail");
  });

  test("variant=circular 는 rounded-full 을 준다", () => {
    expect(skeletonStyles({ variant: "circular" })).toContain("rounded-full");
  });
});

describe("Skeleton", () => {
  test("isLoaded=false 면 스켈레톤 View 를 렌더한다", async () => {
    await render(<Skeleton testID="sk" />);
    expect(screen.getByTestId("sk")).toBeOnTheScreen();
  });

  test("isLoaded=true 면 스켈레톤 대신 children 을 렌더한다", async () => {
    await render(
      <Skeleton isLoaded testID="sk">
        <Text>내용</Text>
      </Skeleton>,
    );
    expect(screen.getByText("내용")).toBeOnTheScreen();
    expect(screen.queryByTestId("sk")).toBeNull();
  });
});

describe("SkeletonText", () => {
  test("lines 수만큼 스켈레톤 줄을 렌더한다", async () => {
    await render(<SkeletonText lines={3} testID="line" />);
    expect(screen.getAllByTestId("line")).toHaveLength(3);
  });

  test("isLoaded=true 면 children 을 렌더한다", async () => {
    await render(
      <SkeletonText isLoaded>
        <Text>본문</Text>
      </SkeletonText>,
    );
    expect(screen.getByText("본문")).toBeOnTheScreen();
  });
});

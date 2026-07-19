import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

const blurProps: { intensity?: number; tint?: string }[] = [];
jest.mock("expo-blur", () => {
  const { View } = require("react-native");
  return {
    BlurView: ({
      intensity,
      tint,
      children,
      ...props
    }: Record<string, unknown>) => {
      blurProps.push({ intensity: intensity as number, tint: tint as string });

      return <View {...props}>{children as React.ReactNode}</View>;
    },
  };
});

import { GlassView } from "./GlassView";

describe("GlassView", () => {
  beforeEach(() => {
    blurProps.length = 0;
  });

  test("자식을 렌더한다", async () => {
    await render(
      <GlassView intensity={50}>
        <Text>content</Text>
      </GlassView>,
    );
    expect(screen.getByText("content")).toBeOnTheScreen();
  });

  test("접근성 props 를 전달한다", async () => {
    await render(<GlassView intensity={50} accessibilityLabel="유리" />);
    expect(screen.getByLabelText("유리")).toBeOnTheScreen();
  });

  test("intensity·tint 를 BlurView 로 전달한다", async () => {
    await render(<GlassView intensity={75} tint="dark" />);
    expect(blurProps).toContainEqual({ intensity: 75, tint: "dark" });
  });
});

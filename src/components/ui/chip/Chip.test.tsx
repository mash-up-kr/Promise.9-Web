import { render, screen, userEvent } from "@testing-library/react-native";
import { Hash } from "lucide-react-native";

import { ErrorBoundary } from "@/components/ui/error-boundary/ErrorBoundary";
import { Text } from "@/components/ui/text/Text";

import { Chip, chipStyles } from "./Chip";

describe("Chip", () => {
  test("라벨을 버튼으로 노출한다", async () => {
    await render(<Chip>디자인</Chip>);

    expect(screen.getByRole("button", { name: "디자인" })).toBeOnTheScreen();
  });

  test("누르면 onPress 를 호출한다", async () => {
    const user = userEvent.setup();
    const onPress = jest.fn();
    await render(<Chip onPress={onPress}>디자인</Chip>);

    await user.press(screen.getByRole("button", { name: "디자인" }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test("아이콘과 라벨을 조합할 수 있다", async () => {
    await render(
      <Chip size="md" variant="solid" accessibilityLabel="운동">
        <Chip.Icon iconNode={Hash} />
        <Chip.Text>운동</Chip.Text>
      </Chip>,
    );

    expect(screen.getByRole("button", { name: "운동" })).toBeOnTheScreen();
    expect(screen.getByText("운동")).toBeOnTheScreen();
  });

  test("Chip.Text 를 <Chip> 밖에서 쓰면 던진다", async () => {
    // 색·타이포는 스킨(Chip)이 소유하므로 컨텍스트 없이는 결정할 수 없다.
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await render(
      <ErrorBoundary fallback={<Text>가드</Text>}>
        <Chip.Text>운동</Chip.Text>
      </ErrorBoundary>,
    );

    expect(screen.getByText("가드")).toBeOnTheScreen();
    spy.mockRestore();
  });

  // 시안 높이(32)가 최소 터치 타깃(44)보다 작아 시각 크기는 두고 터치 영역만 넓힌다.
  test("시안 높이가 44 보다 작으면 hitSlop 으로 터치 타깃을 채운다", async () => {
    await render(<Chip size="sm">디자인</Chip>);

    expect(
      screen.getByRole("button", { name: "디자인" }).props.hitSlop,
    ).toEqual({ top: 6, bottom: 6 });
  });

  test("md 는 시안 높이가 44 에 가까워 보정이 작다", async () => {
    await render(
      <Chip size="md" variant="solid">
        운동
      </Chip>,
    );

    expect(screen.getByRole("button", { name: "운동" }).props.hitSlop).toEqual({
      top: 1,
      bottom: 1,
    });
  });
});

describe("chipStyles", () => {
  test("sm/outline 은 시안 값(높이 32 · 보더 white-30)을 쓴다", () => {
    const cls = chipStyles({ size: "sm", variant: "outline" });

    expect(cls).toContain("h-8");
    expect(cls).toContain("border-opacity-white-30");
    expect(cls).toContain("rounded-full");
  });

  test("md/solid 는 시안 값(높이 42 · 배경 white-20 · 갭 4)을 쓴다", () => {
    const cls = chipStyles({ size: "md", variant: "solid" });

    expect(cls).toContain("h-[42px]");
    expect(cls).toContain("bg-opacity-white-20");
    expect(cls).toContain("gap-1");
  });
});

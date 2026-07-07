import { fireEvent, render, screen } from "@testing-library/react-native";
import type { LucideProps } from "lucide-react-native";
import { registerCSS } from "react-native-css/jest";

import type { IconComponent } from "@/components/ui/icon/Icon";

import { IconButton } from "./IconButton";

// Icon.test 와 동일한 스텁 패턴 — 실제 아이콘 없이 전달 props 만 검증한다.
let stubProps: LucideProps | undefined;
function StubIconRender(props: LucideProps) {
  stubProps = props;
  return null;
}
const StubIcon = StubIconRender as unknown as IconComponent;

describe("IconButton", () => {
  beforeEach(() => {
    stubProps = undefined;
    registerCSS(`.text-icon-strong { color: #fafafa; }`);
  });

  test("accessibilityLabel 을 가진 button 으로 렌더한다", async () => {
    await render(<IconButton iconNode={StubIcon} accessibilityLabel="검색" />);
    expect(screen.getByRole("button", { name: "검색" })).toBeOnTheScreen();
  });

  test("누르면 onPress 를 호출한다", async () => {
    const onPress = jest.fn();
    await render(
      <IconButton
        iconNode={StubIcon}
        accessibilityLabel="검색"
        onPress={onPress}
      />,
    );
    fireEvent.press(screen.getByRole("button", { name: "검색" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test("아이콘을 24 크기로 렌더한다", async () => {
    await render(<IconButton iconNode={StubIcon} accessibilityLabel="검색" />);
    expect(stubProps?.size).toBe(24);
  });

  test("아이콘에 icon-strong 색 토큰을 적용한다", async () => {
    await render(<IconButton iconNode={StubIcon} accessibilityLabel="검색" />);
    expect(stubProps?.color).toBe("#fafafa");
  });
});

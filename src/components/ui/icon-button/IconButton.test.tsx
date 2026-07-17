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

  test("아이콘 획 두께를 디자인 스펙(1.5)으로 렌더한다", async () => {
    await render(<IconButton iconNode={StubIcon} accessibilityLabel="검색" />);
    expect(stubProps?.strokeWidth).toBe(1.5);
  });

  // 즐겨찾기 별처럼 on/off 를 채움으로 구분하는 토글 버튼에 필요하다.
  test("iconFill 을 아이콘의 fill 로 전달한다", async () => {
    await render(
      <IconButton
        iconNode={StubIcon}
        accessibilityLabel="즐겨찾기"
        iconFill="currentColor"
      />,
    );
    expect(stubProps?.fill).toBe("currentColor");
  });

  test("iconFill 을 주지 않으면 채우지 않는다(기존 호출부 영향 없음)", async () => {
    await render(<IconButton iconNode={StubIcon} accessibilityLabel="검색" />);
    expect(stubProps?.fill).toBe("none");
  });
});

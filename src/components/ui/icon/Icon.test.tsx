import { render } from "@testing-library/react-native";
import type { LucideProps } from "lucide-react-native";
import { registerCSS } from "react-native-css/jest";

import { Icon, type IconComponent } from "./Icon";

// 실제 아이콘 라이브러리(lucide 등) 없이 Icon 의 className→color 매핑 로직만 검증하기 위한 스텁.
// 일반 함수 컴포넌트는 ForwardRefExoticComponent(LucideIcon)와 타입이 달라 캐스트한다.
let stubProps: LucideProps | undefined;
function StubIconRender(props: LucideProps) {
  stubProps = props;
  return null;
}
const StubIcon = StubIconRender as unknown as IconComponent;

describe("Icon", () => {
  beforeEach(() => {
    stubProps = undefined;
    registerCSS(`.text-blue-500 { color: #3b82f6; }`);
  });

  test("className 의 색상 토큰이 아이콘의 color prop 으로 전달된다", async () => {
    await render(<Icon iconNode={StubIcon} className="text-blue-500" />);
    expect(stubProps?.color).toBe("#3b82f6");
  });

  test("className 을 생략하면 color prop 을 전달하지 않는다", async () => {
    await render(<Icon iconNode={StubIcon} />);
    expect(stubProps?.color).toBeUndefined();
  });

  test("size 를 생략하면 기본 18 이 적용된다", async () => {
    await render(<Icon iconNode={StubIcon} />);
    expect(stubProps?.size).toBe(18);
  });

  test("size·strokeWidth 등 lucide props 는 그대로 전달된다", async () => {
    await render(<Icon iconNode={StubIcon} size={32} strokeWidth={1.5} />);
    expect(stubProps?.size).toBe(32);
    expect(stubProps?.strokeWidth).toBe(1.5);
  });
});

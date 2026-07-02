import { render } from "@testing-library/react-native";
import { registerCSS } from "react-native-css/jest";
import type { SvgProps } from "react-native-svg";

import { Icon } from "./Icon";

// 실제 아이콘 라이브러리(lucide 등) 없이 Icon 의 className→color 매핑 로직만 검증하기 위한 스텁.
let stubProps: (SvgProps & { size?: string | number }) | undefined;
function StubIcon(props: SvgProps & { size?: string | number }) {
  stubProps = props;
  return null;
}

describe("Icon", () => {
  beforeEach(() => {
    stubProps = undefined;
    registerCSS(`.text-blue-500 { color: #3b82f6; }`);
  });

  test("className 의 색상 토큰이 아이콘의 color prop 으로 전달된다", async () => {
    await render(<Icon icon={StubIcon} className="text-blue-500" />);
    expect(stubProps?.color).toBe("#3b82f6");
  });

  test("className 을 생략하면 color prop 을 전달하지 않는다", async () => {
    await render(<Icon icon={StubIcon} />);
    expect(stubProps?.color).toBeUndefined();
  });

  test("size 등 나머지 props 는 그대로 전달된다", async () => {
    await render(<Icon icon={StubIcon} size={32} />);
    expect(stubProps?.size).toBe(32);
  });
});

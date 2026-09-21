import { render, screen } from "@testing-library/react-native";
import { processColor } from "react-native";

import { LogoSymbol } from "./LogoSymbol";

describe("LogoSymbol", () => {
  test("접근성 이미지('링띵동')로 렌더된다", async () => {
    await render(<LogoSymbol />);
    expect(screen.getByLabelText("링띵동")).toBeOnTheScreen();
  });

  test("기본은 Figma 원본 글리프 크기(36×28.6711)로 렌더된다", async () => {
    await render(<LogoSymbol />);
    const symbol = screen.getByLabelText("링띵동");
    expect(symbol.props.width).toBe(36);
    expect(symbol.props.height).toBe(28.6711);
  });

  test("width·height 를 SvgProps 로 지정할 수 있다", async () => {
    await render(<LogoSymbol width={42} height={33} />);
    const symbol = screen.getByLabelText("링띵동");
    expect(symbol.props.width).toBe(42);
    expect(symbol.props.height).toBe(33);
  });

  test("기본 글리프는 반투명 흰색(white-50, opacity 0.5)으로 그린다", async () => {
    await render(<LogoSymbol />);
    const paths = screen.getAllByTestId("logo-symbol-glyph");
    expect(paths.length).toBeGreaterThan(0);
    for (const path of paths) {
      expect(path.props.fill?.payload).toBe(processColor("#ffffff"));
      expect(path.props.opacity).toBe(0.5);
    }
  });

  test("fill·opacity 를 주입하면 글리프에 그대로 적용된다", async () => {
    await render(<LogoSymbol fill="#fffe66" opacity={1} />);
    const paths = screen.getAllByTestId("logo-symbol-glyph");
    expect(paths.length).toBeGreaterThan(0);
    for (const path of paths) {
      expect(path.props.fill?.payload).toBe(processColor("#fffe66"));
      expect(path.props.opacity).toBe(1);
    }
  });
});

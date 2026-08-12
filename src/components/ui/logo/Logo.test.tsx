import { render, screen } from "@testing-library/react-native";
import { processColor } from "react-native";

import { Logo } from "./Logo";

describe("Logo", () => {
  test("접근성 이미지('링띵동')로 렌더된다", async () => {
    await render(<Logo />);
    expect(screen.getByLabelText("링띵동")).toBeOnTheScreen();
  });

  test("기본은 Figma Small 크기(56×24)로 렌더된다", async () => {
    await render(<Logo />);
    const logo = screen.getByLabelText("링띵동");
    expect(logo.props.width).toBe(56);
    expect(logo.props.height).toBe(24);
  });

  test("width·height 를 SvgProps 로 지정할 수 있다", async () => {
    await render(<Logo width={70} height={30} />);
    const logo = screen.getByLabelText("링띵동");
    expect(logo.props.width).toBe(70);
    expect(logo.props.height).toBe(30);
  });

  test("기본 글리프는 white-50(흰색 + opacity 0.5)으로 그린다", async () => {
    await render(<Logo />);
    const paths = screen.getAllByTestId("logo-glyph");
    expect(paths.length).toBeGreaterThan(0);
    for (const path of paths) {
      expect(path.props.fill?.payload).toBe(processColor("#ffffff"));
      expect(path.props.opacity).toBe(0.5);
    }
  });

  test("fill·opacity 를 주입하면 글리프에 그대로 적용된다", async () => {
    await render(<Logo fill="#fffe66" opacity={1} />);
    const paths = screen.getAllByTestId("logo-glyph");
    expect(paths.length).toBeGreaterThan(0);
    for (const path of paths) {
      expect(path.props.fill?.payload).toBe(processColor("#fffe66"));
      expect(path.props.opacity).toBe(1);
    }
  });
});

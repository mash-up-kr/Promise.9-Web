import { render, screen } from "@testing-library/react-native";

import { AppleIcon } from "./AppleIcon";
import { GoogleIcon } from "./GoogleIcon";
import { KakaoIcon } from "./KakaoIcon";

// react-native-svg 는 색을 정수로 정규화해 hex 매칭이 안 되므로, 라벨 렌더와 path 개수로 회귀를 잡는다.
const pathCount = () =>
  JSON.stringify(screen.toJSON()).split("RNSVGPath").length - 1;

describe("social brand icons", () => {
  test("KakaoIcon 은 카카오 라벨과 단일 글리프를 렌더한다", async () => {
    await render(<KakaoIcon />);
    expect(screen.getByLabelText("카카오")).toBeTruthy();
    expect(screen.getByTestId("kakao-glyph")).toBeTruthy();
    expect(pathCount()).toBe(1);
  });

  test("GoogleIcon 은 구글 라벨과 4색(4 path) 로고를 렌더한다", async () => {
    await render(<GoogleIcon />);
    expect(screen.getByLabelText("구글")).toBeTruthy();
    expect(pathCount()).toBe(4);
  });

  test("AppleIcon 은 애플 라벨과 단일 글리프를 렌더한다", async () => {
    await render(<AppleIcon />);
    expect(screen.getByLabelText("애플")).toBeTruthy();
    expect(screen.getByTestId("apple-glyph")).toBeTruthy();
    expect(pathCount()).toBe(1);
  });
});

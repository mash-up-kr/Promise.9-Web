import { fireEvent, render, screen } from "@testing-library/react-native";
import { Image, Linking } from "react-native";

import { LinkThumbnail } from "./LinkThumbnail";

const URL = "https://toss.tech/article";
const THUMB = "https://picsum.photos/seed/x/335/235";

function mockGetSize(width: number, height: number) {
  jest
    .spyOn(Image, "getSize")
    .mockImplementation((_uri, success) => success(width, height));
}

describe("LinkThumbnail", () => {
  beforeEach(() => {
    jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    mockGetSize(400, 200); // 기본: 가로형
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("썸네일 이미지를 렌더한다", async () => {
    await render(<LinkThumbnail thumbnailUrl={THUMB} url={URL} />);
    expect(screen.getByTestId("thumb-image").props.source).toEqual({
      uri: THUMB,
    });
  });

  test("우하단 버튼을 누르면 url 로 Linking.openURL 이 호출된다", async () => {
    await render(<LinkThumbnail thumbnailUrl={THUMB} url={URL} />);
    fireEvent.press(screen.getByLabelText("링크 열기"));
    expect(Linking.openURL).toHaveBeenCalledWith(URL);
  });

  test("가로형 이미지는 blur-fill 배경을 렌더하지 않는다", async () => {
    mockGetSize(400, 200);
    await render(<LinkThumbnail thumbnailUrl={THUMB} url={URL} />);
    await screen.findByTestId("thumb-image");
    expect(screen.queryByTestId("thumb-blur")).toBeNull();
  });

  test("세로형 이미지는 blur-fill 배경을 렌더한다", async () => {
    mockGetSize(200, 400);
    await render(<LinkThumbnail thumbnailUrl={THUMB} url={URL} />);
    expect(await screen.findByTestId("thumb-blur")).toBeOnTheScreen();
  });

  test("이미지 치수 측정 실패 시 크래시 없이 렌더된다(가로형 fallback)", async () => {
    jest
      .spyOn(Image, "getSize")
      .mockImplementation((_uri, _success, failure) =>
        failure?.(new Error("측정 실패")),
      );
    await render(<LinkThumbnail thumbnailUrl={THUMB} url={URL} />);
    expect(screen.getByTestId("thumb-image")).toBeOnTheScreen();
    expect(screen.queryByTestId("thumb-blur")).toBeNull();
  });
});

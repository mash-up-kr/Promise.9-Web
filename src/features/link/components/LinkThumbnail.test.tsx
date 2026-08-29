import { fireEvent, render, screen } from "@testing-library/react-native";
import { Linking } from "react-native";

import { LinkThumbnail } from "./LinkThumbnail";

const URL = "https://toss.tech/article";
const THUMB = "https://picsum.photos/seed/x/335/235";
const THUMBS = [
  "https://picsum.photos/seed/a/335/235",
  "https://picsum.photos/seed/b/335/235",
  "https://picsum.photos/seed/c/335/235",
];

// expo-image 는 정적 getSize 대신 onLoad 이벤트로 실제 치수를 알려준다.
// 네이티브 컴포넌트가 RN NativeSyntheticEvent 형태(nativeEvent 로 감싼 형태)로 전달한다.
// fireEvent 는 act() 로 상태 갱신을 커밋할 때까지 기다려야 하므로 반드시 await 한다.
async function fireLoad(width: number, height: number) {
  await fireEvent(screen.getByTestId("thumb-image"), "load", {
    nativeEvent: {
      source: { url: THUMB, width, height, mediaType: null },
      cacheType: "none",
    },
  });
}

describe("LinkThumbnail", () => {
  beforeEach(() => {
    jest.spyOn(Linking, "openURL").mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("이미지 1장이면 썸네일 이미지를 렌더한다", async () => {
    await render(<LinkThumbnail imageUrls={[THUMB]} url={URL} />);
    // expo-image 는 source 를 내부적으로 배열(멀티 해상도 지원)로 정규화한다.
    expect(screen.getByTestId("thumb-image").props.source).toEqual([
      { uri: THUMB },
    ]);
  });

  test("우하단 버튼을 누르면 url 로 Linking.openURL 이 호출된다", async () => {
    await render(<LinkThumbnail imageUrls={[THUMB]} url={URL} />);
    fireEvent.press(screen.getByLabelText("링크 열기"));
    expect(Linking.openURL).toHaveBeenCalledWith(URL);
  });

  test("가로형 이미지는 blur-fill 배경을 렌더하지 않는다", async () => {
    await render(<LinkThumbnail imageUrls={[THUMB]} url={URL} />);
    await fireLoad(400, 200);
    expect(screen.queryByTestId("thumb-blur")).toBeNull();
  });

  test("세로형 이미지는 blur-fill 배경을 렌더한다", async () => {
    await render(<LinkThumbnail imageUrls={[THUMB]} url={URL} />);
    await fireLoad(200, 400);
    expect(screen.getByTestId("thumb-blur")).toBeOnTheScreen();
  });

  test("이미지 로드 전(치수 미확정)에는 크래시 없이 가로형 fallback으로 렌더된다", async () => {
    await render(<LinkThumbnail imageUrls={[THUMB]} url={URL} />);
    expect(screen.getByTestId("thumb-image")).toBeOnTheScreen();
    expect(screen.queryByTestId("thumb-blur")).toBeNull();
  });

  test("이미지가 없으면 플레이스홀더를 렌더한다(썸네일 이미지 없음)", async () => {
    await render(<LinkThumbnail imageUrls={[]} url={URL} />);
    expect(screen.getByTestId("thumb-placeholder")).toBeOnTheScreen();
    expect(screen.queryByTestId("thumb-image")).toBeNull();
    // 플레이스홀더에서도 원문 이동 버튼은 유지한다.
    fireEvent.press(screen.getByLabelText("링크 열기"));
    expect(Linking.openURL).toHaveBeenCalledWith(URL);
  });

  test("이미지가 여러 장이면 캐러셀(이미지 N장 + 인디케이터 N개)을 렌더한다", async () => {
    await render(<LinkThumbnail imageUrls={THUMBS} url={URL} />);
    expect(screen.getAllByTestId("thumb-image")).toHaveLength(THUMBS.length);
    expect(screen.getAllByTestId("thumb-indicator")).toHaveLength(
      THUMBS.length,
    );
    fireEvent.press(screen.getByLabelText("링크 열기"));
    expect(Linking.openURL).toHaveBeenCalledWith(URL);
  });
});

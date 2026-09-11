import { render, screen } from "@testing-library/react-native";

import { ThumbnailFallback } from "./ThumbnailFallback";

describe("ThumbnailFallback", () => {
  test("no-thumbnail 일러스트를 렌더한다", async () => {
    await render(<ThumbnailFallback testID="fallback" />);

    const image = screen.getByTestId("thumbnail-fallback-image");
    // expo-image 는 source 를 배열로 정규화한다.
    expect(image.props.source).toEqual([
      require("@/assets/images/no-thumbnail.png"),
    ]);
  });

  test("크기·모서리는 호출부의 className·style 을 따른다", async () => {
    await render(
      <ThumbnailFallback
        testID="fallback"
        className="rounded-[20px]"
        style={{ width: 170, height: 212.5 }}
      />,
    );

    expect(screen.getByTestId("fallback")).toHaveStyle({
      width: 170,
      height: 212.5,
    });
  });
});

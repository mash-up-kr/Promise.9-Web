import { render, screen } from "@testing-library/react-native";

import { Image } from "./Image";

// expo-image 는 react-native-css 가 감싸지 않아 className 이 네이티브 뷰까지 그대로 흘러가면
// 아무 스타일도 적용되지 않는다(릴리즈 빌드에서 썸네일이 0×0 으로 접힌 원인). 래퍼는 className 을
// 소비해 style 슬롯으로 넘겨야 한다. 실제 크기 값은 jest 가 해석하지 못하므로 device 로 확인한다.
test("className 을 호스트 뷰 prop 으로 흘려보내지 않고 style 슬롯으로 매핑한다", async () => {
  await render(
    <Image
      testID="styled-image"
      source={{ uri: "https://static.example.com/t.png" }}
      className="size-24 rounded-2xl"
    />,
  );

  const image = screen.getByTestId("styled-image");
  expect(image.props.className).toBeUndefined();
  expect(image).toHaveProp("style");
});

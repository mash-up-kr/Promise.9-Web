import { Image as ExpoImage } from "expo-image";
import { styled } from "nativewind";

// expo-image 는 react-native 코어가 아니라 react-native-css 리졸버가 감싸지 않는다 — 네이티브에선
// className 이 무시돼 크기가 0 이 된다. Heading·Icon 처럼 styled 로 className 을 `style` 슬롯에 매핑한다.
export const Image = styled(ExpoImage, { className: "style" } as const);

export type ImageProps = React.ComponentProps<typeof Image>;

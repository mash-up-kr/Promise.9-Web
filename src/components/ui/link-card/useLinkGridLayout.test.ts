import { act, renderHook } from "@testing-library/react-native";
import type { LayoutChangeEvent } from "react-native";
import { Dimensions } from "react-native";

import { useLinkGridLayout } from "./useLinkGridLayout";

const layoutEvent = (width: number) =>
  ({ nativeEvent: { layout: { width } } }) as LayoutChangeEvent;

describe("useLinkGridLayout", () => {
  test("측정 전에는 창 폭을 콘텐츠 최대 폭(768)으로 눌러 계산한다", async () => {
    Dimensions.set({
      window: { width: 1440, height: 900, scale: 2, fontScale: 1 },
    });
    const { result } = await renderHook(() =>
      useLinkGridLayout({ horizontalPadding: 40 }),
    );
    expect(result.current).toMatchObject({ columns: 4, tileWidth: 170.75 });
  });

  test("onLayout 으로 실제 폭이 들어오면 패딩을 뺀 폭으로 다시 계산한다", async () => {
    const { result } = await renderHook(() =>
      useLinkGridLayout({ horizontalPadding: 40 }),
    );

    await act(async () => result.current.onLayout(layoutEvent(375)));
    expect(result.current).toMatchObject({ columns: 2, tileWidth: 160 });

    await act(async () => result.current.onLayout(layoutEvent(768)));
    expect(result.current).toMatchObject({ columns: 4, tileWidth: 170.75 });
  });
});

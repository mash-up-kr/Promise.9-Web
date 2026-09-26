// 키보드 회피 컨테이너를 쓰는지 드러나도록 표식만 단 View 로 바꾼다.
jest.mock("./dialogKeyboardAvoidingView", () => {
  const { createElement } = require("react");
  const { View } = require("react-native");
  return {
    KeyboardAvoidingView: (props: object) =>
      createElement(View, { ...props, testID: "keyboard-avoiding-view" }),
  };
});

import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { StyleSheet, Text, View } from "react-native";
import { type Metrics, SafeAreaProvider } from "react-native-safe-area-context";

import { Dialog } from "./Dialog";

describe("Dialog", () => {
  test("카드 내용을 그대로 렌더한다", async () => {
    await render(
      <Dialog>
        <View>
          <Text>내용</Text>
        </View>
      </Dialog>,
    );

    expect(screen.getByText("내용")).toBeOnTheScreen();
  });

  test("onDismiss 를 주면 배경을 눌러 닫을 수 있다", async () => {
    const onDismiss = jest.fn();
    await render(
      <Dialog onDismiss={onDismiss}>
        <Text>내용</Text>
      </Dialog>,
    );
    await fireEvent.press(screen.getByLabelText("닫기"));

    expect(onDismiss).toHaveBeenCalled();
  });

  // 배경을 직접 그리는 호출부(AlertDialog)가 dim 을 두 번 겹치지 않게 한다.
  test("onDismiss 가 없으면 배경을 그리지 않는다", async () => {
    await render(
      <Dialog>
        <Text>내용</Text>
      </Dialog>,
    );

    expect(screen.queryByLabelText("닫기")).toBeNull();
  });

  // 배경이 카드 안쪽에 갇히면 absoluteFill 의 기준이 카드 크기로 줄어
  // dim 이 카드 뒤 띠만 덮고 바깥을 눌러 닫을 영역도 사라진다.
  test("배경과 카드를 같은 컨테이너의 형제로 놓는다", async () => {
    await render(
      <Dialog onDismiss={() => {}}>
        <View testID="card">
          <Text>내용</Text>
        </View>
      </Dialog>,
    );

    expect(screen.getByTestId("card").parent).toBe(
      screen.getByLabelText("닫기").parent,
    );
  });

  test("배경 접근성 라벨을 바꿀 수 있다", async () => {
    await render(
      <Dialog onDismiss={() => {}} dismissAccessibilityLabel="시트 닫기">
        <Text>내용</Text>
      </Dialog>,
    );

    expect(screen.getByLabelText("시트 닫기")).toBeOnTheScreen();
  });
});

describe("Dialog — iOS 공유 익스텐션", () => {
  // 익스텐션 root 는 상태바 아래에서 시작해 그 Safe Area 는 top 0 이다. 모달은 화면 맨 위부터 덮는다.
  const extensionRootMetrics: Metrics = {
    frame: { x: 0, y: 0, width: 375, height: 750 },
    insets: { top: 0, left: 0, right: 0, bottom: 34 },
  };

  beforeEach(() => {
    globalThis.__promise9ShareExtension = true;
  });

  afterEach(() => {
    globalThis.__promise9ShareExtension = undefined;
  });

  async function renderInExtension({ hasTextInput = false } = {}) {
    await render(
      <SafeAreaProvider initialMetrics={extensionRootMetrics}>
        <Dialog onDismiss={() => {}} hasTextInput={hasTextInput}>
          <View testID="card">
            <Text>내용</Text>
          </View>
        </Dialog>
      </SafeAreaProvider>,
    );
  }

  // jest 엔 네이티브 측정이 없다 — 익스텐션 root 안쪽의 Safe Area 공급자(모달 자체)가 잰 값을 알려준다.
  async function reportModalSafeArea(top: number) {
    const [, modalProvider] = screen.container.queryAll(
      (node) => typeof node.props.onInsetsChange === "function",
    );
    expect(modalProvider).toBeDefined();
    await act(async () => {
      modalProvider?.props.onInsetsChange({
        nativeEvent: {
          insets: { top, left: 0, right: 0, bottom: 34 },
          frame: { x: 0, y: 0, width: 375, height: 812 },
        },
      });
    });
  }

  function scrollViewOf(card: ReturnType<typeof screen.getByTestId>) {
    // RN ScrollView 목은 <RCTScrollView><View>{children}</View></RCTScrollView> 로 그린다.
    return card.parent?.parent;
  }

  test("앱에서는 키보드 회피 컨테이너로 띄운다", async () => {
    globalThis.__promise9ShareExtension = undefined;
    await render(
      <Dialog>
        <Text>내용</Text>
      </Dialog>,
    );

    expect(screen.getByTestId("keyboard-avoiding-view")).toBeOnTheScreen();
  });

  // 익스텐션 프로세스는 RN 키보드 이벤트 좌표가 0 으로 와서 키보드 회피가 카드를 화면 밖으로 민다.
  test("입력이 없는 카드(피커·알림)는 키보드 회피 없이 가운데 둔다", async () => {
    await renderInExtension();

    expect(screen.queryByTestId("keyboard-avoiding-view")).toBeNull();
    const card = screen.getByTestId("card");
    expect(scrollViewOf(card)?.props).not.toHaveProperty(
      "automaticallyAdjustKeyboardInsets",
    );
    expect(
      StyleSheet.flatten(card.parent?.props.style)?.paddingTop,
    ).toBeUndefined();
  });

  test("입력 카드는 키보드 회피 없이, 모달 안에서 잰 상단 Safe Area 아래에 붙인다", async () => {
    await renderInExtension({ hasTextInput: true });
    await reportModalSafeArea(62);

    expect(screen.queryByTestId("keyboard-avoiding-view")).toBeNull();
    const scrollView = scrollViewOf(screen.getByTestId("card"));
    expect(
      StyleSheet.flatten(scrollView?.props.contentContainerStyle),
    ).toMatchObject({ paddingTop: 62 + 16 });
  });

  // react-native-css 는 contentContainerClassName 과 contentContainerStyle 을 합치지 않는다 —
  // 클래스로 준 가운데 정렬·좌우 여백이 인라인 스타일에 덮여 카드가 왼쪽에 붙었다.
  test("입력 카드는 좌우 여백을 두고 가운데 놓는다", async () => {
    await renderInExtension({ hasTextInput: true });

    const scrollView = scrollViewOf(screen.getByTestId("card"));
    expect(
      StyleSheet.flatten(scrollView?.props.contentContainerStyle),
    ).toMatchObject({
      flexGrow: 1,
      alignItems: "center",
      paddingHorizontal: 20,
    });
  });

  // 작은 화면(SE)에선 키보드가 카드 아래 버튼을 가린다 — 네이티브 키보드 인셋으로 스크롤해 꺼낸다.
  test("입력 카드는 키보드에 가려도 스크롤해 버튼까지 닿는다", async () => {
    await renderInExtension({ hasTextInput: true });

    const scrollView = scrollViewOf(screen.getByTestId("card"));
    expect(scrollView?.props.automaticallyAdjustKeyboardInsets).toBe(true);
    expect(scrollView?.props.keyboardShouldPersistTaps).toBe("handled");
  });

  test.each([
    false,
    true,
  ])("배경과 카드를 같은 컨테이너의 형제로 놓는다(입력 카드 %s)", async (hasTextInput) => {
    await renderInExtension({ hasTextInput });

    expect(screen.getByTestId("card").parent).toBe(
      screen.getByLabelText("닫기").parent,
    );
  });
});

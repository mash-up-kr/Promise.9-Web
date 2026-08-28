import {
  fireEvent,
  render,
  screen,
  userEvent,
} from "@testing-library/react-native";
import { Text } from "react-native";

import { type Metrics, SafeAreaProvider } from "react-native-safe-area-context";

import { BottomSheet } from "./BottomSheet";

// toJSON() 트리에서 특정 prop 을 가진 첫 노드를 찾는다 — 백드롭은 gorhom 스텁이 내부적으로
// 렌더하므로 testID 를 직접 붙일 수 없어, 전달된 props 로 찾는다.
function findNodeByProp(
  node: unknown,
  propKey: string,
): { props: Record<string, unknown> } | null {
  if (!node || typeof node !== "object") return null;
  const current = node as {
    props?: Record<string, unknown>;
    children?: unknown;
  };
  if (current.props && propKey in current.props) {
    return current as { props: Record<string, unknown> };
  }
  const children = Array.isArray(current.children) ? current.children : [];
  for (const child of children) {
    const found = findNodeByProp(child, propKey);
    if (found) return found;
  }
  return null;
}

const metrics: Metrics = {
  frame: { x: 0, y: 0, width: 375, height: 812 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

describe("BottomSheet", () => {
  test("children 을 렌더한다", async () => {
    await render(
      <SafeAreaProvider initialMetrics={metrics}>
        <BottomSheet onClose={jest.fn()}>
          <Text>내용</Text>
        </BottomSheet>
      </SafeAreaProvider>,
    );
    expect(screen.getByText("내용")).toBeOnTheScreen();
  });

  test("시트가 닫히면 onClose 를 호출한다", async () => {
    const onClose = jest.fn();
    await render(
      <SafeAreaProvider initialMetrics={metrics}>
        <BottomSheet onClose={onClose}>
          <Text>내용</Text>
        </BottomSheet>
      </SafeAreaProvider>,
    );
    fireEvent.press(screen.getByLabelText("sheet-dismiss"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("backdropPressBehavior 기본값 close 를 backdrop 에 전달한다", async () => {
    const view = await render(
      <SafeAreaProvider initialMetrics={metrics}>
        <BottomSheet onClose={jest.fn()}>
          <Text>내용</Text>
        </BottomSheet>
      </SafeAreaProvider>,
    );
    const backdrop = findNodeByProp(view.toJSON(), "pressBehavior");
    expect(backdrop?.props.pressBehavior).toBe("close");
  });

  test('backdropPressBehavior="none" 을 backdrop 에 전달한다', async () => {
    const view = await render(
      <SafeAreaProvider initialMetrics={metrics}>
        <BottomSheet onClose={jest.fn()} backdropPressBehavior="none">
          <Text>내용</Text>
        </BottomSheet>
      </SafeAreaProvider>,
    );
    const backdrop = findNodeByProp(view.toJSON(), "pressBehavior");
    expect(backdrop?.props.pressBehavior).toBe("none");
  });

  test("isLocked 이면 pan-down 닫힘이 비활성화된다", async () => {
    const onClose = jest.fn();
    await render(
      <SafeAreaProvider initialMetrics={metrics}>
        <BottomSheet onClose={onClose} isLocked>
          <Text>내용</Text>
        </BottomSheet>
      </SafeAreaProvider>,
    );
    const user = userEvent.setup();
    await user.press(screen.getByLabelText("sheet-dismiss"));
    expect(onClose).not.toHaveBeenCalled();
  });
});

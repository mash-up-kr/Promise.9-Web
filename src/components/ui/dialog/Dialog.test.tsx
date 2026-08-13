import { fireEvent, render, screen } from "@testing-library/react-native";
import { Text, View } from "react-native";

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

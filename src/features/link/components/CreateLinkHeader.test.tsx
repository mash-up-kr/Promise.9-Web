import { fireEvent, render, screen } from "@testing-library/react-native";

import { CreateLinkHeader } from "./CreateLinkHeader";

describe("CreateLinkHeader", () => {
  test("취소를 누르면 onCancel 을 호출한다", async () => {
    const onCancel = jest.fn();
    await render(
      <CreateLinkHeader
        onCancel={onCancel}
        onSave={jest.fn()}
        saveDisabled={false}
      />,
    );
    await fireEvent.press(screen.getByText("취소"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test("활성일 때 저장을 누르면 onSave 를 호출한다", async () => {
    const onSave = jest.fn();
    await render(
      <CreateLinkHeader
        onCancel={jest.fn()}
        onSave={onSave}
        saveDisabled={false}
      />,
    );
    await fireEvent.press(screen.getByText("저장"));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  test("비활성일 때 저장 버튼은 disabled 상태다", async () => {
    await render(
      <CreateLinkHeader onCancel={jest.fn()} onSave={jest.fn()} saveDisabled />,
    );
    expect(
      screen.getByLabelText("저장").props.accessibilityState.disabled,
    ).toBe(true);
  });
});

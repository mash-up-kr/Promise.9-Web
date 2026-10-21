import { render, screen, userEvent } from "@testing-library/react-native";

import { UpdateDialog } from "./UpdateDialog";

test("권유 안내는 '나중에' 와 '업데이트' 를 함께 준다", async () => {
  const onDismiss = jest.fn();
  const onUpdate = jest.fn();
  const user = userEvent.setup();

  await render(
    <UpdateDialog
      kind="recommend"
      latestVersion="1.3.0"
      onDismiss={onDismiss}
      onUpdate={onUpdate}
    />,
  );

  await user.press(screen.getByText("나중에"));
  expect(onDismiss).toHaveBeenCalledTimes(1);

  await user.press(screen.getByText("업데이트"));
  expect(onUpdate).toHaveBeenCalledTimes(1);
});

test("권유 안내는 새 버전을 알려준다", async () => {
  await render(
    <UpdateDialog
      kind="recommend"
      latestVersion="1.3.0"
      onDismiss={jest.fn()}
      onUpdate={jest.fn()}
    />,
  );

  expect(screen.getByText(/1\.3\.0/)).toBeOnTheScreen();
});

test("필수 안내는 닫을 길을 주지 않는다 — 누를 수 있는 건 업데이트뿐이다", async () => {
  await render(
    <UpdateDialog
      kind="force"
      latestVersion="1.4.0"
      onDismiss={jest.fn()}
      onUpdate={jest.fn()}
    />,
  );

  expect(screen.queryByText("나중에")).not.toBeOnTheScreen();
  // 배경(dim)도 누를 수 없는 요소로 그려진다 — 닫기 동작이 붙지 않으므로 버튼으로 노출되지 않는다.
  expect(
    screen
      .getAllByRole("button")
      .map((button) => button.props.accessibilityLabel),
  ).toEqual(["업데이트"]);
});

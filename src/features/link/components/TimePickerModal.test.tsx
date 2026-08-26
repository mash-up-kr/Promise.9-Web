import { render, screen, userEvent } from "@testing-library/react-native";

import { TimePickerModal } from "./TimePickerModal";

it("취소는 onClose 만, 확인은 드래프트를 24시간제로 확정", async () => {
  const user = userEvent.setup();
  const onConfirm = jest.fn();
  const onClose = jest.fn();
  await render(
    <TimePickerModal
      value={{ hour: 15, minute: 30 }}
      onConfirm={onConfirm}
      onClose={onClose}
    />,
  );

  // 초기 휠 라벨: 오후 / 3 / 30
  expect(screen.getByText("시간 선택")).toBeTruthy();

  await user.press(screen.getByRole("button", { name: "오전" })); // meridiem 휠 항목 직접 탭
  await user.press(screen.getByRole("button", { name: "확인" }));

  expect(onConfirm).toHaveBeenCalledWith({ hour: 3, minute: 30 });

  await user.press(screen.getByRole("button", { name: "취소" }));
  expect(onClose).toHaveBeenCalled();
});

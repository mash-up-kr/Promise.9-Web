import { render, screen, userEvent } from "@testing-library/react-native";

import { DatePickerModal } from "./DatePickerModal";

beforeEach(() => {
  jest.useFakeTimers({ doNotFake: ["queueMicrotask"] });
  jest.setSystemTime(new Date("2026-08-26T12:00:00"));
});
afterEach(() => jest.useRealTimers());

const setup = async () => {
  const onConfirm = jest.fn();
  const onClose = jest.fn();
  await render(
    <DatePickerModal
      value="2026-08-29"
      onConfirm={onConfirm}
      onClose={onClose}
    />,
  );
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  return { onConfirm, onClose, user };
};

it("오늘 이하·6개월 초과 날짜는 비활성", async () => {
  await setup();
  // 오늘(26)과 과거는 disabled
  expect(screen.getByRole("button", { name: "26일" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "27일" })).toBeEnabled();
});

it("날짜 탭 후 확인 시에만 onConfirm", async () => {
  const { onConfirm, user } = await setup();
  await user.press(screen.getByRole("button", { name: "30일" }));
  expect(onConfirm).not.toHaveBeenCalled();
  await user.press(screen.getByRole("button", { name: "확인" }));
  expect(onConfirm).toHaveBeenCalledWith("2026-08-30");
});

it("취소는 onClose 만 부른다", async () => {
  const { onConfirm, onClose, user } = await setup();
  await user.press(screen.getByRole("button", { name: "취소" }));
  expect(onClose).toHaveBeenCalled();
  expect(onConfirm).not.toHaveBeenCalled();
});

it("연/월 휠 모드 — 범위 연도만 노출되고 확인 시 해당 월 캘린더로 복귀", async () => {
  const { user } = await setup();
  await user.press(screen.getByRole("button", { name: "연/월 선택" }));
  expect(screen.getByTestId("wheel-year")).toBeTruthy();
  // 범위: 2026-08-27 ~ 2027-02-26 → 연도는 2026·2027 만
  expect(screen.getByRole("button", { name: "2026년" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "2027년" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "2028년" })).toBeNull();
  await user.press(screen.getByRole("button", { name: "확인" }));
  expect(screen.queryByTestId("wheel-year")).toBeNull(); // 캘린더 복귀
});

it("연/월 휠 서브헤더가 현재 선택값을 반영하고 연도 변경 시 갱신된다", async () => {
  const { user } = await setup();
  await user.press(screen.getByRole("button", { name: "연/월 선택" }));
  expect(screen.getByText("2026년 8월")).toBeTruthy();

  // 2027년은 최댓달이 2월이라 8월은 범위를 벗어나 2월로 클램프된다.
  await user.press(screen.getByRole("button", { name: "2027년" }));
  expect(screen.getByText("2027년 2월")).toBeTruthy();
});

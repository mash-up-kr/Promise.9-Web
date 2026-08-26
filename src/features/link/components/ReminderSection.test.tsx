import {
  fireEvent,
  render,
  screen,
  userEvent,
} from "@testing-library/react-native";

jest.mock("expo-notifications", () => ({
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: "undetermined" }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
}));

import { ReminderSection } from "./ReminderSection";

beforeEach(() => {
  jest.useFakeTimers({ doNotFake: ["queueMicrotask"] });
  jest.setSystemTime(new Date("2026-08-26T14:32:00"));
});
afterEach(() => jest.useRealTimers());

// RN Switch 는 react-native-testing-library 의 press() 시퀀스(responderGrant/Release)를
// onChange 로 연결하지 않는다 — 네이티브 위젯이 실제 토글해 onChange 를 emit 하는 구조라
// jest 렌더러에선 press() 가 값 변경을 못 일으킨다. fireEvent(el, "valueChange", v) 가
// RNTL 이 제공하는 Switch 전용 시뮬레이션 경로다(실측: user.press 는 0회 호출로 확인).
function toggleSwitch(value: boolean) {
  fireEvent(screen.getByRole("switch"), "valueChange", value);
}

it("토글 on → 내일 + 현재 시간(15분 올림) 기본값", async () => {
  const onChange = jest.fn();
  await render(<ReminderSection value={null} onChange={onChange} />);
  toggleSwitch(true);
  expect(onChange).toHaveBeenCalledWith({
    date: "2026-08-27",
    hour: 14,
    minute: 45,
  });
});

it("토글 off → null (재활성화 시 기본값으로 초기화되는 근거)", async () => {
  const onChange = jest.fn();
  await render(
    <ReminderSection
      value={{ date: "2026-09-10", hour: 9, minute: 0 }}
      onChange={onChange}
    />,
  );
  toggleSwitch(false);
  expect(onChange).toHaveBeenCalledWith(null);
});

it("off 상태는 안내 문구, on 상태는 날짜·시간·남은 기간 노출", async () => {
  const { rerender } = await render(
    <ReminderSection value={null} onChange={jest.fn()} />,
  );
  expect(screen.getByText("잊지 않도록 다시 알려드려요")).toBeTruthy();
  await rerender(
    <ReminderSection
      value={{ date: "2026-08-27", hour: 9, minute: 0 }}
      onChange={jest.fn()}
    />,
  );
  expect(screen.getByText("2026. 8. 27. 목요일")).toBeTruthy();
  expect(screen.getByText("오전 9:00")).toBeTruthy();
  expect(screen.getByText("1일 후")).toBeTruthy();
});

it("프리셋 탭 → 해당 일수 날짜로 변경(시간 유지)", async () => {
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  const onChange = jest.fn();
  await render(
    <ReminderSection
      value={{ date: "2026-08-27", hour: 9, minute: 0 }}
      onChange={onChange}
    />,
  );
  await user.press(screen.getByRole("button", { name: "7일 후" }));
  expect(onChange).toHaveBeenCalledWith({
    date: "2026-09-02",
    hour: 9,
    minute: 0,
  });
});

it("주사위 탭 → 1~180일 범위 날짜로 변경", async () => {
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  const onChange = jest.fn();
  await render(
    <ReminderSection
      value={{ date: "2026-08-27", hour: 9, minute: 0 }}
      onChange={onChange}
    />,
  );
  await user.press(screen.getByRole("button", { name: "랜덤 날짜" }));
  const next = onChange.mock.calls[0][0];
  expect(next.date > "2026-08-26").toBe(true);
  expect(next.date <= "2027-02-26").toBe(true);
  // "랜덤 날짜" 툴팁은 웹 hover 전용 — 네이티브 press 만으론(hover 없이) 노출되지 않는다.
  // (hover 자체는 jest 환경에서 검증 불가 — 수동 웹 스모크로 확인)
  expect(screen.queryByText("랜덤 날짜")).toBeNull();
});

it("최초 토글 on 시 알림 권한을 요청한다", async () => {
  const notifications = jest.requireMock("expo-notifications");
  await render(<ReminderSection value={null} onChange={jest.fn()} />);
  toggleSwitch(true);
  expect(notifications.getPermissionsAsync).toHaveBeenCalled();
});

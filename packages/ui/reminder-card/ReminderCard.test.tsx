import { render, screen, userEvent } from "@testing-library/react-native";
import { Text } from "react-native";

import {
  ReminderDiceButton,
  ReminderOffRow,
  ReminderOnCard,
} from "./ReminderCard";

const PRESETS = [
  { days: 1, label: "내일" },
  { days: 3, label: "3일 후" },
];

function renderOnCard(
  overrides: Partial<React.ComponentProps<typeof ReminderOnCard>> = {},
) {
  const props = {
    presets: PRESETS,
    selectedPresetDays: 1,
    onPreset: jest.fn(),
    diceButton: <Text>주사위 자리</Text>,
    dateLabel: "2026. 9. 22. 화요일",
    remainingLabel: "1일 후",
    timeLabel: "오후 6:30",
    onOpenDate: jest.fn(),
    onOpenTime: jest.fn(),
    ...overrides,
  };
  return { props, view: render(<ReminderOnCard {...props} />) };
}

describe("ReminderOffRow", () => {
  it("꺼진 상태 안내 문구를 보여준다", async () => {
    await render(<ReminderOffRow />);

    expect(screen.getByText("잊지 않도록 다시 알려드려요")).toBeOnTheScreen();
  });
});

describe("ReminderOnCard", () => {
  it("호출부가 포맷한 날짜·남은 기간·시간 라벨과 주사위 자리를 그대로 보여준다", async () => {
    const { view } = renderOnCard();
    await view;

    expect(screen.getByText("언제 알려드릴까요?")).toBeOnTheScreen();
    expect(screen.getByText("2026. 9. 22. 화요일")).toBeOnTheScreen();
    expect(screen.getByText("1일 후")).toBeOnTheScreen();
    expect(screen.getByText("오후 6:30")).toBeOnTheScreen();
    expect(screen.getByText("주사위 자리")).toBeOnTheScreen();
  });

  it("프리셋을 누르면 그 일수로 onPreset 을 부르고, 선택된 칩만 selected 다", async () => {
    const user = userEvent.setup();
    const { props, view } = renderOnCard();
    await view;

    expect(screen.getByRole("button", { name: "내일" })).toBeSelected();
    expect(screen.getByRole("button", { name: "3일 후" })).not.toBeSelected();

    await user.press(screen.getByRole("button", { name: "3일 후" }));

    expect(props.onPreset).toHaveBeenCalledWith(3);
  });

  it("날짜 행·시간 행을 누르면 각 핸들러를 부른다", async () => {
    const user = userEvent.setup();
    const { props, view } = renderOnCard();
    await view;

    await user.press(screen.getByRole("button", { name: /2026\. 9\. 22\./ }));
    await user.press(screen.getByRole("button", { name: /오후 6:30/ }));

    expect(props.onOpenDate).toHaveBeenCalledTimes(1);
    expect(props.onOpenTime).toHaveBeenCalledTimes(1);
  });
});

describe("ReminderDiceButton", () => {
  it("'랜덤 날짜' 버튼으로 읽히고 누르면 onPress 를 부른다", async () => {
    const user = userEvent.setup();
    const onPress = jest.fn();
    await render(<ReminderDiceButton onPress={onPress} />);

    await user.press(screen.getByRole("button", { name: "랜덤 날짜" }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("children 을 주면 기본 아이콘 대신 그것을 그린다", async () => {
    await render(
      <ReminderDiceButton onPress={jest.fn()}>
        <Text>흔들리는 주사위</Text>
      </ReminderDiceButton>,
    );

    expect(screen.getByText("흔들리는 주사위")).toBeOnTheScreen();
  });
});

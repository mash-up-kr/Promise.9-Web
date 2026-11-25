import { render, screen, userEvent } from "@testing-library/react-native";
import { BellOff } from "lucide-react-native";

import { InlineNotice } from "./InlineNotice";

const MESSAGE = "기기 알림이 꺼져 있어 앱 푸시를 받을 수 없어요.";

describe("InlineNotice", () => {
  test("메시지와 액션 버튼을 렌더하고, 버튼을 누르면 onPress 를 부른다", async () => {
    const user = userEvent.setup();
    const onPress = jest.fn();
    await render(
      <InlineNotice
        icon={BellOff}
        message={MESSAGE}
        action={{ label: "설정 열기", onPress }}
      />,
    );
    expect(screen.getByText(MESSAGE)).toBeOnTheScreen();

    await user.press(screen.getByRole("button", { name: "설정 열기" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test("action 이 없으면 버튼을 렌더하지 않는다", async () => {
    await render(<InlineNotice icon={BellOff} message={MESSAGE} />);
    expect(screen.getByText(MESSAGE)).toBeOnTheScreen();
    expect(screen.queryByRole("button")).not.toBeOnTheScreen();
  });
});

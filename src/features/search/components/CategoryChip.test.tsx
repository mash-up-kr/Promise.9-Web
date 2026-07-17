import { render, screen, userEvent } from "@testing-library/react-native";

import { CategoryChip } from "./CategoryChip";

describe("CategoryChip", () => {
  test("카테고리명을 보여주고, 누르면 onPress 를 호출한다", async () => {
    const onPress = jest.fn();
    await render(<CategoryChip name="개발" onPress={onPress} />);

    expect(screen.getByText("개발")).toBeOnTheScreen();

    const user = userEvent.setup();
    await user.press(screen.getByRole("button", { name: "개발" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

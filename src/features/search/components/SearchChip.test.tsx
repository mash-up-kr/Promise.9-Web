import { render, screen, userEvent } from "@testing-library/react-native";

import { SearchChip } from "./SearchChip";

describe("SearchChip", () => {
  test("검색어를 보여주고, 누르면 onPress 를 호출한다", async () => {
    const onPress = jest.fn();
    await render(<SearchChip keyword="사우나" onPress={onPress} />);

    expect(screen.getByText("사우나")).toBeOnTheScreen();

    const user = userEvent.setup();
    await user.press(screen.getByRole("button", { name: "사우나" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

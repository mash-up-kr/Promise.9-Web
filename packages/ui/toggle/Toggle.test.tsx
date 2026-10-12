import { render, screen, userEvent } from "@testing-library/react-native";

import { Toggle } from "./Toggle";

describe("Toggle", () => {
  it("탭하면 반전된 값으로 onChange 를 부른다", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    await render(<Toggle value={false} onChange={onChange} />);

    await user.press(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("checked 접근성 상태가 value 를 반영한다", async () => {
    const onChange = jest.fn();
    const { rerender } = await render(
      <Toggle value={false} onChange={onChange} />,
    );
    expect(screen.getByRole("switch").props.accessibilityState.checked).toBe(
      false,
    );

    await rerender(<Toggle value onChange={onChange} />);
    expect(screen.getByRole("switch").props.accessibilityState.checked).toBe(
      true,
    );
  });
});

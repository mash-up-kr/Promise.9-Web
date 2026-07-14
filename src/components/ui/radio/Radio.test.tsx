import { fireEvent, render, screen } from "@testing-library/react-native";
import { useState } from "react";

import {
  Radio,
  RadioGroup,
  RadioIcon,
  RadioIndicator,
  RadioLabel,
} from "./Radio";

function Harness() {
  const [value, setValue] = useState<string | null>(null);
  return (
    <RadioGroup value={value} onChange={setValue}>
      <Radio value="a">
        <RadioIndicator>
          <RadioIcon />
        </RadioIndicator>
        <RadioLabel>A</RadioLabel>
      </Radio>
      <Radio value="b">
        <RadioIndicator>
          <RadioIcon />
        </RadioIndicator>
        <RadioLabel>B</RadioLabel>
      </Radio>
    </RadioGroup>
  );
}

describe("Radio", () => {
  // getAllByRole("radio") 로 위치(index)로 찾는다 — 접근성 이름 계산에 의존하지 않는다.
  // fireEvent.press 는 RNTL 14 에서 async(React.act 래핑)라 await 없으면 state 가 flush 되지 않는다.
  test("옵션을 선택하면 checked 상태가 된다", async () => {
    await render(<Harness />);
    await fireEvent.press(screen.getAllByRole("radio")[0]);
    expect(
      screen.getAllByRole("radio")[0].props.accessibilityState.checked,
    ).toBe(true);
  });

  test("다른 옵션을 선택하면 이전 선택이 해제된다(단일 선택)", async () => {
    await render(<Harness />);
    await fireEvent.press(screen.getAllByRole("radio")[0]);
    await fireEvent.press(screen.getAllByRole("radio")[1]);
    const radios = screen.getAllByRole("radio");
    expect(radios[0].props.accessibilityState.checked).toBe(false);
    expect(radios[1].props.accessibilityState.checked).toBe(true);
  });
});

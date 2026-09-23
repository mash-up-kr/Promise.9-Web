import { render, screen } from "@testing-library/react-native";

import { SkeletonBlock } from "./SkeletonBlock.web";

test("웹 블록은 animate-pulse 로 펄스하고 넘겨받은 클래스를 유지한다", async () => {
  await render(<SkeletonBlock testID="block" className="h-4 rounded-md" />);
  const className = screen.getByTestId("block").props.className;
  expect(className).toContain("animate-pulse");
  expect(className).toContain("h-4 rounded-md");
});

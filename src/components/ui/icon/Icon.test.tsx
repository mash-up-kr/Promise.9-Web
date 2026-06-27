import { render } from "@testing-library/react-native";
import { Search } from "lucide-react-native";

import { Icon } from "./Icon";

describe("Icon", () => {
  test("iconNode 로 받은 아이콘을 svg 로 렌더한다", async () => {
    const { toJSON } = await render(<Icon iconNode={Search} />);
    expect(toJSON()).toBeTruthy();
  });

  test("size 를 생략하면 기본 18 이 적용된다", async () => {
    const { toJSON } = await render(<Icon iconNode={Search} />);
    const svg = toJSON();
    expect(svg?.props.width).toBe(18);
    expect(svg?.props.height).toBe(18);
  });

  test("size 를 지정하면 width·height 에 반영된다", async () => {
    const { toJSON } = await render(<Icon iconNode={Search} size={32} />);
    const svg = toJSON();
    expect(svg?.props.width).toBe(32);
    expect(svg?.props.height).toBe(32);
  });
});

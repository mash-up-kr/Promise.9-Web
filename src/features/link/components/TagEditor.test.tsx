import {
  fireEvent,
  render,
  screen,
  userEvent,
} from "@testing-library/react-native";

import { TagEditor } from "./TagEditor";

const TAGS = ["디자인", "IT", "실험 설계"];
const PLACEHOLDER = "태그를 입력해 주세요";
const TOOLTIP = "태그를 추가하면 링크를 더 쉽게 찾을 수 있어요";

describe("TagEditor", () => {
  test("뷰 모드: '태그 추가' 버튼과 각 태그 칩을 렌더하고, 칩에 삭제 버튼이 없다", async () => {
    await render(
      <TagEditor tags={TAGS} onAddTag={jest.fn()} onRemoveTag={jest.fn()} />,
    );
    expect(screen.getByRole("button", { name: "태그 추가" })).toBeOnTheScreen();
    expect(screen.getByText("#디자인")).toBeOnTheScreen();
    expect(screen.getByText("#IT")).toBeOnTheScreen();
    expect(screen.queryByLabelText(/삭제/)).toBeNull();
  });

  test("'태그 추가' 탭 → 편집 모드: 입력·완료·삭제 버튼과 온보딩 툴팁이 나타난다", async () => {
    const user = userEvent.setup();
    await render(
      <TagEditor tags={TAGS} onAddTag={jest.fn()} onRemoveTag={jest.fn()} />,
    );
    await user.press(screen.getByRole("button", { name: "태그 추가" }));
    expect(screen.getByPlaceholderText(PLACEHOLDER)).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "완료" })).toBeOnTheScreen();
    expect(screen.getByLabelText("디자인 삭제")).toBeOnTheScreen();
    expect(screen.getByText(TOOLTIP)).toBeOnTheScreen();
  });

  test("입력 후 '추가' → onAddTag 가 trim 값으로 호출되고 입력이 비워지며 툴팁이 사라진다", async () => {
    const user = userEvent.setup();
    const onAddTag = jest.fn();
    await render(
      <TagEditor tags={TAGS} onAddTag={onAddTag} onRemoveTag={jest.fn()} />,
    );
    await user.press(screen.getByRole("button", { name: "태그 추가" }));
    await user.type(screen.getByPlaceholderText(PLACEHOLDER), "포트폴리오");
    await user.press(screen.getByRole("button", { name: "추가" }));
    expect(onAddTag).toHaveBeenCalledWith("포트폴리오");
    expect(screen.getByPlaceholderText(PLACEHOLDER).props.value).toBe("");
    expect(screen.queryByText(TOOLTIP)).toBeNull();
  });

  test("입력을 시작하면(추가 전에도) 온보딩 툴팁이 사라진다", async () => {
    const user = userEvent.setup();
    await render(
      <TagEditor tags={TAGS} onAddTag={jest.fn()} onRemoveTag={jest.fn()} />,
    );
    await user.press(screen.getByRole("button", { name: "태그 추가" }));
    expect(screen.getByText(TOOLTIP)).toBeOnTheScreen();
    await user.type(screen.getByPlaceholderText(PLACEHOLDER), "포");
    expect(screen.queryByText(TOOLTIP)).toBeNull();
  });

  test("칩의 삭제 버튼 탭 → onRemoveTag 가 해당 태그로 호출된다", async () => {
    const user = userEvent.setup();
    const onRemoveTag = jest.fn();
    await render(
      <TagEditor tags={TAGS} onAddTag={jest.fn()} onRemoveTag={onRemoveTag} />,
    );
    await user.press(screen.getByRole("button", { name: "태그 추가" }));
    await user.press(screen.getByLabelText("IT 삭제"));
    expect(onRemoveTag).toHaveBeenCalledWith("IT");
  });

  test("공백만 입력 후 '추가' → onAddTag 가 호출되지 않는다", async () => {
    const user = userEvent.setup();
    const onAddTag = jest.fn();
    await render(
      <TagEditor tags={TAGS} onAddTag={onAddTag} onRemoveTag={jest.fn()} />,
    );
    await user.press(screen.getByRole("button", { name: "태그 추가" }));
    fireEvent.changeText(screen.getByPlaceholderText(PLACEHOLDER), "   ");
    await user.press(screen.getByRole("button", { name: "추가" }));
    expect(onAddTag).not.toHaveBeenCalled();
  });

  test("앞뒤 공백이 포함된 값 입력 후 '추가' → onAddTag 가 trim 된 값으로 호출된다", async () => {
    const user = userEvent.setup();
    const onAddTag = jest.fn();
    await render(
      <TagEditor tags={TAGS} onAddTag={onAddTag} onRemoveTag={jest.fn()} />,
    );
    await user.press(screen.getByRole("button", { name: "태그 추가" }));
    await user.type(screen.getByPlaceholderText(PLACEHOLDER), "  회고  ");
    await user.press(screen.getByRole("button", { name: "추가" }));
    expect(onAddTag).toHaveBeenCalledWith("회고");
  });

  test("이미 존재하는 태그 입력 후 '추가' → onAddTag 미호출 + 중복 메시지가 노출된다", async () => {
    const user = userEvent.setup();
    const onAddTag = jest.fn();
    await render(
      <TagEditor tags={TAGS} onAddTag={onAddTag} onRemoveTag={jest.fn()} />,
    );
    await user.press(screen.getByRole("button", { name: "태그 추가" }));
    await user.type(screen.getByPlaceholderText(PLACEHOLDER), "디자인");
    await user.press(screen.getByRole("button", { name: "추가" }));
    expect(onAddTag).not.toHaveBeenCalled();
    expect(
      screen.getByText("‘디자인’은 이미 추가된 태그예요"),
    ).toBeOnTheScreen();
  });

  test("태그 10개면 입력 필드가 비활성화되고 '추가'가 disabled 이며 툴팁이 없다", async () => {
    const user = userEvent.setup();
    const onAddTag = jest.fn();
    const tenTags = Array.from({ length: 10 }, (_, i) => `태그${i}`);
    await render(
      <TagEditor tags={tenTags} onAddTag={onAddTag} onRemoveTag={jest.fn()} />,
    );
    await user.press(screen.getByRole("button", { name: "태그 추가" }));
    const input = screen.getByPlaceholderText(PLACEHOLDER);
    expect(input.props.editable).toBe(false);
    const addButton = screen.getByRole("button", { name: "추가" });
    expect(addButton.props.accessibilityState.disabled).toBe(true);
    expect(screen.queryByText(TOOLTIP)).toBeNull();
    fireEvent.changeText(input, "새태그");
    await user.press(addButton);
    expect(onAddTag).not.toHaveBeenCalled();
  });

  test("'완료' 탭 → 편집 모드 종료, 칩의 삭제 버튼이 사라진다", async () => {
    const user = userEvent.setup();
    await render(
      <TagEditor tags={TAGS} onAddTag={jest.fn()} onRemoveTag={jest.fn()} />,
    );
    await user.press(screen.getByRole("button", { name: "태그 추가" }));
    expect(screen.getByLabelText("디자인 삭제")).toBeOnTheScreen();
    await user.press(screen.getByRole("button", { name: "완료" }));
    expect(screen.queryByLabelText(/삭제/)).toBeNull();
    expect(screen.getByRole("button", { name: "태그 추가" })).toBeOnTheScreen();
  });
});

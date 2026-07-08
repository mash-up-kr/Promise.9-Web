import { fireEvent, render, screen } from "@testing-library/react-native";

import { MemoField } from "./MemoField";

const PLACEHOLDER = "저장한 이유나 기억하고 싶은 점을 적어보세요";

describe("MemoField", () => {
  test("'메모' 섹션 타이틀을 렌더한다", async () => {
    await render(<MemoField memo="" onChangeMemo={jest.fn()} />);
    expect(screen.getByText("메모")).toBeOnTheScreen();
  });

  test("memo 가 빈 문자열이면 placeholder 문구가 보인다", async () => {
    await render(<MemoField memo="" onChangeMemo={jest.fn()} />);
    expect(screen.getByPlaceholderText(PLACEHOLDER)).toBeOnTheScreen();
  });

  test("memo 에 값이 있으면 해당 값이 입력 필드에 렌더된다", async () => {
    await render(<MemoField memo="저장한 이유" onChangeMemo={jest.fn()} />);
    expect(screen.getByDisplayValue("저장한 이유")).toBeOnTheScreen();
  });

  test("입력하면 onChangeMemo 가 새 값으로 호출된다", async () => {
    const onChangeMemo = jest.fn();
    await render(<MemoField memo="" onChangeMemo={onChangeMemo} />);
    fireEvent.changeText(screen.getByPlaceholderText(PLACEHOLDER), "메모 내용");
    expect(onChangeMemo).toHaveBeenCalledWith("메모 내용");
  });

  test("개행이 포함된 값을 입력하면 onChangeMemo 에 개행이 그대로 포함돼 호출된다", async () => {
    const onChangeMemo = jest.fn();
    await render(<MemoField memo="" onChangeMemo={onChangeMemo} />);
    fireEvent.changeText(
      screen.getByPlaceholderText(PLACEHOLDER),
      "첫 줄\n둘째 줄",
    );
    expect(onChangeMemo).toHaveBeenCalledWith("첫 줄\n둘째 줄");
  });

  test("memo 가 비어 있으면 글자 수 카운터를 노출하지 않는다", async () => {
    await render(<MemoField memo="" onChangeMemo={jest.fn()} />);
    expect(screen.queryByText(/\/300$/)).toBeNull();
  });

  test("memo 에 값이 있으면 '글자수/300' 카운터를 노출한다", async () => {
    await render(<MemoField memo="가나다" onChangeMemo={jest.fn()} />);
    expect(screen.getByText("3/300")).toBeOnTheScreen();
  });

  test("입력 필드에 300자 제한(maxLength)이 걸려 있다", async () => {
    await render(<MemoField memo="" onChangeMemo={jest.fn()} />);
    expect(screen.getByPlaceholderText(PLACEHOLDER).props.maxLength).toBe(300);
  });
});

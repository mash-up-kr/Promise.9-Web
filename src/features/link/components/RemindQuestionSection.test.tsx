import { fireEvent, render, screen } from "@testing-library/react-native";

import { RemindQuestionSection } from "./RemindQuestionSection";

describe("RemindQuestionSection", () => {
  test("질문과 3개 옵션을 렌더한다", async () => {
    await render(<RemindQuestionSection value={null} onChange={jest.fn()} />);
    // 질문 Text 는 필수 마커(*) 를 중첩 Text 로 품으므로 부분 매칭한다.
    expect(
      screen.getByText(/이 링크는 언제 다시 필요할까요/),
    ).toBeOnTheScreen();
    expect(screen.getByText("곧 활용할게요")).toBeOnTheScreen();
    expect(screen.getByText("나중에 활용할게요")).toBeOnTheScreen();
    expect(screen.getByText("참고용으로 저장할게요")).toBeOnTheScreen();
  });

  test("옵션 선택 시 해당 value 로 onChange 를 호출한다", async () => {
    const onChange = jest.fn();
    await render(<RemindQuestionSection value={null} onChange={onChange} />);
    await fireEvent.press(screen.getByText("곧 활용할게요"));
    expect(onChange).toHaveBeenCalledWith("soon");
  });
});

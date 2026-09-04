import { render, screen, userEvent } from "@testing-library/react-native";

import { AiSummarySection } from "./AiSummarySection";

const SUMMARY =
  "토스뱅크 인턴이 비회원 가입 전환율을 개선하는 과정에서 실험 설계와 가설 검증의 중요성을 배운 경험을 소개하는 글이에요.";

describe("AiSummarySection", () => {
  test("헤더 라벨 'AI 요약으로 미리보기' 를 렌더한다", async () => {
    await render(<AiSummarySection status="SUCCESS" summary={SUMMARY} />);
    expect(screen.getByText("AI 요약으로 미리보기")).toBeOnTheScreen();
  });

  test("기본 상태는 접힘이다", async () => {
    await render(<AiSummarySection status="SUCCESS" summary={SUMMARY} />);
    expect(
      screen.getByRole("button", { name: "AI 요약으로 미리보기" }).props
        .accessibilityState.expanded,
    ).toBe(false);
  });

  test("접힌 상태에서도 전체 요약 텍스트가 트리에 존재한다", async () => {
    await render(<AiSummarySection status="SUCCESS" summary={SUMMARY} />);
    expect(screen.getByText(SUMMARY)).toBeOnTheScreen();
  });

  test("헤더를 탭하면 펼침 상태로 바뀐다", async () => {
    const user = userEvent.setup();
    await render(<AiSummarySection status="SUCCESS" summary={SUMMARY} />);
    await user.press(
      screen.getByRole("button", { name: "AI 요약으로 미리보기" }),
    );
    expect(
      screen.getByRole("button", { name: "AI 요약으로 미리보기" }).props
        .accessibilityState.expanded,
    ).toBe(true);
  });

  test("펼친 뒤 다시 탭하면 접힘 상태로 돌아온다", async () => {
    const user = userEvent.setup();
    await render(<AiSummarySection status="SUCCESS" summary={SUMMARY} />);
    const header = screen.getByRole("button", {
      name: "AI 요약으로 미리보기",
    });
    await user.press(header);
    await user.press(header);
    expect(header.props.accessibilityState.expanded).toBe(false);
  });

  test("PENDING 이면 '요약을 준비 중이에요' 로딩을 노출한다", async () => {
    await render(<AiSummarySection status="PENDING" summary={null} />);
    expect(screen.getByText("요약을 준비 중이에요")).toBeOnTheScreen();
    expect(screen.getByRole("progressbar")).toBeOnTheScreen();
    expect(screen.queryByText(SUMMARY)).toBeNull();
  });

  test("FAILED 이면 아무것도 렌더하지 않는다", async () => {
    const { toJSON } = await render(
      <AiSummarySection status="FAILED" summary={null} />,
    );
    expect(toJSON()).toBeNull();
  });

  test("완료여도 요약이 없으면 렌더하지 않는다", async () => {
    const { toJSON } = await render(
      <AiSummarySection status="SUCCESS" summary={null} />,
    );
    expect(toJSON()).toBeNull();
  });
});

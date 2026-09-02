import { render, screen, userEvent } from "@testing-library/react-native";

import {
  BottomSheetHeader,
  bottomSheetHeaderButtonStyles,
} from "./BottomSheetHeader";

describe("BottomSheetHeader", () => {
  test("타이틀·설명·취소·저장을 렌더한다", async () => {
    await render(
      <BottomSheetHeader
        title="새 폴더"
        description="폴더 이름을 입력해 주세요"
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
      />,
    );
    expect(screen.getByText("새 폴더")).toBeOnTheScreen();
    expect(screen.getByText("폴더 이름을 입력해 주세요")).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "취소" })).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "저장" })).toBeOnTheScreen();
  });

  test("설명이 없으면 타이틀만 렌더한다", async () => {
    await render(
      <BottomSheetHeader
        title="새 폴더"
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
      />,
    );
    expect(screen.getByText("새 폴더")).toBeOnTheScreen();
    expect(screen.queryByText("폴더 이름을 입력해 주세요")).toBeNull();
  });

  test("취소·저장을 누르면 각 콜백을 호출한다", async () => {
    const onCancel = jest.fn();
    const onConfirm = jest.fn();
    await render(
      <BottomSheetHeader
        title="새 폴더"
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    );
    const user = userEvent.setup();
    await user.press(screen.getByText("취소"));
    expect(onCancel).toHaveBeenCalledTimes(1);
    await user.press(screen.getByText("저장"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  test("isConfirmDisabled 면 저장을 눌러도 호출되지 않는다", async () => {
    const onConfirm = jest.fn();
    await render(
      <BottomSheetHeader
        title="새 폴더"
        onCancel={jest.fn()}
        onConfirm={onConfirm}
        isConfirmDisabled
      />,
    );
    const user = userEvent.setup();
    await user.press(screen.getByText("저장"));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  test("isConfirmPending 이면 저장 라벨 대신 스피너가 보이고 저장은 비활성화된다", async () => {
    const onConfirm = jest.fn();
    await render(
      <BottomSheetHeader
        title="새 폴더"
        onCancel={jest.fn()}
        onConfirm={onConfirm}
        isConfirmPending
      />,
    );
    expect(screen.getByRole("progressbar")).toBeOnTheScreen();
    expect(screen.queryByText("저장")).toBeNull();
    const user = userEvent.setup();
    await user.press(screen.getByRole("button", { name: "저장" }));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  test("라벨을 바꿀 수 있다", async () => {
    await render(
      <BottomSheetHeader
        title="링크 저장"
        cancelLabel="닫기"
        confirmLabel="완료"
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
      />,
    );
    expect(screen.getByText("닫기")).toBeOnTheScreen();
    expect(screen.getByText("완료")).toBeOnTheScreen();
  });

  // jest 는 className 을 해석하지 않으므로 tv 매핑을 직접 단언한다(expo-pitfalls).
  describe("bottomSheetHeaderButtonStyles", () => {
    test("버튼은 시안 Action Button Small(높이 44·최소폭 60·pill)이다", () => {
      const cls = bottomSheetHeaderButtonStyles({ variant: "assistive" });
      expect(cls).toContain("h-11");
      expect(cls).toContain("min-w-[60px]");
      expect(cls).toContain("rounded-full");
    });

    test("assistive(취소)는 gray-700, primary(저장)는 흰 배경이다", () => {
      expect(bottomSheetHeaderButtonStyles({ variant: "assistive" })).toContain(
        "bg-gray-700",
      );
      expect(bottomSheetHeaderButtonStyles({ variant: "primary" })).toContain(
        "bg-opacity-white-100",
      );
    });

    test("primary 가 비활성이면 중립 회색으로 수렴한다", () => {
      const cls = bottomSheetHeaderButtonStyles({
        variant: "primary",
        isDisabled: true,
      });
      expect(cls).toContain("bg-gray-200");
    });
  });
});

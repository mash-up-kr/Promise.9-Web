import { fireEvent, render, screen } from "@testing-library/react-native";

import {
  AlertDialog,
  AlertDialogButton,
  alertButtonStyles,
} from "./AlertDialog";

async function renderDialog(
  overrides: Partial<{
    isOpen: boolean;
    onClose: () => void;
    onCancel: () => void;
    onDelete: () => void;
    closeOnOverlayClick: boolean;
  }> = {},
) {
  const props = {
    isOpen: true,
    onClose: jest.fn(),
    onCancel: jest.fn(),
    onDelete: jest.fn(),
    ...overrides,
  };
  await render(
    <AlertDialog
      isOpen={props.isOpen}
      onClose={props.onClose}
      closeOnOverlayClick={props.closeOnOverlayClick}
      title="폴더를 삭제하시겠어요?"
      description="저장된 링크는 미분류 폴더로 이동됩니다."
      actions={
        <>
          <AlertDialogButton
            variant="secondary"
            label="취소"
            onPress={props.onCancel}
          />
          <AlertDialogButton
            variant="destructive"
            label="폴더 삭제"
            onPress={props.onDelete}
          />
        </>
      }
    />,
  );
  return props;
}

describe("AlertDialog", () => {
  test("isOpen 이 false 면 아무것도 렌더하지 않는다", async () => {
    await renderDialog({ isOpen: false });
    expect(screen.queryByText("폴더를 삭제하시겠어요?")).toBeNull();
  });

  test("isOpen 이 true 면 타이틀·본문·액션을 렌더한다", async () => {
    await renderDialog();
    expect(screen.getByText("폴더를 삭제하시겠어요?")).toBeOnTheScreen();
    expect(
      screen.getByText("저장된 링크는 미분류 폴더로 이동됩니다."),
    ).toBeOnTheScreen();
    expect(screen.getByText("취소")).toBeOnTheScreen();
    expect(screen.getByText("폴더 삭제")).toBeOnTheScreen();
  });

  test("액션 버튼을 누르면 해당 onPress 가 호출된다", async () => {
    const { onCancel, onDelete } = await renderDialog();
    fireEvent.press(screen.getByText("폴더 삭제"));
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  test("backdrop 을 누르면 onClose 가 호출된다", async () => {
    const { onClose } = await renderDialog();
    fireEvent.press(
      screen.getByRole("button", {
        name: "닫기",
        includeHiddenElements: true,
      }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("closeOnOverlayClick=false 면 backdrop 을 눌러도 닫히지 않는다", async () => {
    const { onClose } = await renderDialog({ closeOnOverlayClick: false });
    fireEvent.press(
      screen.getByRole("button", {
        name: "닫기",
        includeHiddenElements: true,
      }),
    );
    expect(onClose).not.toHaveBeenCalled();
  });
});

// jest 는 className 을 해석하지 않으므로 tv 매핑을 직접 단언한다(expo-pitfalls).
describe("alertButtonStyles", () => {
  test("버튼은 시안 Action Button Medium(높이 48·pill)이다", () => {
    const cls = alertButtonStyles({ variant: "secondary" });
    expect(cls).toContain("h-12");
    expect(cls).toContain("rounded-full");
  });

  test("secondary 는 gray-600 배경이다", () => {
    expect(alertButtonStyles({ variant: "secondary" })).toContain(
      "bg-gray-600",
    );
  });

  test("primary 는 흰 배경(확인 버튼)이다", () => {
    expect(alertButtonStyles({ variant: "primary" })).toContain(
      "bg-opacity-white-100",
    );
  });

  test("destructive 는 action-destructive 토큰 배경이다", () => {
    const cls = alertButtonStyles({ variant: "destructive" });
    expect(cls).toContain("bg-action-destructive-background");
    expect(cls).not.toContain("rgba");
  });
});

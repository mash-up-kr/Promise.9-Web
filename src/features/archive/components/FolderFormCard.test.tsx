import { ApiError } from "@shared/api/errors";
import { FOLDER_ERROR_CODE } from "@shared/entities/folder/folder.errors";
import type { CreateFolderInput } from "@shared/folder/folder.contracts";
import {
  render,
  screen,
  userEvent,
  waitFor,
} from "@testing-library/react-native";
import type { AxiosResponse } from "axios";
import { FolderFormCard } from "./FolderFormCard";

const conflictError = (errorCode: number) =>
  new ApiError({
    status: 409,
    data: {
      success: false,
      error: {
        code: 409,
        errorCode,
        message: "이미 존재하는 폴더 이름입니다.",
        timestamp: "2026-07-26T00:00:00.000Z",
      },
    },
  } as unknown as AxiosResponse);

const defaultValues: CreateFolderInput = { folderName: "", color: "blue" };

const renderCard = async (
  props: Partial<Parameters<typeof FolderFormCard>[0]> = {},
) => {
  const onSubmit = jest.fn().mockResolvedValue(undefined);
  const onClose = jest.fn();
  const onError = jest.fn();
  await render(
    <FolderFormCard
      title="새 폴더 만들기"
      defaultValues={defaultValues}
      onSubmit={onSubmit}
      onClose={onClose}
      onError={onError}
      {...props}
    />,
  );
  return { onSubmit, onClose, onError };
};

const typeName = async (name: string) => {
  const user = userEvent.setup();
  await user.type(screen.getByPlaceholderText("폴더 이름을 입력하세요."), name);
  await waitFor(() =>
    expect(
      screen.getByLabelText("저장").props.accessibilityState.disabled,
    ).toBe(false),
  );
  return user;
};

test("이름 입력 후 저장하면 onSubmit 을 호출하고 이어서 onClose 를 호출한다", async () => {
  const { onSubmit, onClose } = await renderCard();
  const user = await typeName("디자인");
  await user.press(screen.getByLabelText("저장"));

  await waitFor(() =>
    expect(onSubmit).toHaveBeenCalledWith(
      { folderName: "디자인", color: "blue" },
      expect.anything(),
    ),
  );
  await waitFor(() => expect(onClose).toHaveBeenCalled());
});

test("중복 이름 에러면 다이얼로그를 띄우고 onError 는 호출하지 않는다", async () => {
  const onSubmit = jest
    .fn()
    .mockRejectedValue(conflictError(FOLDER_ERROR_CODE.DUPLICATE_NAME));
  const { onClose, onError } = await renderCard({ onSubmit });
  const user = await typeName("디자인");
  await user.press(screen.getByLabelText("저장"));

  expect(
    await screen.findByText("같은 이름의 폴더가 있어요"),
  ).toBeOnTheScreen();
  expect(screen.getByText("다른 이름을 입력해 주세요")).toBeOnTheScreen();
  expect(onError).not.toHaveBeenCalled();
  expect(onClose).not.toHaveBeenCalled();
});

test("일반 에러면 onError 를 호출하고 onClose 는 호출하지 않는다", async () => {
  const error = new Error("network");
  const onSubmit = jest.fn().mockRejectedValue(error);
  const { onClose, onError } = await renderCard({ onSubmit });
  const user = await typeName("디자인");
  await user.press(screen.getByLabelText("저장"));

  await waitFor(() => expect(onError).toHaveBeenCalledWith(error));
  expect(onClose).not.toHaveBeenCalled();
});

test("errorMessage 를 넘기면 색상 선택 아래에 문구를 렌더한다", async () => {
  await renderCard({
    errorMessage: "폴더를 만들지 못했어요. 다시 시도해주세요",
  });

  expect(
    screen.getByText("폴더를 만들지 못했어요. 다시 시도해주세요"),
  ).toBeOnTheScreen();
});

test("취소를 누르면 onClose 를 호출한다", async () => {
  const { onClose } = await renderCard();
  const user = userEvent.setup();
  await user.press(screen.getByText("취소"));

  expect(onClose).toHaveBeenCalled();
});

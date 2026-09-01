jest.mock("expo-share-extension", () => ({
  close: jest.fn(),
  openHostApp: jest.fn(),
}));
jest.mock("@shared/api", () => ({
  apiClient: { get: jest.fn(), post: jest.fn() },
}));

import { apiClient } from "@shared/api";
import { ApiError } from "@shared/api/errors";
import { render, screen, userEvent } from "@testing-library/react-native";
import { close, openHostApp } from "expo-share-extension";

import { ShareExtension } from "./ShareExtension";

const mockPost = apiClient.post as jest.Mock;
const mockGet = apiClient.get as jest.Mock;

const FOLDERS_RESPONSE = {
  systemFolders: {
    all: { linkCount: 3 },
    uncategorized: { linkCount: 1 },
    favorite: { linkCount: 0 },
    recentlyDeleted: { linkCount: 0 },
  },
  folders: [
    {
      folderId: 1,
      folderName: "디자인",
      color: "#d5d76a",
      linkCount: 2,
      lastSavedAt: null,
    },
    {
      folderId: 2,
      folderName: "개발",
      color: "#6a9fd7",
      linkCount: 1,
      lastSavedAt: null,
    },
  ],
};

function duplicateError(linkId?: number) {
  return new ApiError({
    status: 409,
    data: {
      success: false,
      error: {
        code: 409,
        errorCode: 930003,
        message: "이미 저장한 링크입니다.",
        timestamp: "",
        ...(linkId != null ? { linkId } : {}),
      },
    },
  } as never);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGet.mockResolvedValue({
    data: { success: true, data: FOLDERS_RESPONSE },
  });
});

test("공유받은 URL 을 표시한다", async () => {
  await render(<ShareExtension url="https://toss.tech/a" />);
  expect(screen.getByText("https://toss.tech/a")).toBeOnTheScreen();
});

test("취소를 누르면 익스텐션을 닫는다", async () => {
  await render(<ShareExtension url="https://toss.tech/a" />);
  await userEvent.setup().press(screen.getByText("취소"));
  expect(close).toHaveBeenCalled();
});

test("저장 성공 → 성공 시트, '링크 보러가기'는 저장한 링크 상세를 연다", async () => {
  mockPost.mockResolvedValue({ data: { success: true, data: { linkId: 42 } } });
  await render(<ShareExtension url="https://toss.tech/a" />);
  const user = userEvent.setup();

  await user.press(screen.getByText("저장"));

  expect(await screen.findByText("링크 저장을 완료했어요")).toBeOnTheScreen();
  expect(mockPost).toHaveBeenCalledWith("/links", {
    url: "https://toss.tech/a",
    folderId: null,
    memo: null,
    reminderAt: null,
  });

  await user.press(screen.getByText("링크 보러가기"));
  expect(openHostApp).toHaveBeenCalledWith("link/42");
});

test("중복 저장 → 중복 시트, '링크 보러가기'는 기존 링크 상세를 연다", async () => {
  mockPost.mockRejectedValue(duplicateError(77));
  await render(<ShareExtension url="https://toss.tech/a" />);
  const user = userEvent.setup();

  await user.press(screen.getByText("저장"));

  expect(await screen.findByText("이미 저장된 링크예요")).toBeOnTheScreen();
  expect(
    screen.getByText("이전에 저장한 링크를 확인해보세요"),
  ).toBeOnTheScreen();

  await user.press(screen.getByText("링크 보러가기"));
  expect(openHostApp).toHaveBeenCalledWith("link/77");
});

test("중복인데 linkId 가 없으면(구버전 응답) '링크 보러가기'는 홈을 연다", async () => {
  mockPost.mockRejectedValue(duplicateError());
  await render(<ShareExtension url="https://toss.tech/a" />);
  const user = userEvent.setup();

  await user.press(screen.getByText("저장"));
  await user.press(await screen.findByText("링크 보러가기"));
  expect(openHostApp).toHaveBeenCalledWith("");
});

test("저장 실패 → 실패 시트, '다시 시도'가 같은 URL 로 재요청한다", async () => {
  mockPost.mockRejectedValue(new Error("network"));
  await render(<ShareExtension url="https://toss.tech/a" />);
  const user = userEvent.setup();

  await user.press(screen.getByText("저장"));
  expect(await screen.findByText("링크를 저장하지 못했어요")).toBeOnTheScreen();
  expect(
    screen.getByText("네트워크 연결을 확인한 뒤 다시 시도해주세요"),
  ).toBeOnTheScreen();

  mockPost.mockResolvedValue({ data: { success: true, data: { linkId: 7 } } });
  await user.press(screen.getByText("다시 시도"));
  expect(await screen.findByText("링크 저장을 완료했어요")).toBeOnTheScreen();
  expect(mockPost).toHaveBeenCalledTimes(2);
});

test("3회 연속 실패 → 반복 실패 시트, '닫기'는 익스텐션을 닫는다", async () => {
  mockPost.mockRejectedValue(new Error("network"));
  await render(<ShareExtension url="https://toss.tech/a" />);
  const user = userEvent.setup();

  await user.press(screen.getByText("저장"));
  expect(await screen.findByText("다시 시도")).toBeOnTheScreen();
  await user.press(screen.getByText("다시 시도"));
  expect(await screen.findByText("다시 시도")).toBeOnTheScreen();
  await user.press(screen.getByText("다시 시도"));

  expect(
    await screen.findByText("잠시 후 다시 시도해주세요"),
  ).toBeOnTheScreen();
  await user.press(screen.getByText("닫기"));
  expect(close).toHaveBeenCalled();
});

test("폴더 목록을 칩으로 보여주고 기본 선택은 미분류다", async () => {
  await render(<ShareExtension url="https://toss.tech/a" />);

  expect(await screen.findByText("디자인")).toBeOnTheScreen();
  expect(screen.getByText("개발")).toBeOnTheScreen();
  expect(
    screen.getByLabelText("미분류").props.accessibilityState.selected,
  ).toBe(true);
});

test("폴더 칩을 선택해 저장하면 folderId 가 실린다", async () => {
  mockPost.mockResolvedValue({ data: { success: true, data: { linkId: 1 } } });
  await render(<ShareExtension url="https://toss.tech/a" />);
  const user = userEvent.setup();

  await user.press(await screen.findByText("디자인"));
  await user.press(screen.getByText("저장"));

  expect(mockPost).toHaveBeenCalledWith(
    "/links",
    expect.objectContaining({ folderId: 1 }),
  );
});

test("메모를 입력해 저장하면 앞뒤 공백을 제거해 실린다", async () => {
  mockPost.mockResolvedValue({ data: { success: true, data: { linkId: 1 } } });
  await render(<ShareExtension url="https://toss.tech/a" />);
  const user = userEvent.setup();

  await user.type(
    screen.getByPlaceholderText("저장한 이유나 기억하고 싶은 점을 적어보세요"),
    "  나중에 읽기  ",
  );
  await user.press(screen.getByText("저장"));

  expect(mockPost).toHaveBeenCalledWith(
    "/links",
    expect.objectContaining({ memo: "나중에 읽기" }),
  );
});

test("폴더 목록 로딩이 실패해도 미분류로 저장할 수 있다", async () => {
  const spy = jest.spyOn(console, "error").mockImplementation(() => {});
  mockGet.mockRejectedValue(new Error("network"));
  mockPost.mockResolvedValue({ data: { success: true, data: { linkId: 1 } } });
  await render(<ShareExtension url="https://toss.tech/a" />);

  await userEvent.setup().press(screen.getByText("저장"));

  expect(await screen.findByText("링크 저장을 완료했어요")).toBeOnTheScreen();
  expect(mockPost).toHaveBeenCalledWith(
    "/links",
    expect.objectContaining({ folderId: null }),
  );
  spy.mockRestore();
});

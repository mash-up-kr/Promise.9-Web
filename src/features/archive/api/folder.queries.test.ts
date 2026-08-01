// client.ts 는 import 시 EXPO_PUBLIC_API_BASE_URL 를 요구하므로 apiClient 만 mock 하고
// 에러 유틸(ApiError·isApiError)은 실제 구현을 쓴다.
jest.mock("@shared/api", () => {
  const errors = jest.requireActual("@shared/api/errors");
  return { apiClient: { get: jest.fn(), post: jest.fn() }, ...errors };
});

import { ApiError } from "@shared/api";
import type { AxiosResponse } from "axios";

import { FOLDER_ERROR_CODE } from "../archive.constants";
import {
  isDuplicateFolderNameError,
  toArchiveFolderData,
} from "./folder.queries";

describe("toArchiveFolderData", () => {
  const response = {
    systemFolders: {
      all: { linkCount: 10 },
      uncategorized: { linkCount: 2 },
      favorite: { linkCount: 0 },
      recentlyDeleted: { linkCount: 1 },
    },
    folders: [
      {
        folderId: 3,
        folderName: "디자인",
        color: "#61a8ef",
        linkCount: 5,
        lastSavedAt: null,
      },
      {
        folderId: 7,
        folderName: "기타",
        color: "#000000",
        linkCount: 0,
        lastSavedAt: null,
      },
    ],
  };

  it("systemFolders 카운트를 기본 폴더 항목으로 변환한다", () => {
    expect(toArchiveFolderData(response).systemFolders).toEqual([
      { id: "all", name: "전체", count: 10, tone: "gray" },
      { id: "uncategorized", name: "미분류", count: 2, tone: "gray" },
      { id: "favorites", name: "즐겨찾기", count: 0, tone: "gray" },
      { id: "trash", name: "최근 삭제된 링크", count: 1, tone: "gray" },
    ]);
  });

  it("사용자 폴더의 hex color 를 tone 으로 변환하고 기본색은 gray 로 폴백한다", () => {
    expect(toArchiveFolderData(response).myFolders).toEqual([
      { id: "3", name: "디자인", count: 5, tone: "blue" },
      { id: "7", name: "기타", count: 0, tone: "gray" },
    ]);
  });
});

describe("isDuplicateFolderNameError", () => {
  const apiError = (status: number, errorCode: number) =>
    new ApiError({
      status,
      data: {
        success: false,
        error: {
          code: status,
          errorCode,
          message: "이미 존재하는 폴더 이름입니다.",
          timestamp: "2026-07-26T00:00:00.000Z",
        },
      },
    } as unknown as AxiosResponse);

  it("폴더 이름 중복 errorCode 를 판별한다", () => {
    expect(
      isDuplicateFolderNameError(
        apiError(409, FOLDER_ERROR_CODE.DUPLICATE_NAME),
      ),
    ).toBe(true);
  });

  // 409 는 "중복 생성 또는 리소스 상태 충돌" 이라 상태 코드만으로는 단정할 수 없다.
  it("중복 이름이 아닌 409 는 판별하지 않는다", () => {
    expect(isDuplicateFolderNameError(apiError(409, 910002))).toBe(false);
  });

  it("API 에러가 아니면 판별하지 않는다", () => {
    expect(isDuplicateFolderNameError(new Error("network"))).toBe(false);
  });
});

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
  folderListResponseSchema,
  folderQueries,
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

  // 기본 폴더의 이름·순서는 정적 상수이므로 서버에서 오는 건 카운트뿐이다.
  it("systemFolders 를 countKey 별 링크 수로 변환한다", () => {
    expect(toArchiveFolderData(response).systemFolderCounts).toEqual({
      all: 10,
      uncategorized: 2,
      favorite: 0,
      recentlyDeleted: 1,
    });
  });

  it("사용자 폴더의 hex color 를 tone 으로 변환하고 기본색은 gray 로 폴백한다", () => {
    expect(toArchiveFolderData(response).myFolders).toEqual([
      { id: "3", name: "디자인", count: 5, tone: "blue" },
      { id: "7", name: "기타", count: 0, tone: "gray" },
    ]);
  });
});

describe("folderListResponseSchema", () => {
  const validResponse = {
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
    ],
  };

  it("정상 응답을 통과시킨다", () => {
    expect(folderListResponseSchema.safeParse(validResponse).success).toBe(
      true,
    );
  });

  it("폴더가 없는 응답을 통과시킨다", () => {
    expect(
      folderListResponseSchema.safeParse({ ...validResponse, folders: [] })
        .success,
    ).toBe(true);
  });

  // 서버가 필드를 추가해도 캐시에 그대로 남겨야 응답을 통째로 다시 받지 않고 쓸 수 있다.
  it("계약에 없는 키를 버리지 않고 통과시킨다", () => {
    const parsed = folderListResponseSchema.parse({
      ...validResponse,
      folders: [{ ...validResponse.folders[0], emoji: "🗂️" }],
    });

    expect(parsed.folders[0]).toHaveProperty("emoji", "🗂️");
  });

  it("systemFolders 키가 빠지면 거부한다", () => {
    const { favorite: _omitted, ...partial } = validResponse.systemFolders;
    expect(
      folderListResponseSchema.safeParse({
        ...validResponse,
        systemFolders: partial,
      }).success,
    ).toBe(false);
  });

  it("필드 타입이 계약과 다르면 거부한다", () => {
    expect(
      folderListResponseSchema.safeParse({
        ...validResponse,
        folders: [{ ...validResponse.folders[0], linkCount: "5" }],
      }).success,
    ).toBe(false);
  });
});

describe("folderQueries.list", () => {
  // select 신원이 렌더마다 바뀌면 react-query 가 매번 재계산한다.
  it("select 는 호출마다 같은 참조를 유지한다", () => {
    expect(folderQueries.list().select).toBe(folderQueries.list().select);
  });

  it("select 가 응답을 보관함 UI 모델로 변환한다", () => {
    expect(folderQueries.list().select).toBe(toArchiveFolderData);
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

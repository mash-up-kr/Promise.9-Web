jest.mock("@shared/api", () => ({ apiClient: { get: jest.fn() } }));

import { apiClient } from "@shared/api";

import {
  recommendationQueries,
  recommendationResponseSchema,
} from "./recommendation.queries";

const validItem = {
  key: "tag:exercise",
  type: "tag",
  label: "운동",
  linkCount: 5,
  lastViewedAt: null,
};
const validResponse = { items: [validItem] };

describe("recommendationResponseSchema", () => {
  it("정상 응답을 통과시킨다", () => {
    expect(recommendationResponseSchema.safeParse(validResponse).success).toBe(
      true,
    );
  });

  // 후보(활성 링크 3개 이상인 폴더·태그)가 2개 이하면 서버가 data 를 null 로 준다.
  it("null 응답을 통과시킨다", () => {
    expect(recommendationResponseSchema.safeParse(null).success).toBe(true);
  });

  it("폴더 항목(folderId·color 포함)을 통과시킨다", () => {
    const withFolder = {
      items: [
        {
          key: "folder:3",
          type: "folder",
          label: "디자인",
          linkCount: 12,
          lastViewedAt: "2026-08-08T00:00:00.000Z",
          folderId: 3,
          color: "#61a8ef",
        },
      ],
    };
    expect(recommendationResponseSchema.safeParse(withFolder).success).toBe(
      true,
    );
  });

  it("필드 타입이 계약과 다르면 거부한다", () => {
    expect(
      recommendationResponseSchema.safeParse({
        items: [{ ...validItem, linkCount: "5" }],
      }).success,
    ).toBe(false);
  });

  it("필수 필드가 빠지면 거부한다", () => {
    const { label: _omitted, ...withoutLabel } = validItem;
    expect(
      recommendationResponseSchema.safeParse({ items: [withoutLabel] }).success,
    ).toBe(false);
  });
});

describe("recommendationQueries.list", () => {
  const mockGet = apiClient.get as jest.Mock;
  const signal = new AbortController().signal;
  const run = (options: ReturnType<typeof recommendationQueries.list>) =>
    (options.queryFn as (ctx: { signal: AbortSignal }) => Promise<unknown>)({
      signal,
    });

  beforeEach(() => {
    mockGet.mockReset();
  });

  it("GET /recommendations 를 limit 과 함께 부르고 검증된 응답을 돌려준다", async () => {
    mockGet.mockResolvedValue({
      data: { success: true, data: validResponse },
    });
    const result = await run(recommendationQueries.list({ limit: 12 }));

    expect(mockGet).toHaveBeenCalledWith("/recommendations", {
      params: { limit: 12 },
      signal,
    });
    expect(result).toEqual(validResponse);
  });

  it("서버가 null 을 주면 그대로 null 을 돌려준다", async () => {
    mockGet.mockResolvedValue({ data: { success: true, data: null } });
    const result = await run(recommendationQueries.list());

    expect(result).toBeNull();
  });

  it("계약에 어긋난 응답이면 던진다", async () => {
    mockGet.mockResolvedValue({
      data: { success: true, data: { items: [{ label: "운동" }] } },
    });
    await expect(run(recommendationQueries.list())).rejects.toThrow();
  });
});

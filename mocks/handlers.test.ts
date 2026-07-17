import type { AxiosInstance } from "axios";
import MockAdapter from "axios-mock-adapter";

// client.ts 는 로드 시 EXPO_PUBLIC_API_BASE_URL 없으면 throw → env 세팅 후 새로 require.
const ORIGINAL_ENV = process.env;

let apiClient: AxiosInstance;
let store: typeof import("./store");

beforeEach(() => {
  jest.resetModules();
  process.env = {
    ...ORIGINAL_ENV,
    EXPO_PUBLIC_API_BASE_URL: "https://api.test/api/v1",
  };
  apiClient = (require("@shared/api") as typeof import("@shared/api"))
    .apiClient;
  const { registerHandlers } =
    require("./handlers") as typeof import("./handlers");
  store = require("./store") as typeof import("./store");
  store.resetStore();
  registerHandlers(new MockAdapter(apiClient));
});

afterEach(() => {
  process.env = ORIGINAL_ENV;
  jest.resetModules();
});

describe("handlers — baseURL 하위에서 매칭", () => {
  test("GET /links → envelope + items", async () => {
    const { data } = await apiClient.get("/links");
    expect(data.success).toBe(true);
    expect(data.data.items.length).toBeGreaterThan(0);
  });

  test("GET /folders → folders + counts", async () => {
    const { data } = await apiClient.get("/folders");
    expect(data.data.folders).toHaveLength(3);
    expect(data.data.counts.all).toBeGreaterThan(0);
  });
});

describe("handlers — 상태형 흐름", () => {
  test("POST /links → GET /links 에 등장", async () => {
    const before = (await apiClient.get("/links")).data.data.items.length;
    const { data: created } = await apiClient.post("/links", {
      url: "https://example.com/handler-ut",
      folderId: null,
      memo: null,
      remindType: null,
    });
    const after = (await apiClient.get("/links")).data.data.items;
    expect(after.length).toBe(before + 1);
    expect(after.map((l: { linkId: number }) => l.linkId)).toContain(
      created.data.linkId,
    );
  });

  test("PATCH /links/:id 즐겨찾기 → favorite 필터에 반영", async () => {
    const target = (
      await apiClient.get("/links", { params: { favorite: false } })
    ).data.data.items[0];
    await apiClient.patch(`/links/${target.linkId}`, { isFavorite: true });
    const favs = (await apiClient.get("/links", { params: { favorite: true } }))
      .data.data.items;
    expect(favs.map((l: { linkId: number }) => l.linkId)).toContain(
      target.linkId,
    );
  });

  test("DELETE /links/:id → 목록에서 빠지고 상세는 404", async () => {
    const target = (await apiClient.get("/links")).data.data.items[0];
    await apiClient.delete(`/links/${target.linkId}`);
    const items = (await apiClient.get("/links")).data.data.items;
    expect(items.map((l: { linkId: number }) => l.linkId)).not.toContain(
      target.linkId,
    );
    await expect(apiClient.get(`/links/${target.linkId}`)).rejects.toThrow();
  });

  test("GET /links/:id → 상세 envelope", async () => {
    const target = (await apiClient.get("/links")).data.data.items[0];
    const { data } = await apiClient.get(`/links/${target.linkId}`);
    expect(data.data.linkId).toBe(target.linkId);
    expect(data.data).toHaveProperty("relatedLinks");
  });

  test("GET /folders/:id/links → 폴더 소속 링크", async () => {
    const folder = (await apiClient.get("/folders")).data.data.folders[0];
    const { data } = await apiClient.get(`/folders/${folder.folderId}/links`);
    expect(data.data.items.length).toBe(folder.linkCount);
  });
});

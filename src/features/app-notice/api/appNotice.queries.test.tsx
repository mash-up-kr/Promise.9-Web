import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";

import { APP_RELEASE_MANIFEST_URL } from "../appNotice.constants";
import { appNoticeQueries } from "./appNotice.queries";

const RELEASE = {
  ios: { latestVersion: "1.3.0", minSupportedVersion: "1.1.0" },
  android: { latestVersion: "1.3.0", minSupportedVersion: "1.1.0" },
};

function createWrapper() {
  // gcTime 기본값(5분) 타이머가 남으면 jest worker 가 바로 종료되지 않아 0 으로 둔다(link.mutations.test 선례).
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

function mockFetchResponse(response: Partial<Response>) {
  const fetchMock = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    ...response,
  });
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

function renderRelease() {
  return renderHook(() => useQuery(appNoticeQueries.release()), {
    wrapper: createWrapper(),
  });
}

test("기준 파일을 읽어 검증된 값을 돌려준다", async () => {
  mockFetchResponse({ json: async () => RELEASE });

  const { result } = await renderRelease();

  await waitFor(() => expect(result.current.data).toEqual(RELEASE));
});

test("엣지 캐시된 옛 기준을 받지 않도록 캐시를 우회해 요청한다", async () => {
  const fetchMock = mockFetchResponse({ json: async () => RELEASE });

  const { result } = await renderRelease();
  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  const [url, init] = fetchMock.mock.calls[0];
  expect(url).toContain(APP_RELEASE_MANIFEST_URL);
  expect(init).toMatchObject({ cache: "no-store" });
});

test("파일이 없으면 에러 — 호출부가 안내를 건너뛴다", async () => {
  mockFetchResponse({ ok: false, status: 404, json: async () => ({}) });

  const { result } = await renderRelease();

  await waitFor(() => expect(result.current.isError).toBe(true));
});

test("기준 파일 모양이 깨져 있으면 에러", async () => {
  mockFetchResponse({ json: async () => ({ ios: RELEASE.ios }) });

  const { result } = await renderRelease();

  await waitFor(() => expect(result.current.isError).toBe(true));
});

import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";
import axios from "axios";
import type { ReactNode } from "react";

import { APP_RELEASE_MANIFEST_URL } from "../appNotice.constants";
import { appNoticeQueries } from "./appNotice.queries";

const RELEASE = {
  ios: { latestVersion: "1.3.0", minSupportedVersion: "1.1.0" },
  android: { latestVersion: "1.3.0", minSupportedVersion: "1.1.0" },
};

function createWrapper() {
  // gcTime 기본값(5분) 타이머가 남으면 jest worker 가 바로 종료되지 않아 0 으로 둔다(link.mutations.test 선례).
  // 쿼리 자체 retry 가 래퍼 기본값을 덮으므로 재시도 대기만 0 으로 줄인다.
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, retryDelay: 0, gcTime: 0 } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

function mockManifest(data: unknown) {
  return jest.spyOn(axios, "get").mockResolvedValue({ data });
}

function renderRelease() {
  return renderHook(() => useQuery(appNoticeQueries.release()), {
    wrapper: createWrapper(),
  });
}

afterEach(() => {
  jest.restoreAllMocks();
});

test("기준 파일을 읽어 검증된 값을 돌려준다", async () => {
  mockManifest(RELEASE);

  const { result } = await renderRelease();

  await waitFor(() => expect(result.current.data).toEqual(RELEASE));
});

test("응답이 없으면 기다리지 않고 포기한다 — 안내 판단이 영영 미뤄지지 않게", async () => {
  const get = mockManifest(RELEASE);

  const { result } = await renderRelease();
  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  expect(get).toHaveBeenCalledWith(
    APP_RELEASE_MANIFEST_URL,
    expect.objectContaining({ timeout: expect.any(Number) }),
  );
});

// 실행 직후 순단 한 번으로 차단 안내가 그 프로세스 내내 사라지면 안 된다 — 몇 번은 다시 묻고,
// 한 번 읽은 뒤에는 다시 묻지 않는다(포커스 복귀마다 권유 모달이 끼어들지 않게).
test("실패하면 몇 번 재시도하고, 성공한 뒤에는 다시 묻지 않는다", () => {
  const options = appNoticeQueries.release();

  expect(options).toMatchObject({
    retry: 2,
    staleTime: Number.POSITIVE_INFINITY,
  });
  expect(options).not.toHaveProperty("refetchOnWindowFocus");
  expect(options).not.toHaveProperty("refetchOnReconnect");
});

test("파일이 없으면 에러 — 호출부가 안내를 건너뛴다", async () => {
  jest
    .spyOn(axios, "get")
    .mockRejectedValue(new Error("Request failed with status code 404"));

  const { result } = await renderRelease();

  await waitFor(() => expect(result.current.isError).toBe(true));
});

test("기준 파일 모양이 깨져 있으면 에러", async () => {
  mockManifest({ ios: RELEASE.ios });

  const { result } = await renderRelease();

  await waitFor(() => expect(result.current.isError).toBe(true));
});

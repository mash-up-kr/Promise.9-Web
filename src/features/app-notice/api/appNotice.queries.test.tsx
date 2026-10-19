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
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
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

// 실패한 조회가 포커스 복귀·재연결마다 되살아나면 쓰는 중에 모달이 끼어든다 — 실행당 한 번만 묻는다.
test("실패해도 재시도·포커스 복귀·재연결로 다시 묻지 않는다", () => {
  expect(appNoticeQueries.release()).toMatchObject({
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
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

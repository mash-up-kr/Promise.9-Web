jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// 설치 버전을 고정한다 — app.json 의 version 을 올릴 때마다 이 테스트가 깨지지 않게.
jest.mock("@/constants/app.constants", () => ({ APP_VERSION: "1.2.0" }));

import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import axios from "axios";
import type { ReactNode } from "react";

import { APP_NOTICE_STORAGE_KEYS } from "../appNotice.constants";
import { useUpdateGate } from "./useUpdateGate";

interface Manifest {
  ios: { latestVersion: string; minSupportedVersion: string };
  android: { latestVersion: string; minSupportedVersion: string };
}

function mockManifest(manifest: Manifest | null) {
  const get = jest.spyOn(axios, "get");
  if (manifest === null) {
    get.mockRejectedValue(new Error("Request failed with status code 404"));
  } else {
    get.mockResolvedValue({ data: manifest });
  }
}

// 테스트는 jest-expo 기본 플랫폼(iOS)에서 돈다 — android 기준은 일부러 다르게 둬 섞이지 않는지 본다.
function manifest(ios: Manifest["ios"]): Manifest {
  return {
    ios,
    android: { latestVersion: "9.9.9", minSupportedVersion: "9.9.9" },
  };
}

function renderGate() {
  // 쿼리 자체 retry 가 래퍼 기본값을 덮으므로 재시도 대기만 0 으로 줄인다.
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, retryDelay: 0, gcTime: 0 } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return renderHook(() => useUpdateGate(), { wrapper });
}

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

test("필수 버전보다 낮으면 force", async () => {
  mockManifest(
    manifest({ latestVersion: "1.4.0", minSupportedVersion: "1.3.0" }),
  );

  const { result } = await renderGate();

  await waitFor(() => expect(result.current.kind).toBe("force"));
  expect(result.current.latestVersion).toBe("1.4.0");
});

test("필수는 넘겼고 최신이 아니면 recommend", async () => {
  mockManifest(
    manifest({ latestVersion: "1.3.0", minSupportedVersion: "1.0.0" }),
  );

  const { result } = await renderGate();

  await waitFor(() => expect(result.current.kind).toBe("recommend"));
});

test("최신이면 아무 안내도 하지 않는다 — 다른 플랫폼 기준에 끌려가지 않는다", async () => {
  mockManifest(
    manifest({ latestVersion: "1.2.0", minSupportedVersion: "1.0.0" }),
  );

  const { result } = await renderGate();

  await waitFor(() => expect(result.current.isReady).toBe(true));
  expect(result.current.kind).toBe("none");
});

test("이미 '나중에' 로 건너뛴 버전이면 다시 띄우지 않는다", async () => {
  await AsyncStorage.setItem(
    APP_NOTICE_STORAGE_KEYS.snoozedUpdateVersion,
    "1.3.0",
  );
  mockManifest(
    manifest({ latestVersion: "1.3.0", minSupportedVersion: "1.0.0" }),
  );

  const { result } = await renderGate();

  await waitFor(() => expect(result.current.isReady).toBe(true));
  expect(result.current.kind).toBe("none");
});

test("dismiss 하면 안내가 닫히고 그 버전이 기록된다", async () => {
  mockManifest(
    manifest({ latestVersion: "1.3.0", minSupportedVersion: "1.0.0" }),
  );

  const { result } = await renderGate();
  await waitFor(() => expect(result.current.kind).toBe("recommend"));

  await act(async () => {
    result.current.dismiss();
  });

  expect(result.current.kind).toBe("none");
  await waitFor(async () =>
    expect(
      await AsyncStorage.getItem(APP_NOTICE_STORAGE_KEYS.snoozedUpdateVersion),
    ).toBe("1.3.0"),
  );
});

test("필수 안내는 dismiss 로 닫히지 않는다", async () => {
  mockManifest(
    manifest({ latestVersion: "1.4.0", minSupportedVersion: "1.3.0" }),
  );

  const { result } = await renderGate();
  await waitFor(() => expect(result.current.kind).toBe("force"));

  await act(async () => {
    result.current.dismiss();
  });

  expect(result.current.kind).toBe("force");
});

test("기준 파일을 읽지 못하면 아무 안내도 하지 않는다", async () => {
  mockManifest(null);

  const { result } = await renderGate();

  await waitFor(() => expect(result.current.isReady).toBe(true));
  expect(result.current.kind).toBe("none");
});

import { createAnalytics } from "@shared/analytics/analytics.runtime";
import { bindAnalyticsIdentity } from "@shared/analytics/identity/identity";
import { afterEach, expect, test, vi } from "vitest";
import { initializeExtensionAnalytics } from "./initialize";

vi.mock("@shared/analytics/analytics.runtime", () => ({
  createAnalytics: vi.fn(),
}));
vi.mock("@shared/analytics/identity/identity", () => ({
  bindAnalyticsIdentity: vi.fn(),
}));
vi.mock("./lifecycle", () => ({
  subscribeBrowserActive: vi.fn(),
}));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetAllMocks();
  vi.restoreAllMocks();
});
test("기본 비활성 상태에서는 AWS·저장소를 초기화하지 않는다", async () => {
  vi.stubEnv("VITE_ANALYTICS_ENABLED", "false");
  expect(await initializeExtensionAnalytics()).toBeNull();
  expect(createAnalytics).not.toHaveBeenCalled();
});
test("설정이 빠지면 확장 UI를 막지 않고 수집만 비활성화한다", async () => {
  vi.stubEnv("VITE_ANALYTICS_ENABLED", "true");
  vi.stubEnv("VITE_ANALYTICS_STREAM_NAME", "");
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  expect(await initializeExtensionAnalytics()).toBeNull();
  expect(createAnalytics).not.toHaveBeenCalled();
  warn.mockRestore();
});

test("저장소 준비 전에도 런타임과 진입 이벤트를 제공하고 준비 후 계정을 연결한다", async () => {
  vi.stubEnv("VITE_ANALYTICS_ENABLED", "true");
  vi.stubEnv("VITE_ANALYTICS_REGION", "region");
  vi.stubEnv("VITE_ANALYTICS_IDENTITY_POOL_ID", "pool");
  vi.stubEnv("VITE_ANALYTICS_STREAM_NAME", "stream");
  let finishRestore = () => {};
  const ready = new Promise<void>((resolve) => {
    finishRestore = resolve;
  });
  const runtime = {
    client: { trackEvent: vi.fn(), setActive: vi.fn() },
    ready,
  } as unknown as ReturnType<typeof createAnalytics>;
  vi.mocked(createAnalytics).mockReturnValue(runtime);
  expect(initializeExtensionAnalytics()).toBe(runtime);
  expect(runtime.client.trackEvent).toHaveBeenCalledExactlyOnceWith({
    event_name: "in",
  });
  expect(runtime.client.setActive).toHaveBeenCalledWith(
    document.visibilityState === "visible",
  );
  expect(bindAnalyticsIdentity).not.toHaveBeenCalled();
  finishRestore();
  await ready;
  expect(bindAnalyticsIdentity).toHaveBeenCalledWith(
    runtime,
    expect.any(Object),
  );
});

test("비동기 초기화 오류는 서비스로 전파하지 않는다", async () => {
  vi.stubEnv("VITE_ANALYTICS_ENABLED", "true");
  vi.stubEnv("VITE_ANALYTICS_REGION", "region");
  vi.stubEnv("VITE_ANALYTICS_IDENTITY_POOL_ID", "pool");
  vi.stubEnv("VITE_ANALYTICS_STREAM_NAME", "stream");
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  const runtime = {
    client: { trackEvent: vi.fn(), setActive: vi.fn() },
    ready: Promise.reject(new Error("randomUUID unavailable")),
  } as unknown as ReturnType<typeof createAnalytics>;
  vi.mocked(createAnalytics).mockReturnValue(runtime);
  expect(initializeExtensionAnalytics()).toBe(runtime);
  await expect(runtime.ready).rejects.toThrow("randomUUID unavailable");
  expect(warn).toHaveBeenCalledWith("[analytics] startup_failed");
  expect(bindAnalyticsIdentity).not.toHaveBeenCalled();
});

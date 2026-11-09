import { createAnalytics } from "@shared/analytics/analytics.runtime";
import { act, cleanup, render } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, expect, test, vi } from "vitest";
import {
  AnalyticsScreen,
  ExtensionAnalyticsProvider,
} from "./AnalyticsContext";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

test("화면 이동과 루트 해제를 구분하고 StrictMode에서도 방문을 중복 기록하지 않는다", async () => {
  vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
  let id = 0;
  const runtime = createAnalytics({
    source: "extension",
    environment: "development",
    aws: { region: "region", identityPoolId: "pool", streamName: "stream" },
    storage: { get: async () => null, set: async () => {} },
    newId: () => `id-${++id}`,
    send: async () => {},
  });
  await runtime.ready;
  const trackEvent = vi.spyOn(runtime.client, "trackEvent");
  const panel = (name: string) => (
    <StrictMode>
      <ExtensionAnalyticsProvider value={runtime}>
        <AnalyticsScreen name={name}>
          <div>{name}</div>
        </AnalyticsScreen>
      </ExtensionAnalyticsProvider>
    </StrictMode>
  );
  const view = render(panel("login"));
  try {
    view.rerender(panel("save"));
    await act(async () => view.unmount());
    expect(trackEvent.mock.calls.map(([event]) => event.event_name)).toEqual([
      "page_view",
      "page_view",
    ]);
    expect(trackEvent.mock.calls.map(([event]) => event.custom_data)).toEqual([
      {
        screen_name: "login",
        path: "/login",
        screen_view_id: expect.any(String),
        duration_ms: expect.any(Number),
      },
      {
        screen_name: "save",
        path: "/save",
        screen_view_id: expect.any(String),
        duration_ms: expect.any(Number),
      },
    ]);
  } finally {
    view.unmount();
    runtime.client.dispose();
  }
});

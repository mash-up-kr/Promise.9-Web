import { captureUtm } from "./utm";

test("UTM 없는 직접 방문은 새 접점을 만들지 않는다", () => {
  expect(captureUtm({}, "touch", "2026-10-14T00:00:00.000Z")).toBeNull();
});
test("UTM 다섯 필드만 읽고 공백과 비어 있는 값을 정리한다", () => {
  expect(
    captureUtm(
      { utm_source: " social ", utm_campaign: "  ", token: "secret" },
      "touch",
      "2026-10-14T00:00:00.000Z",
    ),
  ).toEqual({
    touch_id: "touch",
    captured_at: "2026-10-14T00:00:00.000Z",
    utm_source: "social",
    utm_medium: null,
    utm_campaign: null,
    utm_content: null,
    utm_term: null,
  });
});

import { resolveInitialMetrics } from "./share.safeArea";

const window = { width: 402, height: 874 };

test("네이티브 초기 메트릭이 있으면 그대로 쓴다", () => {
  const native = {
    frame: { x: 0, y: 0, width: 402, height: 874 },
    insets: { top: 59, left: 0, right: 0, bottom: 34 },
  };
  expect(resolveInitialMetrics(native, window)).toBe(native);
});

test("초기 메트릭이 없으면 창 크기와 인셋 0 으로 먼저 그린다", () => {
  expect(resolveInitialMetrics(null, window)).toEqual({
    frame: { x: 0, y: 0, width: 402, height: 874 },
    insets: { top: 0, left: 0, right: 0, bottom: 0 },
  });
});

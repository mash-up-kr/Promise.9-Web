jest.mock("expo", () => ({
  requireNativeModule: jest.fn(() => {
    throw new Error("Cannot find native module 'ShareHost'");
  }),
}));

test("네이티브 모듈이 없어도 import 만으로는 앱이 죽지 않고, 호출 시점에만 실패한다", () => {
  let host: typeof import("./shareHost.android") | undefined;
  expect(() => {
    jest.isolateModules(() => {
      host = require("./shareHost.android");
    });
  }).not.toThrow();

  expect(() => host?.close()).toThrow("Cannot find native module");
});

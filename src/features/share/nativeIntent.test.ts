jest.mock("expo-share-intent", () => ({
  getShareExtensionKey: jest.fn(() => "ShareKey"),
}));

import { getShareExtensionKey } from "expo-share-intent";

import { redirectSystemPath } from "@/app/+native-intent";

test("공유 익스텐션 딥링크는 홈으로 보낸다", () => {
  expect(
    redirectSystemPath({
      path: "promise9web://dataUrl=ShareKey",
      initial: false,
    }),
  ).toBe("/");
});

test("일반 딥링크 경로는 그대로 통과시킨다", () => {
  expect(redirectSystemPath({ path: "/link/3", initial: false })).toBe(
    "/link/3",
  );
});

test("판정 중 예외가 나면 홈으로 폴백한다", () => {
  (getShareExtensionKey as jest.Mock).mockImplementationOnce(() => {
    throw new Error("native unavailable");
  });
  expect(
    redirectSystemPath({ path: "promise9web://dataUrl=x", initial: true }),
  ).toBe("/");
});

import { appReleaseSchema } from "./appNotice.contracts";

const VALID = {
  ios: { latestVersion: "1.3.0", minSupportedVersion: "1.1.0" },
  android: { latestVersion: "1.3.0", minSupportedVersion: "1.1.0" },
};

test("플랫폼별 최신·필수 버전을 읽는다", () => {
  expect(appReleaseSchema.parse(VALID)).toEqual(VALID);
});

test("플랫폼이 빠졌거나 버전이 문자열이 아니면 거부한다", () => {
  expect(() => appReleaseSchema.parse({ ios: VALID.ios })).toThrow();
  expect(() =>
    appReleaseSchema.parse({
      ...VALID,
      android: { latestVersion: 130, minSupportedVersion: "1.1.0" },
    }),
  ).toThrow();
});

test("빈 버전 문자열은 거부한다 — 배포 실수로 기준이 비는 것을 여기서 잡는다", () => {
  expect(() =>
    appReleaseSchema.parse({
      ...VALID,
      ios: { latestVersion: "", minSupportedVersion: "1.1.0" },
    }),
  ).toThrow();
});

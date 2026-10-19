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

test("후기 요청 설정(review)을 읽는다", () => {
  const review = { enabled: true, minSaveCount: 5, cooldownDays: 90 };

  expect(appReleaseSchema.parse({ ...VALID, review })).toEqual({
    ...VALID,
    review,
  });
});

test("review 는 일부 필드만 둘 수 있다 — 끄기만 할 때", () => {
  expect(
    appReleaseSchema.parse({ ...VALID, review: { enabled: false } }).review,
  ).toEqual({ enabled: false });
});

// 후기 설정 오타 때문에 업데이트 안내까지 사라지면 안 되고, 끄려던 스위치가 열려서도 안 된다 —
// 블록이 깨지면 후기 요청만 멈춘다.
test("review 블록이 깨져 있으면 후기 요청을 끄고 업데이트 기준은 그대로 읽힌다", () => {
  const parsed = appReleaseSchema.parse({
    ...VALID,
    review: { enabled: false, minSaveCount: "5" },
  });

  expect(parsed.ios).toEqual(VALID.ios);
  expect(parsed.review).toEqual({ enabled: false });
});

test("review 블록이 없으면 undefined — 앱 기본값으로 동작한다", () => {
  expect(appReleaseSchema.parse(VALID).review).toBeUndefined();
});

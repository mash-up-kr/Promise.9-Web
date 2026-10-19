import appConfig from "../../../app.json";
import manifest from "../../../public/app-release.json";
import { appReleaseSchema } from "./appNotice.contracts";
import { compareVersions } from "./version.utils";

// 배포에 실려 나가는 기준 파일이다 — 모양이 깨지거나 앞뒤가 맞지 않으면 앱이 잘못 안내한다.
test("기준 파일은 계약을 지킨다", () => {
  expect(() => appReleaseSchema.parse(manifest)).not.toThrow();
});

// review 블록은 깨져도 parse 가 throw 하지 않으므로(끄기로 떨어진다) 값이 그대로 읽히는지 따로 본다.
test("review 블록이 그대로 읽힌다 — 오타면 여기서 잡는다", () => {
  expect(appReleaseSchema.parse(manifest).review).toEqual(manifest.review);
});

test("필수 버전이 최신 버전보다 높지 않다", () => {
  for (const platform of ["ios", "android"] as const) {
    const { latestVersion, minSupportedVersion } = manifest[platform];
    expect(
      compareVersions(minSupportedVersion, latestVersion),
    ).toBeLessThanOrEqual(0);
  }
});

test("최신 버전은 app.json 버전을 넘지 않는다 — 아직 만들지 않은 버전으로 업데이트를 유도하면 안 된다", () => {
  for (const platform of ["ios", "android"] as const) {
    expect(
      compareVersions(manifest[platform].latestVersion, appConfig.expo.version),
    ).toBeLessThanOrEqual(0);
  }
});

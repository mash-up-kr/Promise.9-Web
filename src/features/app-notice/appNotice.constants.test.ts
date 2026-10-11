const PRODUCTION_URL = "https://link-ding-dong.com/app-release.json";

const ORIGINAL_OVERRIDE = process.env.EXPO_PUBLIC_APP_RELEASE_URL;

// 주소는 모듈 로드 시점에 한 번 정해진다 — 환경변수를 바꾼 뒤 모듈을 다시 불러와 확인한다.
function loadManifestUrl(override?: string, isDev = true): string {
  const originalNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = isDev ? "development" : "production";
  try {
    return readManifestUrl(override);
  } finally {
    process.env.NODE_ENV = originalNodeEnv;
  }
}

function readManifestUrl(override?: string): string {
  if (override === undefined) {
    delete process.env.EXPO_PUBLIC_APP_RELEASE_URL;
  } else {
    process.env.EXPO_PUBLIC_APP_RELEASE_URL = override;
  }
  jest.resetModules();
  return require("./appNotice.constants").APP_RELEASE_MANIFEST_URL;
}

afterEach(() => {
  if (ORIGINAL_OVERRIDE === undefined) {
    delete process.env.EXPO_PUBLIC_APP_RELEASE_URL;
  } else {
    process.env.EXPO_PUBLIC_APP_RELEASE_URL = ORIGINAL_OVERRIDE;
  }
  jest.resetModules();
});

test("기본은 운영 주소를 읽는다", () => {
  expect(loadManifestUrl()).toBe(PRODUCTION_URL);
});

test("개발 빌드에서는 EXPO_PUBLIC_APP_RELEASE_URL 로 기준 파일을 바꿔 검증할 수 있다", () => {
  expect(loadManifestUrl("http://localhost:8788/app-release.json")).toBe(
    "http://localhost:8788/app-release.json",
  );
});

test("빈 값·공백만 있으면 운영 주소로 떨어진다 — 빈 URL 로 조회하지 않는다", () => {
  expect(loadManifestUrl("   ")).toBe(PRODUCTION_URL);
});

test("출시 빌드에서는 대체 주소를 무시한다 — 환경변수가 섞여 들어가도 운영 기준만 읽는다", () => {
  expect(loadManifestUrl("http://localhost:8788/app-release.json", false)).toBe(
    PRODUCTION_URL,
  );
});

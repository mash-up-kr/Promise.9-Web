/**
 * @jest-environment node
 */
const appConfig = require("./app.json");
const easConfig = require("./eas.json");

function shareExtensionOptions() {
  const entry = appConfig.expo.plugins.find(
    (plugin) => Array.isArray(plugin) && plugin[0] === "expo-share-extension",
  );
  return entry[1];
}

// 지도·SNS 앱은 링크를 URL 이 아닌 텍스트로 공유한다 — 텍스트도 받아야 공유시트에 링띵동이 뜬다.
test("iOS 공유 익스텐션은 URL 과 텍스트 공유를 모두 받는다", () => {
  const types = shareExtensionOptions().activationRules.map(
    (rule) => rule.type,
  );
  expect(types).toEqual(expect.arrayContaining(["url", "text"]));
});

// 업데이트 안내 버튼과 expo-store-review 가 함께 읽는 스토어 주소 — 빠지면 둘 다 조용히 아무것도 못 한다.
test("스토어 주소가 app.json 에 들어 있다", () => {
  expect(appConfig.expo.ios.appStoreUrl).toMatch(
    /^https:\/\/apps\.apple\.com\//,
  );
  expect(appConfig.expo.android.playStoreUrl).toContain(
    appConfig.expo.android.package,
  );
});

// 최상위 키는 Android strings.xml 에도 들어가 release lint(ExtraTranslation)가 빌드를 막는다 — iOS 키는 ios 블록에.
test("iOS 전용 지역화 키는 ios 블록에만 둔다", () => {
  for (const { ios, android, ...shared } of Object.values(
    appConfig.expo.locales,
  )) {
    expect(Object.keys(shared)).toEqual([]);
  }
  expect(appConfig.expo.locales.ko.ios.CFBundleDisplayName).toBe("링띵동");
});

// OTA 호환 기준은 앱 버전 — 같은 버전 설치본에만 JS 업데이트가 간다. 네이티브를 바꾼 빌드는 반드시 버전을 올린다는
// release.md 규칙이 지켜질 때만 안전하다(정책을 바꾸면 기존 설치본이 받을 수 있는 업데이트가 달라진다).
test("OTA 업데이트는 같은 앱 버전 설치본에만 내려간다", () => {
  expect(appConfig.expo.runtimeVersion).toEqual({ policy: "appVersion" });
  expect(appConfig.expo.updates.url).toBe(
    `https://u.expo.dev/${appConfig.expo.extra.eas.projectId}`,
  );
});

// 채널은 빌드에 박힌다 — 빠지면 그 빌드는 OTA 를 영영 못 받는다.
test("스토어·내부 배포 빌드는 같은 이름의 OTA 채널을 갖는다", () => {
  expect(easConfig.build.production.channel).toBe("production");
  expect(easConfig.build.preview.channel).toBe("preview");
});

// iOS 공유 익스텐션은 메모리 한도가 빡빡하다 — expo-updates 와 그 의존 모듈은 익스텐션에 싣지 않는다.
test("iOS 공유 익스텐션에서 expo-updates 의존 모듈을 뺀다", () => {
  expect(shareExtensionOptions().excludedPackages).toEqual(
    expect.arrayContaining([
      "expo-eas-client",
      "expo-manifests",
      "expo-json-utils",
      "expo-structured-headers",
      "expo-updates-interface",
    ]),
  );
});

// 로컬 Android Release 빌드가 expo-updates KSP 단계에서 Metaspace 부족으로 죽지 않게 한다.
test("Gradle Metaspace 플러그인이 등록돼 있다", () => {
  expect(appConfig.expo.plugins).toContain(
    "./plugins/withAndroidGradleJvmArgs",
  );
});

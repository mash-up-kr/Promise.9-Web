/**
 * @jest-environment node
 */
const appConfig = require("./app.json");

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

// OTA 호환 기준은 앱 버전 — 네이티브가 바뀌는 릴리즈는 늘 버전을 올리므로, 같은 버전 설치본에만 JS 업데이트가 간다.
test("OTA 업데이트는 같은 앱 버전 설치본에만 내려간다", () => {
  expect(appConfig.expo.runtimeVersion).toEqual({ policy: "appVersion" });
  expect(appConfig.expo.updates.url).toBe(
    `https://u.expo.dev/${appConfig.expo.extra.eas.projectId}`,
  );
});

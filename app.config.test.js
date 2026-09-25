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

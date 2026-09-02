const { AndroidConfig, withStringsXml } = require("expo/config-plugins");

/**
 * 홈 화면에 노출되는 Android 앱 라벨을 서비스명으로 바꾼다.
 * expo.name 은 iOS Xcode 타깃명의 뿌리라 한글로 바꿀 수 없어(sanitize 시 "app"),
 * prebuild 가 생성하는 strings.xml 의 app_name 만 뒤에서 덮어쓴다.
 */
module.exports = function withAndroidAppLabel(config, { label }) {
  return withStringsXml(config, (config) => {
    config.modResults = AndroidConfig.Strings.setStringItem(
      [{ $: { name: "app_name" }, _: label }],
      config.modResults,
    );
    return config;
  });
};

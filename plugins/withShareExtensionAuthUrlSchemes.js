const plist = require("@expo/plist").default;
const { IOSConfig, withFinalizedMod } = require("expo/config-plugins");
const fs = require("node:fs");
const path = require("node:path");

const GOOGLE_SIGNIN_PLUGIN = "@react-native-google-signin/google-signin";

function findGoogleIosUrlScheme(config) {
  for (const entry of config.plugins ?? []) {
    if (Array.isArray(entry) && entry[0] === GOOGLE_SIGNIN_PLUGIN) {
      return entry[1]?.iosUrlScheme;
    }
  }
  return undefined;
}

/**
 * 공유 익스텐션 안에서 구글 로그인을 띄우려면 GIDSignIn 이 검사하는 콜백 URL 스킴이
 * 익스텐션 번들의 Info.plist 에도 있어야 한다(메인 앱 plist 는 보지 않는다).
 * 표시명 플러그인과 같은 이유로 finalized 단계에서 파일을 직접 고친다.
 */
module.exports = function withShareExtensionAuthUrlSchemes(config) {
  return withFinalizedMod(config, [
    "ios",
    (config) => {
      const scheme = findGoogleIosUrlScheme(config);
      if (!scheme) {
        throw new Error(
          `[withShareExtensionAuthUrlSchemes] app.json 의 ${GOOGLE_SIGNIN_PLUGIN} iosUrlScheme 이 없습니다.`,
        );
      }
      const targetName = `${IOSConfig.XcodeUtils.sanitizedName(config.name)}ShareExtension`;
      const filePath = path.join(
        config.modRequest.platformProjectRoot,
        targetName,
        "Info.plist",
      );
      if (!fs.existsSync(filePath)) {
        throw new Error(
          `[withShareExtensionAuthUrlSchemes] 익스텐션 Info.plist 가 없습니다: ${filePath}`,
        );
      }
      const parsed = plist.parse(fs.readFileSync(filePath, "utf8"));
      const existingTypes = parsed.CFBundleURLTypes ?? [];
      const hasScheme = existingTypes.some((type) =>
        type.CFBundleURLSchemes?.includes(scheme),
      );
      parsed.CFBundleURLTypes = hasScheme
        ? existingTypes
        : [...existingTypes, { CFBundleURLSchemes: [scheme] }];
      fs.writeFileSync(filePath, plist.build(parsed));
      return config;
    },
  ]);
};

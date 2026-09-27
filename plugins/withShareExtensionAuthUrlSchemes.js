const { withShareExtensionInfoPlist } = require("./shareExtensionInfoPlist");

const PLUGIN_NAME = "withShareExtensionAuthUrlSchemes";
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
 */
module.exports = function withShareExtensionAuthUrlSchemes(config) {
  return withShareExtensionInfoPlist(
    config,
    PLUGIN_NAME,
    (parsed, modConfig) => {
      const scheme = findGoogleIosUrlScheme(modConfig);
      if (!scheme) {
        throw new Error(
          `[${PLUGIN_NAME}] app.json 의 ${GOOGLE_SIGNIN_PLUGIN} iosUrlScheme 이 없습니다.`,
        );
      }
      const existingTypes = parsed.CFBundleURLTypes ?? [];
      const hasScheme = existingTypes.some((type) =>
        type.CFBundleURLSchemes?.includes(scheme),
      );
      parsed.CFBundleURLTypes = hasScheme
        ? existingTypes
        : [...existingTypes, { CFBundleURLSchemes: [scheme] }];
    },
  );
};

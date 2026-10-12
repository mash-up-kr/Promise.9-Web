const { withShareExtensionInfoPlist } = require("./shareExtensionInfoPlist");

/**
 * iOS 공유 시트에 노출되는 익스텐션 표시명을 서비스명으로 바꾼다.
 * expo-share-extension 이 CFBundleDisplayName 을 "$(PRODUCT_NAME) Share Extension" 으로
 * 하드코딩하고 옵션을 주지 않는다.
 */
module.exports = function withShareExtensionDisplayName(
  config,
  { displayName },
) {
  return withShareExtensionInfoPlist(
    config,
    "withShareExtensionDisplayName",
    (parsed) => {
      parsed.CFBundleDisplayName = displayName;
    },
  );
};

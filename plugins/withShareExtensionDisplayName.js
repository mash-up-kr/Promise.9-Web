const plist = require("@expo/plist").default;
const { IOSConfig, withFinalizedMod } = require("expo/config-plugins");
const fs = require("node:fs");
const path = require("node:path");

/**
 * iOS 공유 시트에 노출되는 익스텐션 표시명을 서비스명으로 바꾼다.
 * expo-share-extension 이 CFBundleDisplayName 을 "$(PRODUCT_NAME) Share Extension" 으로
 * 하드코딩하고 옵션을 주지 않아, 모든 mod 가 끝난 finalized 단계에서 재수정한다.
 * (mod 는 나중에 등록될수록 먼저 실행되는 래핑 구조라 같은 withInfoPlist 편승으로는
 * 실행 순서를 보장할 수 없다.)
 */
module.exports = function withShareExtensionDisplayName(
  config,
  { displayName },
) {
  return withFinalizedMod(config, [
    "ios",
    (config) => {
      // expo-share-extension 의 getShareExtensionName 과 같은 규칙으로 타깃 폴더를 찾는다.
      const targetName = `${IOSConfig.XcodeUtils.sanitizedName(config.name)}ShareExtension`;
      const filePath = path.join(
        config.modRequest.platformProjectRoot,
        targetName,
        "Info.plist",
      );
      if (!fs.existsSync(filePath)) {
        throw new Error(
          `[withShareExtensionDisplayName] 익스텐션 Info.plist 가 없습니다: ${filePath}`,
        );
      }
      const parsed = plist.parse(fs.readFileSync(filePath, "utf8"));
      parsed.CFBundleDisplayName = displayName;
      fs.writeFileSync(filePath, plist.build(parsed));
      return config;
    },
  ]);
};

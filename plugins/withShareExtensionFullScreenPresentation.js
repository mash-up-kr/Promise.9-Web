const plist = require("@expo/plist").default;
const { IOSConfig, withFinalizedMod } = require("expo/config-plugins");
const fs = require("node:fs");
const path = require("node:path");

/**
 * 공유 익스텐션을 시스템 시트 대신 전체화면으로 띄우게 한다.
 * iOS 26 은 익스텐션이 요청을 끝내면 호스트가 시스템 배경색(라이트 흰색) 시트를 그려 내리는데,
 * 익스텐션 쪽에서는 그 색도 시트 높이도 바꿀 수 없다. 전체화면이면 시스템 시트 크롬(dim·모서리·
 * 그림자·쓸어 닫기)이 아예 없어 시트·dim·닫기를 전부 우리 시트(ShareSheet)가 그린다.
 * expo-share-extension 은 이 키를 옵션으로 주지 않아 표시명 플러그인과 같이 finalized 단계에서 더한다.
 */
module.exports = function withShareExtensionFullScreenPresentation(config) {
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
          `[withShareExtensionFullScreenPresentation] 익스텐션 Info.plist 가 없습니다: ${filePath}`,
        );
      }
      const parsed = plist.parse(fs.readFileSync(filePath, "utf8"));
      parsed.NSExtension.NSExtensionAttributes.NSExtensionShareWantsFullScreenPresentation = true;
      fs.writeFileSync(filePath, plist.build(parsed));
      return config;
    },
  ]);
};

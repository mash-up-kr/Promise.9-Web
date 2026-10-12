const plist = require("@expo/plist").default;
const { IOSConfig, withFinalizedMod } = require("expo/config-plugins");
const fs = require("node:fs");
const path = require("node:path");

/** Info.plist 를 읽어 mutate 가 고친 대로 다시 쓴다. */
function updateShareExtensionInfoPlist(filePath, pluginName, mutate) {
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `[${pluginName}] 익스텐션 Info.plist 가 없습니다: ${filePath}`,
    );
  }
  const parsed = plist.parse(fs.readFileSync(filePath, "utf8"));
  mutate(parsed);
  fs.writeFileSync(filePath, plist.build(parsed));
}

/**
 * expo-share-extension 이 만든 익스텐션 Info.plist 를 finalized 단계에서 고친다 — 라이브러리가
 * 옵션으로 주지 않는 키를 넣거나 하드코딩한 값을 바꾼다. mod 는 나중에 등록될수록 먼저 실행되는
 * 래핑 구조라 withInfoPlist 편승으로는 라이브러리 뒤에 실행됨을 보장할 수 없다.
 */
function withShareExtensionInfoPlist(config, pluginName, mutate) {
  return withFinalizedMod(config, [
    "ios",
    (modConfig) => {
      // expo-share-extension 의 getShareExtensionName 과 같은 규칙으로 타깃 폴더를 찾는다.
      const targetName = `${IOSConfig.XcodeUtils.sanitizedName(modConfig.name)}ShareExtension`;
      const filePath = path.join(
        modConfig.modRequest.platformProjectRoot,
        targetName,
        "Info.plist",
      );
      updateShareExtensionInfoPlist(filePath, pluginName, (parsed) =>
        mutate(parsed, modConfig),
      );
      return modConfig;
    },
  ]);
}

module.exports = { withShareExtensionInfoPlist, updateShareExtensionInfoPlist };

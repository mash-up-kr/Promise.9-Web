const { withShareExtensionInfoPlist } = require("./shareExtensionInfoPlist");

const PLUGIN_NAME = "withShareExtensionFullScreenPresentation";

function enableFullScreenPresentation(parsed) {
  const attributes = parsed.NSExtension?.NSExtensionAttributes;
  if (!attributes) {
    throw new Error(
      `[${PLUGIN_NAME}] Info.plist 에 NSExtension.NSExtensionAttributes 가 없습니다.`,
    );
  }
  attributes.NSExtensionShareWantsFullScreenPresentation = true;
}

/**
 * 공유 익스텐션을 시스템 시트 대신 전체화면으로 띄우게 한다.
 * iOS 26 은 익스텐션이 요청을 끝내면 호스트가 시스템 배경색(라이트 흰색) 시트를 그려 내리는데,
 * 익스텐션 쪽에서는 그 색도 시트 높이도 바꿀 수 없다. 전체화면이면 시스템 시트 크롬(dim·모서리·
 * 그림자·쓸어 닫기)이 아예 없어 시트·dim·닫기를 전부 우리 시트(ShareSheet)가 그린다.
 * expo-share-extension 은 이 키를 옵션으로 주지 않아 표시명 플러그인과 같이 finalized 단계에서 더한다.
 */
module.exports = function withShareExtensionFullScreenPresentation(config) {
  return withShareExtensionInfoPlist(
    config,
    PLUGIN_NAME,
    enableFullScreenPresentation,
  );
};
module.exports.enableFullScreenPresentation = enableFullScreenPresentation;

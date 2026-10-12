const { withPodfile } = require("expo/config-plugins");

const PLUGIN_NAME = "withIosPodDeploymentTarget";
const POST_INSTALL_ANCHOR = "post_install do |installer|";
// 같은 Podfile 에 두 번 넣지 않기 위한 표식 — prebuild 는 여러 번 돌 수 있다.
const MARKER = `# ${PLUGIN_NAME}`;

// Xcode 26+ 는 IPHONEOS_DEPLOYMENT_TARGET 이 15.0 미만인 타깃을 에러로 거부한다.
// RN 의 보정(ReactNativePodsUtils.updateOSDeploymentTarget)은 pod 의 native_target 만 손봐서
// CocoaPods 가 자동 생성하는 리소스 번들 타깃(*_resources · *_Privacy)이 옛 값으로 남는다.
// 값은 Podfile 의 platform 줄과 같은 출처(ios.deploymentTarget)를 쓰고, 낮은 타깃만 올린다.
const BUMP_SNIPPET = `    ${MARKER}: 리소스 번들 타깃까지 Podfile 의 배포 타깃으로 올린다(Xcode 26+ 는 15.0 미만을 거부).
    pod_deployment_target = podfile_properties['ios.deploymentTarget'] || '16.4'
    installer.pods_project.targets.each do |pod_target|
      pod_target.build_configurations.each do |pod_config|
        current_target = pod_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET']
        if current_target.nil? || current_target.to_f < pod_deployment_target.to_f
          pod_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = pod_deployment_target
        end
      end
    end
`;

/**
 * Podfile 의 `post_install` 안에 배포 타깃 보정을 끼워 넣는다.
 * 앵커를 못 찾으면 던진다 — 템플릿이 바뀐 걸 조용히 넘기면 빌드가 터질 때까지 모른다.
 */
function addPodDeploymentTargetBump(contents) {
  if (contents.includes(MARKER)) {
    return contents;
  }
  if (!contents.includes(POST_INSTALL_ANCHOR)) {
    throw new Error(
      `[${PLUGIN_NAME}] Podfile 에서 "${POST_INSTALL_ANCHOR}" 를 찾지 못했습니다. prebuild 템플릿이 바뀐 것 같습니다.`,
    );
  }

  return contents.replace(
    POST_INSTALL_ANCHOR,
    `${POST_INSTALL_ANCHOR}\n${BUMP_SNIPPET}`,
  );
}

module.exports = function withIosPodDeploymentTarget(config) {
  return withPodfile(config, (podfileConfig) => {
    podfileConfig.modResults.contents = addPodDeploymentTargetBump(
      podfileConfig.modResults.contents,
    );
    return podfileConfig;
  });
};

module.exports.addPodDeploymentTargetBump = addPodDeploymentTargetBump;

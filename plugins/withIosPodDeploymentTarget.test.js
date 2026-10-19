/**
 * @jest-environment node
 */
const { addPodDeploymentTargetBump } = require("./withIosPodDeploymentTarget");

const PODFILE = `platform :ios, podfile_properties['ios.deploymentTarget'] || '16.4'

target 'Promise9Web' do
  post_install do |installer|
    react_native_post_install(
      installer,
      config[:reactNativePath],
      :mac_catalyst_enabled => false,
    )
  end
end
`;

test("post_install 안에 배포 타깃 보정을 넣는다", () => {
  const result = addPodDeploymentTargetBump(PODFILE);

  expect(result).toContain("installer.pods_project.targets.each");
  expect(result).toContain("IPHONEOS_DEPLOYMENT_TARGET");
  // post_install 블록 안이어야 installer 를 쓸 수 있다.
  const postInstallIndex = result.indexOf("post_install do |installer|");
  const loopIndex = result.indexOf("installer.pods_project.targets.each");
  expect(postInstallIndex).toBeLessThan(loopIndex);
});

test("이미 들어 있으면 다시 넣지 않는다 — prebuild 를 여러 번 돌려도 한 벌이다", () => {
  const once = addPodDeploymentTargetBump(PODFILE);
  const twice = addPodDeploymentTargetBump(once);

  expect(twice).toBe(once);
});

test("post_install 블록이 없으면 던진다 — 템플릿이 바뀐 걸 조용히 넘기지 않는다", () => {
  expect(() => addPodDeploymentTargetBump("target 'App' do\nend\n")).toThrow(
    /post_install/,
  );
});

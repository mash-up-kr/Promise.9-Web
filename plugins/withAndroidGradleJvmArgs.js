const { withGradleProperties } = require("expo/config-plugins");

const JVM_ARGS_KEY = "org.gradle.jvmargs";
// expo-updates 의 KSP 단계가 템플릿 기본 Metaspace(512m)를 넘겨 Release 빌드가 죽는다(2026-10-29 실측).
const JVM_ARGS = "-Xmx2048m -XX:MaxMetaspaceSize=1024m";

function setGradleJvmArgs(properties) {
  const jvmArgs = properties.find(
    (item) => item.type === "property" && item.key === JVM_ARGS_KEY,
  );
  if (jvmArgs) {
    jvmArgs.value = JVM_ARGS;
  } else {
    properties.push({ type: "property", key: JVM_ARGS_KEY, value: JVM_ARGS });
  }
  return properties;
}

module.exports = function withAndroidGradleJvmArgs(config) {
  return withGradleProperties(config, (gradleConfig) => {
    gradleConfig.modResults = setGradleJvmArgs(gradleConfig.modResults);
    return gradleConfig;
  });
};

module.exports.setGradleJvmArgs = setGradleJvmArgs;

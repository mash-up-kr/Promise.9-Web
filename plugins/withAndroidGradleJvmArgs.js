const { withGradleProperties } = require("expo/config-plugins");

const JVM_ARGS_KEY = "org.gradle.jvmargs";
const METASPACE = "-XX:MaxMetaspaceSize=1024m";
const DEFAULT_JVM_ARGS = `-Xmx2048m ${METASPACE}`;

// expo-updates 의 KSP 단계가 템플릿 기본 Metaspace(512m)를 넘겨 로컬 Release 빌드가 죽는다(2026-10-29 실측).
// EAS 빌드는 워커가 jvmargs 를 직접 덮어쓰므로(Metaspace 1g) 이 플러그인은 로컬 빌드에만 영향이 있다.
function setGradleJvmArgs(properties) {
  const jvmArgs = properties.find(
    (item) => item.type === "property" && item.key === JVM_ARGS_KEY,
  );
  if (!jvmArgs) {
    properties.push({
      type: "property",
      key: JVM_ARGS_KEY,
      value: DEFAULT_JVM_ARGS,
    });
  } else if (jvmArgs.value.includes("-XX:MaxMetaspaceSize=")) {
    jvmArgs.value = jvmArgs.value.replace(
      /-XX:MaxMetaspaceSize=\S+/,
      METASPACE,
    );
  } else {
    jvmArgs.value = `${jvmArgs.value} ${METASPACE}`;
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

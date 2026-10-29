/**
 * @jest-environment node
 */
const { setGradleJvmArgs } = require("./withAndroidGradleJvmArgs");

const jvmArgs = (properties) =>
  properties.find((item) => item.key === "org.gradle.jvmargs")?.value;

test("기본 템플릿의 Metaspace 512m 를 1024m 로 올린다", () => {
  const properties = [
    { type: "comment", value: "Gradle JVM 설정" },
    {
      type: "property",
      key: "org.gradle.jvmargs",
      value: "-Xmx2048m -XX:MaxMetaspaceSize=512m",
    },
  ];

  expect(jvmArgs(setGradleJvmArgs(properties))).toBe(
    "-Xmx2048m -XX:MaxMetaspaceSize=1024m",
  );
});

test("jvmargs 가 없으면 추가한다", () => {
  expect(jvmArgs(setGradleJvmArgs([]))).toBe(
    "-Xmx2048m -XX:MaxMetaspaceSize=1024m",
  );
});

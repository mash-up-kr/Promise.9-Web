/**
 * @jest-environment node
 */
const { setGradleJvmArgs } = require("./withAndroidGradleJvmArgs");

const jvmArgs = (properties) =>
  properties.find((item) => item.key === "org.gradle.jvmargs")?.value;

const withJvmArgs = (value) => [
  { type: "comment", value: "Gradle JVM 설정" },
  { type: "property", key: "org.gradle.jvmargs", value },
];

test("기본 템플릿의 Metaspace 512m 를 1024m 로 올린다", () => {
  expect(
    jvmArgs(
      setGradleJvmArgs(withJvmArgs("-Xmx2048m -XX:MaxMetaspaceSize=512m")),
    ),
  ).toBe("-Xmx2048m -XX:MaxMetaspaceSize=1024m");
});

test("다른 플래그는 그대로 두고 Metaspace 만 바꾼다", () => {
  expect(
    jvmArgs(
      setGradleJvmArgs(
        withJvmArgs(
          "-Xmx4096m -XX:MaxMetaspaceSize=512m -Dfile.encoding=UTF-8",
        ),
      ),
    ),
  ).toBe("-Xmx4096m -XX:MaxMetaspaceSize=1024m -Dfile.encoding=UTF-8");
});

test("Metaspace 지정이 없으면 뒤에 붙인다", () => {
  expect(jvmArgs(setGradleJvmArgs(withJvmArgs("-Xmx2048m")))).toBe(
    "-Xmx2048m -XX:MaxMetaspaceSize=1024m",
  );
});

test("jvmargs 가 없으면 템플릿 기본 힙과 함께 추가한다", () => {
  expect(jvmArgs(setGradleJvmArgs([]))).toBe(
    "-Xmx2048m -XX:MaxMetaspaceSize=1024m",
  );
});

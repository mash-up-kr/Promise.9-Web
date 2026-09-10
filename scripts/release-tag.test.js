const { readVersion, resolveTag } = require("./release-tag");

describe("readVersion", () => {
  it("app.json 은 expo.version 에서 읽는다", () => {
    expect(readVersion({ expo: { version: "1.1.0" } })).toBe("1.1.0");
  });

  it("package.json 은 version 에서 읽는다", () => {
    expect(readVersion({ version: "1.0.1" })).toBe("1.0.1");
  });
});

describe("resolveTag", () => {
  it("태그가 없으면 만들 태그와 직전 태그를 준다", () => {
    expect(
      resolveTag({ version: "1.1.0", prefix: "v", existingTags: ["v1.0.0"] }),
    ).toEqual({ tag: "v1.1.0", previousTag: "v1.0.0" });
  });

  it("이미 같은 태그가 있으면 null", () => {
    expect(
      resolveTag({ version: "1.0.0", prefix: "v", existingTags: ["v1.0.0"] }),
    ).toBeNull();
  });

  it("첫 릴리즈면 직전 태그가 null", () => {
    expect(
      resolveTag({ version: "1.0.0", prefix: "v", existingTags: [] }),
    ).toEqual({ tag: "v1.0.0", previousTag: null });
  });

  it("직전 태그는 문자열 순서가 아니라 semver 로 고른다", () => {
    const result = resolveTag({
      version: "1.11.0",
      prefix: "v",
      existingTags: ["v1.9.0", "v1.10.0", "v1.2.0"],
    });

    expect(result.previousTag).toBe("v1.10.0");
  });

  it("다른 계열의 태그를 섞지 않는다", () => {
    const result = resolveTag({
      version: "1.0.1",
      prefix: "ext-v",
      existingTags: ["v1.0.0", "v2.0.0", "ext-v1.0.0"],
    });

    expect(result).toEqual({ tag: "ext-v1.0.1", previousTag: "ext-v1.0.0" });
  });

  it("접두사가 같아도 semver 가 아닌 태그는 무시한다", () => {
    const result = resolveTag({
      version: "1.1.0",
      prefix: "v",
      existingTags: ["v1.0.0", "v-nightly"],
    });

    expect(result.previousTag).toBe("v1.0.0");
  });
});

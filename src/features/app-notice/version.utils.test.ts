import { compareVersions, resolveUpdateKind } from "./version.utils";

describe("compareVersions", () => {
  test("자리마다 수로 비교한다 — 문자열 비교면 1.10.0 이 1.9.0 보다 작게 나온다", () => {
    expect(compareVersions("1.10.0", "1.9.0")).toBe(1);
    expect(compareVersions("1.9.0", "1.10.0")).toBe(-1);
  });

  test("같은 버전은 0", () => {
    expect(compareVersions("1.1.0", "1.1.0")).toBe(0);
  });

  test("자리 수가 달라도 빠진 자리는 0 으로 본다", () => {
    expect(compareVersions("1.1", "1.1.0")).toBe(0);
    expect(compareVersions("1.1.1", "1.1")).toBe(1);
  });

  test("버전 형식이 아니면 null — 호출부가 판단을 포기할 수 있게", () => {
    expect(compareVersions("abc", "1.0.0")).toBeNull();
    expect(compareVersions("1.0.0", "")).toBeNull();
    expect(compareVersions("1.0.0-beta", "1.0.0")).toBeNull();
  });
});

describe("resolveUpdateKind", () => {
  const RELEASE = { latestVersion: "1.3.0", minSupportedVersion: "1.1.0" };

  test("필수 버전보다 낮으면 force", () => {
    expect(resolveUpdateKind({ currentVersion: "1.0.9", ...RELEASE })).toBe(
      "force",
    );
  });

  test("필수 버전과 같으면 force 가 아니다", () => {
    expect(resolveUpdateKind({ currentVersion: "1.1.0", ...RELEASE })).toBe(
      "recommend",
    );
  });

  test("필수는 넘겼지만 최신이 아니면 recommend", () => {
    expect(resolveUpdateKind({ currentVersion: "1.2.0", ...RELEASE })).toBe(
      "recommend",
    );
  });

  test("최신이면 none", () => {
    expect(resolveUpdateKind({ currentVersion: "1.3.0", ...RELEASE })).toBe(
      "none",
    );
  });

  test("최신보다 높아도(내부 빌드) none", () => {
    expect(resolveUpdateKind({ currentVersion: "1.4.0", ...RELEASE })).toBe(
      "none",
    );
  });

  test("버전 값이 깨져 있으면 none — 안내 하나 때문에 앱을 막지 않는다", () => {
    expect(resolveUpdateKind({ currentVersion: "", ...RELEASE })).toBe("none");
    expect(
      resolveUpdateKind({
        currentVersion: "1.0.0",
        latestVersion: "unknown",
        minSupportedVersion: "1.1.0",
      }),
    ).toBe("none");
    expect(
      resolveUpdateKind({
        currentVersion: "1.0.0",
        latestVersion: "1.3.0",
        minSupportedVersion: "unknown",
      }),
    ).toBe("none");
  });
});

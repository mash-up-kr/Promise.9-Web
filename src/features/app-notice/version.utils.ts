/** 업데이트 안내의 종류 — force 는 닫을 수 없는 차단 안내, recommend 는 건너뛸 수 있는 권유. */
export type UpdateKind = "force" | "recommend" | "none";

// app.json 의 version 과 원격 기준 버전이 쓰는 형식: 숫자와 점만. prerelease 접미사(-beta)는 쓰지 않는다.
const VERSION_PATTERN = /^\d+(\.\d+)*$/;

function parseVersion(raw: string): number[] | null {
  const trimmed = raw.trim();
  if (!VERSION_PATTERN.test(trimmed)) {
    return null;
  }
  return trimmed.split(".").map(Number);
}

/**
 * 버전 문자열을 자리마다 수로 비교한다. a<b → -1 · a===b → 0 · a>b → 1.
 * 둘 중 하나라도 버전 형식이 아니면 `null` — 호출부가 비교를 포기하고 안내를 건너뛰게 한다.
 */
export function compareVersions(a: string, b: string): -1 | 0 | 1 | null {
  const left = parseVersion(a);
  const right = parseVersion(b);
  if (left === null || right === null) {
    return null;
  }

  // 자리 수가 다르면 빠진 자리를 0 으로 본다 ("1.1" === "1.1.0").
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const diff = (left[index] ?? 0) - (right[index] ?? 0);
    if (diff !== 0) {
      return diff > 0 ? 1 : -1;
    }
  }
  return 0;
}

export interface ResolveUpdateKindParams {
  /** 설치된 앱 버전(app.json version). */
  currentVersion: string;
  /** 스토어에 올라가 있는 최신 버전. */
  latestVersion: string;
  /** 이 버전보다 낮으면 더 이상 쓸 수 없다고 보는 하한. */
  minSupportedVersion: string;
}

/**
 * 설치 버전과 원격 기준으로 안내 종류를 정한다.
 *
 * 버전 값이 하나라도 깨져 있으면 `none` 이다 — 기준을 읽지 못한 것 때문에 앱을 막으면 안 된다.
 */
export function resolveUpdateKind({
  currentVersion,
  latestVersion,
  minSupportedVersion,
}: ResolveUpdateKindParams): UpdateKind {
  const toMin = compareVersions(currentVersion, minSupportedVersion);
  const toLatest = compareVersions(currentVersion, latestVersion);
  if (toMin === null || toLatest === null) {
    return "none";
  }

  if (toMin < 0) {
    return "force";
  }
  return toLatest < 0 ? "recommend" : "none";
}

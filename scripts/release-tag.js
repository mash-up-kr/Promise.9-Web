const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;

function readVersion(manifest) {
  return manifest.expo?.version ?? manifest.version;
}

function compareVersion(a, b) {
  const left = a.match(SEMVER).slice(1).map(Number);
  const right = b.match(SEMVER).slice(1).map(Number);

  return left[0] - right[0] || left[1] - right[1] || left[2] - right[2];
}

/**
 * 만들 태그와, 릴리즈 노트의 시작점이 될 직전 태그를 정한다.
 * 같은 태그가 이미 있으면 null — 버전이 안 올랐다는 뜻이라 릴리즈가 아니다.
 */
function resolveTag({ version, prefix, existingTags }) {
  const tag = `${prefix}${version}`;
  if (existingTags.includes(tag)) {
    return null;
  }

  const series = existingTags
    .filter((name) => name.startsWith(prefix))
    .map((name) => name.slice(prefix.length))
    .filter((rest) => SEMVER.test(rest))
    .sort(compareVersion);

  const previous = series.at(-1);

  return { tag, previousTag: previous ? `${prefix}${previous}` : null };
}

module.exports = { readVersion, resolveTag };

if (require.main === module) {
  const { readFileSync } = require("node:fs");
  const { execFileSync } = require("node:child_process");
  const [manifestPath, prefix] = process.argv.slice(2);

  const version = readVersion(JSON.parse(readFileSync(manifestPath, "utf8")));
  const existingTags = execFileSync("git", ["tag", "--list"], {
    encoding: "utf8",
  })
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const resolved = resolveTag({ version, prefix, existingTags });
  if (resolved) {
    process.stdout.write(`${resolved.tag}\n${resolved.previousTag ?? ""}\n`);
  }
}

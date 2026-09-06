/**
 * 크롬 웹 스토어 업로드용 zip 을 만든다.
 *
 * `manifest.config.ts` 의 `key` 는 로컬 압축해제 로드에서 확장 ID 를 고정하려고 두는 값인데,
 * 웹 스토어는 이 필드가 있으면 업로드를 거부한다("key 입력란은 매니페스트에 허용되지 않습니다").
 * 스토어는 아이템에 자체 키를 부여하므로 업로드본에는 필요도 없다.
 *
 * 그래서 dist 를 임시 폴더로 복사해 거기서만 `key` 를 지우고 압축한다 — dist 자체는 건드리지
 * 않는다. dist 의 key 를 지워버리면 개발자들이 압축해제로 로드한 확장의 ID 가 바뀐다.
 */
import { execFileSync } from "node:child_process";
import {
  cpSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const DIST = "dist";

let manifest;
try {
  manifest = JSON.parse(readFileSync(join(DIST, "manifest.json"), "utf8"));
} catch {
  console.error(
    "✖ dist/manifest.json 이 없습니다. 먼저 `pnpm build` 를 실행하세요.",
  );
  process.exit(1);
}

const { version } = JSON.parse(readFileSync("package.json", "utf8"));
if (manifest.version !== version) {
  console.error(
    `✖ 버전 불일치: dist/manifest.json=${manifest.version}, package.json=${version}\n` +
      "  package.json 을 고친 뒤 다시 빌드하지 않은 상태입니다. `pnpm build` 를 실행하세요.",
  );
  process.exit(1);
}

const zipName = `promise9-extension-${version}.zip`;
const staging = mkdtempSync(join(tmpdir(), "promise9-ext-"));

try {
  cpSync(DIST, staging, { recursive: true });

  delete manifest.key;
  writeFileSync(
    join(staging, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );

  rmSync(zipName, { force: true });
  // -X: macOS 확장 속성 제외. 숨김 파일(.DS_Store 등)은 스토어가 싫어하므로 넣지 않는다.
  execFileSync(
    "zip",
    ["-r", "-X", "-q", join(process.cwd(), zipName), ".", "-x", ".*", "*/.*"],
    {
      cwd: staging,
    },
  );
} finally {
  rmSync(staging, { recursive: true, force: true });
}

console.log(`✔ ${zipName} (key 제거됨) — 웹 스토어에 업로드하세요.`);

/**
 * 배포 번들에 임시 마스터 토큰이 실리는 것을 막는 빌드 가드.
 *
 * `EXPO_PUBLIC_*` 값은 빌드 타임에 JS 번들로 인라인된다. 따라서
 * `EXPO_PUBLIC_API_MASTER_TOKEN`(= 서버 MASTER_ACCESS_TOKEN)이 설정된 채로
 * `expo export -p web` 을 돌리면 마스터 토큰이 공개 웹 번들에 그대로 노출된다.
 *
 * shell env 뿐 아니라 Expo 가 production export 시 읽는 dotenv 파일도 함께 검사한다.
 * (로컬 개발자 머신에는 보통 .env.local 에 토큰이 있으므로 shell env 만 봐선 못 막는다.)
 */
import { readFileSync } from "node:fs";

const KEY = "EXPO_PUBLIC_API_MASTER_TOKEN";

// Expo 가 production 모드에서 읽는 dotenv 파일들.
const ENV_FILES = [
  ".env",
  ".env.local",
  ".env.production",
  ".env.production.local",
];

/** dotenv 한 줄에서 KEY 의 값이 비어있지 않은지 본다. 따옴표·주석은 벗겨낸다. */
function hasValueInFile(path) {
  let content;
  try {
    content = readFileSync(path, "utf8");
  } catch {
    return false; // 파일 없음 — 정상.
  }

  return content.split("\n").some((line) => {
    const match = line.match(/^\s*(?:export\s+)?([\w.]+)\s*=\s*(.*)$/);
    if (!match || match[1] !== KEY) return false;
    const value = match[2].trim().replace(/^["']|["']$/g, "");
    return value.length > 0;
  });
}

const sources = ENV_FILES.filter(hasValueInFile);
if (process.env[KEY]) sources.unshift("shell 환경변수");

if (sources.length > 0) {
  console.error(
    `\n✖ 배포 중단: ${KEY} 이(가) 설정되어 있습니다.\n` +
      `  설정 위치: ${sources.join(", ")}\n\n` +
      `  이 값은 빌드 타임에 공개 웹 번들로 인라인되어 누구나 꺼내볼 수 있습니다.\n` +
      `  배포 전에 위 위치에서 값을 비우고 다시 실행하세요.\n`,
  );
  process.exit(1);
}

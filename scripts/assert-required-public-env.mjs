/**
 * 웹 배포 전, 클라이언트 번들에 반드시 인라인돼야 하는 EXPO_PUBLIC_* 값이
 * 빌드 시점에 존재하는지 검사하는 가드.
 *
 * 배경: `EXPO_PUBLIC_*` 값은 런타임이 아니라 "빌드 타임"에 JS 번들로 인라인된다.
 * 즉 `expo export -p web` 을 돌리는 시점의 환경(shell env + dotenv 파일)에 값이 없으면
 * `process.env.EXPO_PUBLIC_X` 가 `undefined` 로 치환되고,
 * `if (!X) throw ...` 같은 가드가 항상 참이 되어 미니파이어가 실제 구현을 죽은 코드로
 * 제거해 버린다. 그 결과 "배포에선 로그인이 그냥 안 되는" 사고가 난다.
 * (실제 사례: EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID 누락으로 구글 로그인 함수가
 *  throw 한 줄만 남고 배포됨 — plan/troubleshooting-google-login-deploy.md 참고.)
 *
 * ⚠️ Cloudflare 대시보드의 "Variables and Secrets" 는 Worker "런타임" 값이라
 * 이 빌드 검사와 무관하다. 정적 번들에 값을 넣으려면 반드시 빌드가 도는 환경
 * (로컬 .env.local, 또는 CI 의 빌드 스텝 환경변수)에 있어야 한다.
 *
 * shell env 뿐 아니라 Expo 가 production export 시 읽는 dotenv 파일도 함께 검사한다.
 * (assert-no-master-token.mjs 와 동일한 파일 목록·파싱 규칙을 쓴다.)
 */
import { readFileSync } from "node:fs";

// 웹 번들이 동작하려면 빌드 시점에 반드시 있어야 하는 값들.
// iOS 전용(EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID)은 웹 export 에 쓰이지 않으므로 제외한다.
const REQUIRED_KEYS = [
  "EXPO_PUBLIC_API_BASE_URL", // 서버 API base URL — 없으면 모든 요청이 깨진다.
  "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID", // 구글 웹 로그인 client_id
  "EXPO_PUBLIC_KAKAO_REST_API_KEY", // 카카오 웹 로그인 authorize client_id
];

// Expo 가 production 모드에서 읽는 dotenv 파일들.
const ENV_FILES = [
  ".env",
  ".env.local",
  ".env.production",
  ".env.production.local",
];

/** dotenv 파일들 중 어디든 KEY 의 값이 비어있지 않게 들어있으면 true. 따옴표·주석은 벗겨낸다. */
function hasValueInFiles(key) {
  return ENV_FILES.some((path) => {
    let content;
    try {
      content = readFileSync(path, "utf8");
    } catch {
      return false; // 파일 없음 — 이 파일은 건너뛴다.
    }

    return content.split("\n").some((line) => {
      const match = line.match(/^\s*(?:export\s+)?([\w.]+)\s*=\s*(.*)$/);
      if (!match || match[1] !== key) return false;
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      return value.length > 0;
    });
  });
}

/** shell env 또는 dotenv 파일 어디든 값이 있으면 "빌드 시 인라인 가능"으로 본다. */
function isAvailable(key) {
  if (process.env[key] && process.env[key].length > 0) return true;
  return hasValueInFiles(key);
}

const missing = REQUIRED_KEYS.filter((key) => !isAvailable(key));

if (missing.length > 0) {
  console.error(
    `\n✖ 배포 중단: 웹 번들에 필요한 EXPO_PUBLIC_* 값이 빠졌습니다.\n` +
      missing.map((key) => `  - ${key}`).join("\n") +
      `\n\n` +
      `  EXPO_PUBLIC_* 는 빌드 타임에 번들로 인라인됩니다. 지금 비어 있으면\n` +
      `  해당 기능(예: 소셜 로그인)이 배포본에서 죽은 코드로 제거되어 동작하지 않습니다.\n` +
      `  .env.local(또는 CI 의 빌드 환경변수)에 값을 채우고 다시 실행하세요.\n` +
      `  (참고: Cloudflare 런타임 Variables 는 이 빌드 검사와 무관합니다.)\n`,
  );
  process.exit(1);
}

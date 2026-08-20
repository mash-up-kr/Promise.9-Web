import { readFileSync } from "node:fs";
import { test as base, expect } from "@playwright/test";

// tokenStorage.web.ts 의 REFRESH_TOKEN_KEY 와 일치시킨다 — 인증 가드((tabs)/_layout →
// useAuthGate)는 이 키의 존재 여부만 보고 로그인 화면 이동 여부를 정한다.
const REFRESH_TOKEN_KEY = "promise9_refresh_token";

/**
 * env 값을 읽는다. CI 는 워크플로우 env(process.env)로 직접 주입되지만, 로컬은
 * `.env.local` 에만 있고 Playwright 부모 프로세스는 그 파일을 자동으로 읽지 않는다
 * (expo 자식 프로세스만 자체적으로 읽는다) — 그래서 파일을 직접 파싱해 폴백한다.
 * (assert-no-master-token.mjs 와 같은 방식, dotenv 의존성 추가 없음)
 */
function readEnvValue(key: string): string | undefined {
  if (process.env[key]) return process.env[key];

  let content: string;
  try {
    content = readFileSync(".env.local", "utf8");
  } catch {
    return undefined;
  }

  for (const line of content.split("\n")) {
    const match = line.match(/^\s*(?:export\s+)?([\w.]+)\s*=\s*(.*)$/);
    if (match?.[1] === key) {
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      return value.length > 0 ? value : undefined;
    }
  }
  return undefined;
}

// 이 토큰은 **Playwright 프로세스 안에서만** 쓰인다 — 앱 코드(shared/api/token.ts)는
// 더 이상 이 값을 모른다(과거엔 accessToken 초기 시드로 앱에 박혀 있었고, 그게
// 실사용자가 조용히 마스터 계정으로 인증되는 계정 누수 버그의 원인이었다 — 그래서 제거함).
// 여기서는 앱 상태를 전혀 건드리지 않고, 브라우저가 API 서버로 보내는 요청에만
// 헤더를 얹는다. CI 시크릿 이름은 E2E_MASTER_TOKEN(로컬은 EXPO_PUBLIC_API_MASTER_TOKEN 재사용).
const MASTER_TOKEN =
  readEnvValue("E2E_MASTER_TOKEN") ??
  readEnvValue("EXPO_PUBLIC_API_MASTER_TOKEN");
const API_BASE_URL = readEnvValue("EXPO_PUBLIC_API_BASE_URL");

/**
 * 인증이 필요한 화면을 여는 E2E 공용 fixture.
 *
 * - 인증 가드 통과: localStorage 에 더미 리프레시 토큰을 심는다(토큰 유효성은
 *   보지 않는 가드라 실 토큰일 필요 없음). 이건 완전히 클라이언트 라우팅 로직이라
 *   실제로 동작을 확인했다 — (tabs) 하위 화면은 전부 이걸로 인증 가드를 통과한다.
 *
 * - 실 API 인증(아래 route)은 **현재 서버 CORS 설정 때문에 브라우저에서 동작하지
 *   않는다.** 헤더 주입 자체는 맞게 구현했고 서버도 마스터 토큰을 정상적으로
 *   인증하지만(curl 로 확인: `Authorization: Bearer <마스터토큰>` → 200), 서버의
 *   `Access-Control-Allow-Origin` 이 배포 도메인만 허용목록에 있고 `localhost`(로컬·CI
 *   Playwright 오리진)는 없어서, 응답 자체를 브라우저가 CORS 위반으로 차단한다
 *   (`net::ERR_FAILED` — 401 이 아니라 네트워크 레벨 실패로 나타난다). 이건 이 저장소가
 *   아니라 서버(Promise.9-Server) 쪽 CORS 허용목록 문제라 여기서 고칠 수 없다.
 *   → 백엔드에 localhost/CI 오리진을 CORS 허용목록에 추가해달라고 요청하면 이 route 가
 *   그대로 동작하기 시작한다(코드 변경 불필요). 그 전까지, 실 API 데이터가 필요한
 *   새 E2E 스펙은 `page.route(..., route.fulfill(...))` 로 응답을 목킹해서 작성할 것 —
 *   이 fixture 의 인증 가드 통과 부분은 그 경우에도 그대로 유효하다.
 *
 * MASTER_TOKEN/API_BASE_URL 이 없으면(토큰 미설정 로컬 환경 등) API 헤더 주입 자체를
 * 건너뛴다.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(
      ([key, value]) => {
        window.localStorage.setItem(key, value);
      },
      [REFRESH_TOKEN_KEY, "e2e-fake-refresh-token"] as const,
    );

    if (MASTER_TOKEN && API_BASE_URL) {
      await page.route(`${API_BASE_URL}/**`, async (route) => {
        await route.continue({
          headers: {
            ...route.request().headers(),
            Authorization: `Bearer ${MASTER_TOKEN}`,
          },
        });
      });
    }

    await use(page);
  },
});

export { expect };

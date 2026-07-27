/**
 * 액세스 토큰 저장소 (메모리).
 *
 * 로그인·토큰 저장 연동(#auth) 전까지 dev 용 env 토큰(`EXPO_PUBLIC_DEV_ACCESS_TOKEN`)을
 * 초기값으로 시드한다. 정식 구현 시 로그인 성공 콜백이 `setAccessToken` 을 호출하고,
 * surface 별 영속 저장소(앱·웹 expo-secure-store / 익스텐션 chrome.storage.local)로 교체한다.
 *
 * `getAccessToken` 이 async 인 이유: secure-store 등 비동기 저장소로 교체해도 호출부가 바뀌지 않도록.
 */
let accessToken: string | null =
  process.env.EXPO_PUBLIC_DEV_ACCESS_TOKEN ?? null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export async function getAccessToken(): Promise<string | null> {
  return accessToken;
}

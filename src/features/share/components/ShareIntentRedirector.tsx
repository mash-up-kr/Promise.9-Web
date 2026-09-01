import { useShareIntentRedirect } from "../hooks/useShareIntentRedirect";

/** 루트 레이아웃에서 공유 intent 수신을 구독만 하는 무렌더 컴포넌트. */
export function ShareIntentRedirector() {
  useShareIntentRedirect();

  return null;
}

import { buildContext } from "react-simplikit";

import type { AuthGateStatus } from "./hooks/useAuthGate";

/**
 * 루트 레이아웃이 한 번 확인한 인증 상태를 라우트에 내려준다 — 오버레이 라우트(create-link)가
 * 열릴 때마다 저장소를 다시 읽으며 빈 프레임을 그리지 않게 한다.
 */
export const [AuthGateProvider, useAuthGateContext] = buildContext<{
  status: AuthGateStatus;
}>("AuthGate");

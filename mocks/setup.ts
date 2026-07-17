import { apiClient } from "@shared/api";
import MockAdapter from "axios-mock-adapter";

import { registerHandlers } from "./handlers";
import { resetStore } from "./store";

let installed = false;

/**
 * 단일 apiClient(axios)에 mock 어댑터를 1회 설치한다.
 *
 * ⚠️ UT 전용 브랜치(chore/ut): 환경변수 게이트 없이 **항상 mock 으로 동작**한다.
 * 빌드 시점 env 주입에 의존하면 배포(expo export)에서 플래그가 누락돼 mock 이 꺼지므로,
 * 임시 브랜치에서는 코드로 고정한다. 실서버로 되돌리려면 _layout 의 호출을 제거한다.
 * delayResponse 로 약간의 지연을 줘 스켈레톤/로딩 UX 를 확인할 수 있게 한다.
 */
export function installMocks(): void {
  if (installed) return;
  resetStore();
  registerHandlers(new MockAdapter(apiClient, { delayResponse: 250 }));
  installed = true;
}

import { apiClient } from "@shared/api";
import MockAdapter from "axios-mock-adapter";

import { registerHandlers } from "./handlers";
import { resetStore } from "./store";

let installed = false;

/**
 * `EXPO_PUBLIC_USE_MOCK=true` 일 때만 단일 apiClient(axios)에 mock 어댑터를 1회 설치한다.
 * 플래그가 꺼져 있으면 아무것도 하지 않아 실제 서버로 나간다.
 * delayResponse 로 약간의 지연을 줘 스켈레톤/로딩 UX 를 UT 에서 확인할 수 있게 한다.
 */
export function installMocks(): void {
  if (installed) return;
  if (process.env.EXPO_PUBLIC_USE_MOCK !== "true") return;
  resetStore();
  registerHandlers(new MockAdapter(apiClient, { delayResponse: 250 }));
  installed = true;
}

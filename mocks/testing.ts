import { apiClient } from "@shared/api";
import MockAdapter from "axios-mock-adapter";

import { registerHandlers } from "./handlers";
import { resetStore } from "./store";

let mock: MockAdapter | undefined;

/**
 * 테스트에서 apiClient(axios)를 mock 스토어로 가로챈다.
 * 각 테스트의 beforeEach 에서 호출하면 스토어가 시드로 리셋된다.
 */
export function setupMockApi(): void {
  resetStore();
  if (!mock) {
    mock = new MockAdapter(apiClient);
    registerHandlers(mock);
  }
}

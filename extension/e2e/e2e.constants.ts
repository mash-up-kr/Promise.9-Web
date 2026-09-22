/** 목 API 포트 — 빌드에 박히는 `VITE_API_BASE_URL` 과 같아야 해서 고정한다. */
export const MOCK_API_PORT = 5188;
export const MOCK_API_BASE_URL = `http://localhost:${MOCK_API_PORT}/api/v1`;

/** 이 산출물에는 목 API 주소가 박혀 있다 — 배포용 `dist` 와 섞이지 않게 따로 둔다. */
export const E2E_DIST_DIR = "e2e-dist";

export const PANEL_PATH = "src/sidepanel/index.html";

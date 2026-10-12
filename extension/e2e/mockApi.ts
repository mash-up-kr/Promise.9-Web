import http from "node:http";

import { MOCK_API_PORT } from "./e2e.constants";

export interface ReceivedRequest {
  /** 예: `POST /links` — `/api/v1` 접두사와 쿼리스트링은 뗀다. */
  route: string;
  body: unknown;
}

export interface MockApi {
  requests: (route: string) => ReceivedRequest[];
  close: () => Promise<void>;
}

// 패널(chrome-extension://…)과 background 가 다른 출처에서 부른다.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "Content-Type": "application/json",
};

const EMPTY_COUNT = { linkCount: 0 };
const FOLDERS = [
  {
    folderId: 3,
    folderName: "디자인",
    color: "#61a8ef",
    linkCount: 12,
    lastSavedAt: null,
  },
  {
    folderId: 4,
    folderName: "개발",
    color: "#50b094",
    linkCount: 31,
    lastSavedAt: null,
  },
];

const success = (data: unknown) => JSON.stringify({ success: true, data });

function respond(route: string, body: unknown): string | null {
  switch (route) {
    case "POST /auth/refresh":
      return success({
        accessToken: "e2e-access",
        refreshToken: "e2e-refresh-rotated",
      });
    case "GET /folders":
      return success({
        systemFolders: {
          all: EMPTY_COUNT,
          uncategorized: EMPTY_COUNT,
          favorite: EMPTY_COUNT,
          recentlyDeleted: EMPTY_COUNT,
        },
        folders: FOLDERS,
      });
    case "POST /links":
      return success({
        linkId: 42,
        url: (body as { url: string }).url,
        savedAt: new Date().toISOString(),
      });
    default:
      return null;
  }
}

/** 서버 계약(shared/entities)의 응답 모양만 흉내 내는 로컬 서버. 받은 요청은 단언용으로 남긴다. */
export async function startMockApi(): Promise<MockApi> {
  const received: ReceivedRequest[] = [];

  const server = http.createServer((request, response) => {
    if (request.method === "OPTIONS") {
      response.writeHead(204, CORS_HEADERS);
      response.end();
      return;
    }

    let raw = "";
    request.on("data", (chunk) => {
      raw += chunk;
    });
    request.on("end", () => {
      const path = (request.url ?? "").replace("/api/v1", "").split("?")[0];
      const route = `${request.method} ${path}`;
      const body: unknown = raw ? JSON.parse(raw) : null;
      received.push({ route, body });

      const payload = respond(route, body);
      response.writeHead(payload ? 200 : 404, CORS_HEADERS);
      response.end(
        payload ??
          JSON.stringify({
            success: false,
            message: `목에 없는 요청: ${route}`,
          }),
      );
    });
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(MOCK_API_PORT, resolve);
  });

  return {
    requests: (route) => received.filter((entry) => entry.route === route),
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}

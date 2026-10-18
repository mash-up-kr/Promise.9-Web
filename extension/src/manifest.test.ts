import { describe, expect, it } from "vitest";

import { WEB_APP_PATH, webAppUrl } from "@/lib/webApp";
import manifestExport from "../manifest.config.ts";

// defineManifest 는 넘긴 객체를 그대로 돌려준다 — 함수·Promise 형태는 쓰지 않는다.
const manifest = manifestExport as chrome.runtime.ManifestV3;

describe("아이콘 우클릭 메뉴", () => {
  // Chrome 이 넣는 확장 이름 항목은 homepage_url 이 없으면 웹 스토어 페이지로 간다.
  it("이름 항목은 웹앱 홈을 연다", () => {
    expect(manifest.homepage_url).toBe(webAppUrl(WEB_APP_PATH.home));
  });
});

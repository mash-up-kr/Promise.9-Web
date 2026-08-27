import { defineManifest } from "@crxjs/vite-plugin";

import pkg from "./package.json" with { type: "json" };

/**
 * MV3 manifest — 사이드패널(Side Panel) 형태.
 *
 * 아이콘을 누르면 브라우저 우측에 전체 높이 패널이 열리고, 사용자가 닫을 때까지 유지된다.
 * `default_popup` 은 두지 않는다 — 팝업과 사이드패널은 동시에 아이콘에 붙일 수 없고,
 * 이 브랜치는 사이드패널 형태만 비교하기 위한 것이다.
 *
 * 권한
 * - `tabs`: 패널이 열린 채 탭을 옮겨다녀도 지금 보는 페이지를 저장 대상으로 따라가야 한다.
 *   아이콘 클릭 시점에만 부여되는 `activeTab` 으로는 탭 전환을 따라갈 수 없다.
 * - `storage`: 저장 진행/결과를 background 와 주고받는다.
 * - `sidePanel`: 패널 열기·동작 설정.
 */
export default defineManifest({
  manifest_version: 3,
  name: "링딩동",
  version: pkg.version,
  description: "보고 있는 페이지를 링딩동에 저장합니다.",
  action: {
    default_title: "링딩동에 저장",
  },
  side_panel: {
    default_path: "src/sidepanel/index.html",
  },
  background: {
    service_worker: "src/background/index.ts",
    type: "module",
  },
  permissions: ["tabs", "storage", "sidePanel"],
  host_permissions: ["https://api.link-ding-dong.com/*"],
  icons: {
    16: "icons/icon-16.png",
    32: "icons/icon-32.png",
    48: "icons/icon-48.png",
    128: "icons/icon-128.png",
  },
});

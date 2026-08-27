import { defineManifest } from "@crxjs/vite-plugin";

import pkg from "./package.json" with { type: "json" };

/**
 * MV3 manifest — 사이드패널(Side Panel) 형태.
 *
 * 아이콘을 누르면 브라우저 우측에 전체 높이 패널이 열리고, 사용자가 닫을 때까지 유지된다.
 * `default_popup` 은 두지 않는다 — 팝업과 사이드패널은 동시에 아이콘에 붙일 수 없다.
 *
 * 권한
 * - `tabs`: 패널이 열린 채 탭을 옮겨다녀도 지금 보는 페이지를 저장 대상으로 따라가야 한다.
 *   아이콘 클릭 시점에만 부여되는 `activeTab` 으로는 탭 전환을 따라갈 수 없다.
 * - `storage`: 저장 진행/결과를 background 와 주고받는다.
 * - `sidePanel`: 패널 열기·동작 설정.
 * - `identity`: 구글 로그인 창(`launchWebAuthFlow`)을 띄우고 리다이렉트를 회수한다.
 */
export default defineManifest({
  manifest_version: 3,
  /**
   * 확장 ID 를 고정하는 공개키.
   *
   * 없으면 Chrome 이 **폴더 경로**를 해시해 ID 를 만들어서 사람마다 ID 가 달라진다.
   * 구글 로그인의 리디렉션 URI(`https://<확장 ID>.chromiumapp.org/`)는 Cloud Console 에
   * 완전 일치로 등록해야 하므로, ID 가 갈리면 팀원 수만큼 등록해야 한다.
   *
   * 공개키라 공개돼도 무방하다(짝이 되는 개인키는 `extension/key.pem` — gitignore 대상이며
   * 압축해제 로드에는 필요 없다. 자체 배포용 .crx 서명에만 쓰인다).
   * 스토어 배포 시에는 웹 스토어가 자체 ID 를 부여하므로 그때 URI 를 한 번 더 등록해야 한다.
   */
  key: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAkfy549sPoB49HKtLK+1cOS/bzS2+htKAFzeYUvynm+c39m9lhW/9flOEzpmHxXsJ2KMbZvfcIO1TBGxMK37Dw8GV3l7WkSDPUbRf8+kn9ffPhLRn20eTLIuibqljBZBERQQCO58/OVhetk9zj46I+UmvebDeZ7caoYkXo/YQnHwGquLMWlOHRNk7J7czXmbk+nM2Mx40aVyabx4Qx1F2pKnUHMT/XbifziSjLnWcrrjD45pYAtgTnYOEY8DRv5kKJVtzte1VNx2wRv3LhRHNEX5IAkSxex0oX4XUZaamSvKOJMngxlOBk6tpj5UYW19K3VimKYsL1SlGCkvpS/R0OQIDAQAB",
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
  permissions: ["tabs", "storage", "sidePanel", "identity"],
  host_permissions: ["https://api.link-ding-dong.com/*"],
  icons: {
    16: "icons/icon-16.png",
    32: "icons/icon-32.png",
    48: "icons/icon-48.png",
    128: "icons/icon-128.png",
  },
});

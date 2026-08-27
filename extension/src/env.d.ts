/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 저장 성공 후 '링크 보러가기' 가 여는 웹앱 주소. 비어 있으면 이동 대신 패널을 닫는다. */
  readonly VITE_WEB_APP_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

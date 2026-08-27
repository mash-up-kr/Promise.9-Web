/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 구글 OAuth 웹 클라이언트 ID. 없으면 로그인 시 안내 메시지와 함께 실패한다. */
  readonly VITE_GOOGLE_WEB_CLIENT_ID?: string;
  /** 저장 성공 후 '링크 보러가기' 가 여는 웹앱 주소. 비어 있으면 이동 대신 패널을 닫는다. */
  readonly VITE_WEB_APP_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

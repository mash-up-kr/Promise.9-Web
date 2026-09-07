import Constants from "expo-constants";

/** 앱 버전(app.json version). 설정 "버전 정보" 행에 `v{APP_VERSION}` 으로 표시. */
export const APP_VERSION = Constants.expoConfig?.version ?? "";

/** 문의 창구. 탈퇴 안내·고객지원 페이지·개인정보처리방침이 같은 주소를 가리킨다. */
export const SUPPORT_EMAIL = "2026promise.9@gmail.com";

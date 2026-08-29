import Constants from "expo-constants";

/** 앱 버전(app.json version). 설정 "버전 정보" 행에 `v{APP_VERSION}` 으로 표시. */
export const APP_VERSION = Constants.expoConfig?.version ?? "";

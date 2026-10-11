import Constants from "expo-constants";

/** 앱 버전(app.json version). 설정 "버전 정보" 행 표시와 업데이트 안내 판단이 함께 쓴다. */
export const APP_VERSION = Constants.expoConfig?.version ?? "";

import Constants from "expo-constants";

import { isIOS } from "@/constants/platform.constants";

const PRODUCTION_MANIFEST_URL = "https://link-ding-dong.com/app-release.json";

// 로컬 검증용 대체 주소(시뮬·에뮬에서 force/recommend 를 재현할 때). 개발 빌드에서만 쓴다 —
// EAS·배포 환경에 이 값이 섞여 들어가도 출시 앱이 엉뚱한 기준을 읽지 않게 한다.
// (NODE_ENV 는 번들러가 출시 빌드에서 "production" 으로 박는다 — RN 의 __DEV__ 와 같은 기준.)
const devManifestUrlOverride = process.env.EXPO_PUBLIC_APP_RELEASE_URL?.trim();
const isDevelopmentBuild = process.env.NODE_ENV !== "production";

/**
 * 업데이트 기준 파일의 주소.
 *
 * 서버 API 가 아니라 `public/app-release.json` 이다 — 웹 배포(`main` 머지)에 실려 나가므로
 * 앱을 다시 올리지 않고도 기준을 바꿀 수 있다. 갱신·로컬 검증 절차는 docs/release.md 참고.
 */
export const APP_RELEASE_MANIFEST_URL =
  isDevelopmentBuild && devManifestUrlOverride
    ? devManifestUrlOverride
    : PRODUCTION_MANIFEST_URL;

/** 기기에 남기는 안내 기록. 키를 바꾸면 이미 건너뛴 안내가 다시 뜬다. */
export const APP_NOTICE_STORAGE_KEYS = {
  /** "나중에" 로 건너뛴 권유 대상 버전. 그 버전 동안은 다시 띄우지 않는다. */
  snoozedUpdateVersion: "appNotice.snoozedUpdateVersion",
  /** 앱에서 링크를 저장한 누적 횟수 — 후기 요청 시점을 가늠하는 값. */
  reviewSaveCount: "appNotice.review.saveCount",
  /** 마지막으로 후기 요청을 띄운 시각(ISO). */
  reviewRequestedAt: "appNotice.review.requestedAt",
  /** 마지막으로 후기 요청을 띄운 앱 버전 — 같은 버전에서는 다시 띄우지 않는다. */
  reviewRequestedVersion: "appNotice.review.requestedVersion",
} as const;

/**
 * 후기 요청 조건의 기본값 — 기준 파일(`public/app-release.json`)의 review 블록이 있으면 그 값이 우선한다.
 *
 * iOS·Android 가이드가 "버튼이 아니라 사용자가 뭔가를 끝낸 자연스러운 시점에, 드물게" 를 요구한다 —
 * 그래서 저장을 몇 번 해본 사용자에게만, 앱 버전당 한 번·쿨다운을 두고 OS 리뷰 창을 띄운다.
 * (OS 도 따로 조절한다 — iOS 는 365일에 최대 3번·같은 버전엔 다시 묻지 않고, Android 는 할당량이 있다.)
 */
export const REVIEW_PROMPT = {
  /** 이 횟수만큼 저장해 본 뒤부터 요청한다. */
  minSaveCount: 5,
  /** 한 번 띄운 뒤 다시 띄우지 않는 기간(일). 같은 앱 버전에서는 기간과 무관하게 다시 띄우지 않는다. */
  cooldownDays: 90,
  /** 조건이 맞아도 이만큼 기다렸다 띄운다 — 저장 완료 스낵바(4초)가 퇴장까지 끝난 뒤. */
  delayMs: 5_000,
} as const;

/**
 * 업데이트를 받을 스토어 주소. 단일 출처는 app.json(`ios.appStoreUrl` · `android.playStoreUrl`) —
 * expo-store-review 의 `hasAction()`·`storeUrl()` 도 같은 값을 읽는다. 설정이 없으면 null.
 */
export const STORE_URL =
  (isIOS
    ? Constants.expoConfig?.ios?.appStoreUrl
    : Constants.expoConfig?.android?.playStoreUrl) ?? null;

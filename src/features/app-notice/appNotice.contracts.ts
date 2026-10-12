import { z } from "zod";

// 버전 문자열 상한 — 기준 파일이 잘못 채워졌을 때 긴 값을 그대로 화면에 올리지 않는다.
const MAX_VERSION_LENGTH = 32;

const platformReleaseSchema = z.object({
  /** 스토어에 올라가 있는 최신 버전. 심사 통과·출시가 끝난 뒤에 올린다. */
  latestVersion: z.string().min(1).max(MAX_VERSION_LENGTH),
  /** 이 버전보다 낮으면 차단 안내를 띄운다. 구버전을 더는 받을 수 없을 때만 올린다. */
  minSupportedVersion: z.string().min(1).max(MAX_VERSION_LENGTH),
});

/**
 * `public/app-release.json` 의 계약 — 서버가 아니라 **우리가 정한** 파일이다.
 * 웹 배포에 실려 `https://link-ding-dong.com/app-release.json` 로 서빙되고, 앱이 실행마다 읽는다.
 */
export const appReleaseSchema = z.object({
  ios: platformReleaseSchema,
  android: platformReleaseSchema,
});

export type AppRelease = z.infer<typeof appReleaseSchema>;
export type PlatformRelease = z.infer<typeof platformReleaseSchema>;

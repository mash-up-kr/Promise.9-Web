import {
  APP_STORE_URL,
  IS_PLAY_STORE_RELEASED,
  PLAY_STORE_URL,
} from "./appInstall.constants";

export type MobileOS = "ios" | "android";

// ponytail: iPadOS 13+ Safari 는 기본이 데스크톱 UA(Macintosh)라 데스크톱으로 판별된다 — QR·안내 페이지로도 설치는 가능해 둔다.
export function getMobileOS(userAgent: string): MobileOS | null {
  if (/iPhone|iPad|iPod/.test(userAgent)) return "ios";
  if (/Android/.test(userAgent)) return "android";
  return null;
}

/** 기기에 맞는 스토어 주소. null 이면 스토어를 고를 수 없어 안내 페이지를 보여준다. */
export function getStoreUrl(
  os: MobileOS | null,
  isPlayStoreReleased = IS_PLAY_STORE_RELEASED,
): string | null {
  if (os === "ios") return APP_STORE_URL;
  if (os === "android" && isPlayStoreReleased) return PLAY_STORE_URL;
  return null;
}

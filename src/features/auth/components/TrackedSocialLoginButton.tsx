import { withTracking } from "@/components/analytics/withTracking";
import { SocialLoginButton } from "./SocialLoginButton";

/** 메인 앱·웹 전용. OS 공유 확장의 버튼은 네비게이터에 의존하지 않는다. */
export const TrackedSocialLoginButton = withTracking(SocialLoginButton);

import { useRouter } from "expo-router";
import { useShareIntentContext } from "expo-share-intent";
import { useEffect } from "react";

import { ROUTES } from "@/constants/routes.constants";

/**
 * 외부 앱 공유(ACTION_SEND · iOS 공유 시트)로 받은 URL 을 저장 시트로 넘긴다.
 * iOS 는 webUrl 로 추출돼 오고, Android(text/*)는 text 만 올 수 있어 순서대로 취한다.
 */
export function useShareIntentRedirect() {
  const router = useRouter();
  const { hasShareIntent, shareIntent, resetShareIntent } =
    useShareIntentContext();

  useEffect(
    function redirectSharedUrlToCreateLink() {
      if (!hasShareIntent) {
        return;
      }
      const sharedUrl = shareIntent.webUrl ?? shareIntent.text;
      if (sharedUrl) {
        router.navigate({
          pathname: ROUTES.CREATE_LINK,
          params: { sharedUrl },
        });
      }
      resetShareIntent();
    },
    [hasShareIntent, shareIntent, resetShareIntent, router],
  );
}

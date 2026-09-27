import { Redirect, useLocalSearchParams } from "expo-router";
import {
  ROUTES,
  SHARE_LOGIN_NEXT_CREATE_LINK,
} from "@/constants/routes.constants";
import { useAuthGate } from "@/features/auth/hooks/useAuthGate";
import { CreateLinkSheet } from "@/features/link/CreateLinkSheet";

// 공유 익스텐션의 "앱에서 직접 입력" 딥링크로도 열린다. (tabs) 의 인증 가드는 포커스된 화면에서만
// 리다이렉트해 이 오버레이 라우트를 막지 못하므로, 로그인 안 된 콜드 스타트면 로그인 화면 위에
// 시트가 그대로 떴다 — 공유 URL 을 들고 로그인으로 보내고, 로그인 화면이 next 를 보고 시트를 다시 연다.
export default function Route() {
  const authStatus = useAuthGate();
  const { share } = useLocalSearchParams<{ share?: string }>();

  if (authStatus === "unauthenticated") {
    return (
      <Redirect
        href={{
          pathname: ROUTES.LOGIN,
          params: { next: SHARE_LOGIN_NEXT_CREATE_LINK, share: share ?? "" },
        }}
      />
    );
  }
  if (authStatus === "checking") {
    return null;
  }
  return <CreateLinkSheet />;
}

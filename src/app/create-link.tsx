import { Redirect, useLocalSearchParams } from "expo-router";
import {
  ROUTES,
  SHARE_LOGIN_NEXT_CREATE_LINK,
} from "@/constants/routes.constants";
import { useAuthGateContext } from "@/features/auth/AuthGateContext";
import { CreateLinkSheet } from "@/features/link/CreateLinkSheet";

// 공유 익스텐션의 "앱에서 직접 입력" 딥링크로도 열린다. 루트의 Stack.Protected 밖에 두는 이유 —
// 로그인 안 된 딥링크에서도 공유 URL 을 들고 로그인으로 보내야 하고, 로그인 화면이 next 를 보고 시트를 다시 연다.
export default function Route() {
  const { status: authStatus } = useAuthGateContext();
  const { share } = useLocalSearchParams<{ share?: string }>();

  if (authStatus === "unauthenticated") {
    return (
      <Redirect
        href={{
          pathname: ROUTES.LOGIN,
          params: share
            ? { next: SHARE_LOGIN_NEXT_CREATE_LINK, share }
            : { next: SHARE_LOGIN_NEXT_CREATE_LINK },
        }}
      />
    );
  }
  if (authStatus === "checking") {
    return null;
  }
  return <CreateLinkSheet />;
}

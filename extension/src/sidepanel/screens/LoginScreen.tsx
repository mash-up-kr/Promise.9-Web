import characterImage from "@assets/images/login-character.png";
import { useState } from "react";

import { openWebLogin } from "@/lib/auth/session";
import { ActionButton } from "@/sidepanel/components/ActionButton";
import { EnterHint } from "@/sidepanel/components/EnterHint";
import { useEnterShortcut } from "@/sidepanel/hooks/useEnterShortcut";

/**
 * 시안 `chrome-extension / login`.
 *
 * 로그인 자체는 여기서 하지 않는다 — 웹앱 로그인 페이지를 새 탭으로 열고, 웹앱이 결과를
 * background 에 넘기면 저장소가 바뀌면서 SidePanelApp 이 저장 화면으로 전환한다.
 * 그래서 이 화면은 "열었다" 는 상태만 갖고, 성공 콜백을 기다리지 않는다.
 */
export function LoginScreen() {
  const [hasOpened, setHasOpened] = useState(false);

  const start = () => {
    setHasOpened(true);
    void openWebLogin();
  };

  useEnterShortcut(start);

  return (
    <div className="flex h-full flex-col justify-center px-8 py-6">
      <div className="mx-auto w-full max-w-100">
        <img
          src={characterImage}
          alt=""
          className="mx-auto size-40 object-contain"
          aria-hidden
        />
        <h1 className="mt-3 text-center text-heading-3 text-text-strong">
          로그인을 해주세요
        </h1>
        <p className="mt-1.5 text-center text-body-2-reading text-text-alternative">
          {hasOpened
            ? "열린 탭에서 로그인하면 여기로 바로 이어져요"
            : "이 링크를 저장하려면 링딩동 로그인이 필요해요"}
        </p>
        <div className="mt-6">
          <ActionButton onClick={start}>
            {hasOpened ? "로그인 탭 다시 열기" : "로그인"}
          </ActionButton>
          <EnterHint />
        </div>
      </div>
    </div>
  );
}

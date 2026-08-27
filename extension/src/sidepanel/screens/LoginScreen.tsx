import characterImage from "@assets/images/login-character.png";
import { ActionButton } from "@/sidepanel/components/ActionButton";
import { EnterHint } from "@/sidepanel/components/EnterHint";
import { useEnterShortcut } from "@/sidepanel/hooks/useEnterShortcut";

export interface LoginScreenProps {
  onLogin: () => void;
}

/** 시안 `chrome-extension / login`. */
export function LoginScreen({ onLogin }: LoginScreenProps) {
  useEnterShortcut(onLogin);

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
          이 링크를 저장하려면 링딩동 로그인이 필요해요
        </p>
        <div className="mt-6">
          <ActionButton onClick={onLogin}>로그인</ActionButton>
          <EnterHint />
        </div>
      </div>
    </div>
  );
}

import characterImage from "@assets/images/login-character.png";
import { useMutation } from "@tanstack/react-query";
import { GoogleAuthCancelledError } from "@/lib/auth/googleAuth";
import { logInWithGoogle } from "@/lib/auth/session";
import { ActionButton } from "@/sidepanel/components/ActionButton";
import { EnterHint } from "@/sidepanel/components/EnterHint";
import { useEnterShortcut } from "@/sidepanel/hooks/useEnterShortcut";

export interface LoginScreenProps {
  onLoggedIn: () => void;
}

/** 시안 `chrome-extension / login`. */
export function LoginScreen({ onLoggedIn }: LoginScreenProps) {
  const login = useMutation({
    mutationFn: logInWithGoogle,
    onSuccess: onLoggedIn,
  });

  const start = () => {
    if (login.isPending) return;
    login.mutate();
  };

  useEnterShortcut(start, !login.isPending);

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

        {login.isError ? (
          <p
            role="alert"
            className="mt-3 text-center text-action-destructive text-body-3"
          >
            {loginErrorMessage(login.error)}
          </p>
        ) : null}

        <div className="mt-6">
          <ActionButton onClick={start} disabled={login.isPending}>
            {login.isPending ? "로그인 중…" : "Google로 계속하기"}
          </ActionButton>
          <EnterHint />
        </div>
      </div>
    </div>
  );
}

/** 서버·SDK 사정은 화면 문구로 옮긴다. 취소는 실패가 아니라 조용히 넘긴다. */
function loginErrorMessage(error: unknown): string | null {
  if (error instanceof GoogleAuthCancelledError) return null;

  return "로그인하지 못했어요. 잠시 후 다시 시도해주세요";
}

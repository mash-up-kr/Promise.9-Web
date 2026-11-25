import { Settings } from "lucide-react-native";
import blockedIllustration from "@/assets/illustrations/save-blocked.png";
import duplicateIllustration from "@/assets/illustrations/save-duplicate.png";
import failedIllustration from "@/assets/illustrations/save-failed.png";
import successIllustration from "@/assets/illustrations/save-success.png";
import { ActionButton } from "@/sidepanel/components/ActionButton";
import { EnterHint } from "@/sidepanel/components/EnterHint";
import { IconButton } from "@/sidepanel/components/IconButton";
import { useEnterShortcut } from "@/sidepanel/hooks/useEnterShortcut";

/** 결과 화면 종류 — 시안 save-success / save-duplicate / save-failed / retry-limit / restricted-url. */
export type ResultKind =
  | "success"
  | "duplicate"
  | "failed"
  | "retry-limit"
  | "restricted";

interface ResultContent {
  illustration: string;
  title: string;
  description: string;
  actionLabel: string;
}

const RESULT_CONTENT: Record<ResultKind, ResultContent> = {
  success: {
    illustration: successIllustration,
    title: "링크 저장을 완료했어요",
    description: "저장한 링크는 AI 요약과 함께 확인할 수 있어요",
    actionLabel: "링크 보러가기",
  },
  duplicate: {
    illustration: duplicateIllustration,
    title: "이미 저장된 링크예요",
    description: "이전에 저장한 링크를 확인해보세요",
    actionLabel: "링크 보러가기",
  },
  failed: {
    illustration: failedIllustration,
    title: "링크를 저장하지 못했어요",
    description: "네트워크 연결을 확인한 뒤 다시 시도해주세요",
    actionLabel: "다시 시도",
  },
  "retry-limit": {
    illustration: blockedIllustration,
    title: "링크를 저장하지 못했어요",
    description: "잠시 후 다시 시도해주세요",
    actionLabel: "닫기",
  },
  restricted: {
    illustration: blockedIllustration,
    title: "이 페이지는 저장할 수 없어요",
    description:
      "브라우저 내부 페이지는 링크로 저장할 수 없어요. 다른 탭에서 다시 시도해주세요.",
    actionLabel: "닫기",
  },
};

export interface ResultScreenProps {
  kind: ResultKind;
  /** 기본 설명 대신 보여줄 문구 — 저장할 수 없는 이유가 따로 있을 때. */
  description?: string;
  onAction: () => void;
  /** 없으면 설정 버튼을 두지 않는다(로그인 전). */
  onOpenSettings?: () => void;
}

export function ResultScreen({
  kind,
  description,
  onAction,
  onOpenSettings,
}: ResultScreenProps) {
  const content = RESULT_CONTENT[kind];

  useEnterShortcut(onAction);

  return (
    <div className="relative flex h-full flex-col justify-center px-8 py-6">
      {onOpenSettings ? <SettingsButton onClick={onOpenSettings} /> : null}
      <div className="mx-auto w-full max-w-100">
        <img
          src={content.illustration}
          alt=""
          className="mx-auto size-40"
          // 캐릭터·아이콘은 장식이라 스크린리더에는 아래 제목/설명만 읽히면 된다.
          aria-hidden
        />
        <h1 className="mt-3 text-center text-heading-3 text-text-strong">
          {content.title}
        </h1>
        <p className="mt-1.5 text-center text-body-2-reading text-text-alternative">
          {description ?? content.description}
        </p>
        <div className="mt-6">
          <ActionButton onClick={onAction}>{content.actionLabel}</ActionButton>
          <EnterHint />
        </div>
      </div>
    </div>
  );
}

/** 시안 settings-entry — 오른쪽 위(위 12 · 오른쪽 20). */
function SettingsButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="absolute top-3 right-5">
      <IconButton iconNode={Settings} label="설정" onClick={onClick} />
    </div>
  );
}

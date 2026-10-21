import {
  AlertDialog,
  AlertDialogButton,
} from "@/components/ui/alert-dialog/AlertDialog";

export interface UpdateDialogProps {
  /** force 는 닫을 수 없는 차단 안내, recommend 는 건너뛸 수 있는 권유. */
  kind: "force" | "recommend";
  latestVersion: string;
  onDismiss: () => void;
  onUpdate: () => void;
}

const FORCE_COPY = {
  title: "업데이트가 필요해요",
  description:
    "지금 설치된 버전은 더 이상 지원되지 않아요. 최신 버전으로 업데이트해 주세요.",
} as const;

export function UpdateDialog({
  kind,
  latestVersion,
  onDismiss,
  onUpdate,
}: UpdateDialogProps) {
  const isForced = kind === "force";

  return (
    <AlertDialog
      isOpen
      // 차단 안내는 배경 탭·안드로이드 뒤로 가기로도 닫히지 않는다 — 닫을 길은 업데이트뿐이다.
      onClose={isForced ? noop : onDismiss}
      closeOnOverlayClick={!isForced}
      title={isForced ? FORCE_COPY.title : "새 버전이 나왔어요"}
      description={
        isForced
          ? FORCE_COPY.description
          : `v${latestVersion} 업데이트에서 더 편해진 링띵동을 만나보세요.`
      }
      actions={
        <>
          {!isForced && (
            <AlertDialogButton
              label="나중에"
              variant="secondary"
              onPress={onDismiss}
            />
          )}
          <AlertDialogButton
            label="업데이트"
            variant="primary"
            onPress={onUpdate}
          />
        </>
      }
    />
  );
}

function noop() {}

import {
  AlertDialog,
  AlertDialogButton,
} from "@/components/ui/alert-dialog/AlertDialog";

export interface DuplicateFolderNameAlertProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 폴더 이름 중복 안내 (Figma `archive / folder-create / duplicate`).
 *
 * 생성·편집 시트가 같은 문구를 쓰므로 한 컴포넌트로 둔다. 입력값을 잃지 않도록 시트는
 * 닫지 않고, 확인을 누르면 이름을 고쳐 다시 저장할 수 있게 한다.
 */
export function DuplicateFolderNameAlert({
  isOpen,
  onClose,
}: DuplicateFolderNameAlertProps) {
  return (
    <AlertDialog
      isOpen={isOpen}
      onClose={onClose}
      title="같은 이름의 폴더가 있어요"
      description="다른 이름을 입력해 주세요"
      actions={
        <AlertDialogButton label="확인" variant="secondary" onPress={onClose} />
      }
    />
  );
}
